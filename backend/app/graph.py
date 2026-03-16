import os
from dotenv import load_dotenv
from typing import TypedDict
from langgraph.graph import StateGraph, END

from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from pydantic import BaseModel, Field

# --- Load Environment Variables ---
load_dotenv(dotenv_path='.env')

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_MODEL = os.getenv("AZURE_OPENAI_DEPLOYMENT")
EMBEDDING_DEPLOYMENT = os.getenv("EMBEDDING_DEPLOYMENT")
EMBEDDING_ENDPOINT = os.getenv("EMBEDDING_ENDPOINT")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

FAISS_INDEX_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "faiss_index")


# ============================================================
# Pydantic Model for Final Report (matches frontend schema)
# ============================================================
class AnalysisReport(BaseModel):
    briefSummary: dict = Field(description="A summary with keys: objective, coreChallenge, aiDirection")
    persona: dict = Field(description="Target persona with keys: avatar, name, painPoint, motivation")
    marketAnalysis: dict = Field(description="Market analysis with keys: opportunityGap, riskKeyword, untappedKeywords")
    brandFit: dict = Field(description="Brand fit with keys: score (0-100 int), positiveSignals")
    competitiveKeywords: list = Field(description="List of {word: str, count: int (0-100)}")
    recommendedKeywords: list = Field(description="List of recommended keyword strings")


# ============================================================
# Agent State — carries data between nodes
# ============================================================
class AgentState(TypedDict):
    brief: dict
    search_queries: list
    web_results: list
    rag_results: list
    analysis_report: dict


# ============================================================
# Shared LLM factory
# ============================================================
def _get_llm(temperature=0):
    return AzureChatOpenAI(
        azure_deployment=AZURE_OPENAI_MODEL,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        temperature=temperature,
    )


# ============================================================
# NODE 1: Query Planner — generates targeted search queries
# ============================================================
async def query_planner(state: AgentState):
    print("--- NODE 1: QUERY PLANNER ---")
    brief = state.get("brief", {})

    llm = _get_llm(temperature=0)
    prompt = ChatPromptTemplate.from_template("""You are a market research strategist for LG Electronics.
Given the campaign brief below, generate exactly 4 web search queries in English that will help produce a comprehensive market analysis report.

Focus on:
1. Competitor landscape and positioning for this product category in the target market
2. Consumer trends and behavior in the target audience segment
3. Market size, growth, and key industry trends
4. Advertising/messaging trends competitors are using

**Campaign Brief:**
- Project: {projectName}
- Context: {projectContext}
- Audience: {audience}
- Key Message: {keyMessage}
- Market: {marketNeeds}
- Proof Points: {proofPoints}

Return ONLY a JSON array of 4 query strings. Example: ["query 1", "query 2", "query 3", "query 4"]""")

    chain = prompt | llm | StrOutputParser()
    raw = await chain.ainvoke(brief)

    # Parse the JSON array from LLM response
    import json
    try:
        queries = json.loads(raw.strip())
        if not isinstance(queries, list):
            queries = [raw.strip()]
    except json.JSONDecodeError:
        # Fallback: create basic queries from brief
        queries = [
            f"{brief.get('projectName', '')} market analysis {brief.get('marketNeeds', '')}",
            f"{brief.get('projectName', '')} competitor analysis 2026",
            f"LG {brief.get('audience', '')} consumer trends",
            f"{brief.get('projectName', '')} advertising strategy trends",
        ]

    print(f"Generated {len(queries)} search queries: {queries}")
    return {"search_queries": queries}


# ============================================================
# NODE 2a: Web Search — gathers real-time market intelligence
# ============================================================
async def web_search(state: AgentState):
    print("--- NODE 2a: WEB SEARCH ---")
    queries = state.get("search_queries", [])
    all_results = []

    if not TAVILY_API_KEY:
        print("WARNING: TAVILY_API_KEY not set. Skipping web search.")
        return {"web_results": []}

    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=TAVILY_API_KEY)

        seen_urls = set()
        for query in queries[:4]:
            try:
                response = await client.search(query=query, max_results=3, search_depth="basic")
                for result in response.get("results", []):
                    url = result.get("url", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        all_results.append({
                            "title": result.get("title", ""),
                            "url": url,
                            "content": result.get("content", "")[:500],
                        })
            except Exception as e:
                print(f"Search query failed: {query} — {e}")
                continue

        print(f"Web search returned {len(all_results)} unique results.")
    except Exception as e:
        print(f"Web search module error: {e}. Proceeding without web results.")

    return {"web_results": all_results}


# ============================================================
# NODE 2b: Enhanced RAG — multi-query retrieval from FAISS
# ============================================================
async def enhanced_rag(state: AgentState):
    print("--- NODE 2b: ENHANCED RAG ---")
    brief = state.get("brief", {})
    search_queries = state.get("search_queries", [])

    try:
        embeddings = AzureOpenAIEmbeddings(
            azure_deployment=EMBEDDING_DEPLOYMENT,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=EMBEDDING_ENDPOINT,
        )
        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})

        # Build diverse query set: brief-based + search queries
        rag_queries = [
            f"Campaign for {brief.get('projectName', '')}. Audience: {brief.get('audience', '')}. Key message: {brief.get('keyMessage', '')}",
            f"LG {brief.get('projectName', '')} {brief.get('marketNeeds', '')} advertising copy",
        ] + [q for q in search_queries[:2]]

        # Multi-query retrieval with deduplication
        seen_content = set()
        all_docs = []
        for query in rag_queries:
            try:
                docs = await retriever.ainvoke(query)
                for doc in docs:
                    content_hash = hash(doc.page_content[:100])
                    if content_hash not in seen_content:
                        seen_content.add(content_hash)
                        all_docs.append(doc.page_content)
            except Exception as e:
                print(f"RAG query failed: {e}")
                continue

        print(f"RAG retrieved {len(all_docs)} unique documents.")
        return {"rag_results": all_docs}

    except FileNotFoundError:
        print("WARNING: FAISS index not found. Proceeding without RAG results.")
        return {"rag_results": []}
    except Exception as e:
        print(f"RAG error: {e}. Proceeding without RAG results.")
        return {"rag_results": []}


# ============================================================
# NODE 3: Synthesizer — combines all intelligence into report
# ============================================================
async def synthesizer(state: AgentState):
    print("--- NODE 3: SYNTHESIZER ---")
    brief = state.get("brief", {})
    web_results = state.get("web_results", [])
    rag_results = state.get("rag_results", [])

    # Format web search results
    if web_results:
        web_context = "\n\n".join([
            f"**[{r['title']}]({r['url']})**\n{r['content']}"
            for r in web_results[:8]
        ])
    else:
        web_context = "(No web search results available. Rely on historical data and your expertise.)"

    # Format RAG results
    rag_context = "\n\n---\n\n".join(rag_results) if rag_results else "(No historical campaign data available.)"

    llm = _get_llm(temperature=0)
    parser = JsonOutputParser(pydantic_object=AnalysisReport)

    prompt_template = """You are a world-class marketing strategist specializing in LG Electronics campaigns.
Produce a data-driven market analysis report by synthesizing real-time market intelligence, historical campaign data, and the campaign brief.

## REAL-TIME MARKET INTELLIGENCE (from web search)
{web_context}

## HISTORICAL LG CAMPAIGN REFERENCES (from knowledge base)
{rag_context}

## CAMPAIGN BRIEF (LG Standard Format)
- Project Name: {projectName}
- Date: {date}
- Project Context: {projectContext}
- Commercial Objective: {objectiveCommercial}
- Behavior Objective: {objectiveBehavior}
- Attitudinal Objective: {objectiveAttitudinal}
- Target Audience: {audience}
- Key Message: {keyMessage}
- Proof Points: {proofPoints}
- Mandatories: {mandatories}
- Budget: {budget}
- Market Needs: {marketNeeds}
- Timing: {timing}

## OUTPUT INSTRUCTIONS
Generate a detailed analysis report as JSON with this EXACT structure:
{format_instructions}

### Field-specific guidelines:

**briefSummary**: Synthesize the brief into strategic direction.
- "objective": One-sentence strategic objective derived from the 3 objectives in the brief
- "coreChallenge": The single biggest challenge this campaign must overcome, informed by web search competitive data
- "aiDirection": Your recommended creative/strategic direction based on the market opportunity gap

**persona**: Create a vivid, specific persona from the audience description.
- "avatar": Generate a DiceBear avatar URL like "https://api.dicebear.com/7.x/personas/svg?seed=<FirstName>" using the persona's name
- "name": A realistic name matching the target market/country
- "painPoint": A specific, emotionally resonant pain point informed by audience research
- "motivation": What drives this persona to consider LG's product

**marketAnalysis**: Data-driven market insights.
- "opportunityGap": A SPECIFIC messaging angle that competitors are NOT using but the brief's key message could exploit. Reference actual competitor data from web search if available.
- "riskKeyword": A specific competitive threat or market risk the campaign must be aware of
- "untappedKeywords": Array of 5-8 keyword/phrase strings that represent untapped messaging opportunities. These should be informed by competitor analysis gaps found in web search.

**brandFit**: Evaluate alignment with LG's "Life's Good" brand philosophy.
- "score": Integer 0-100. Score based on: key message alignment with LG values, tone consistency, audience-brand match
- "positiveSignals": One sentence summarizing why the score is what it is

**competitiveKeywords**: Array of 5-7 objects, each with:
- "word": A keyword or phrase competitors are actively using (from web search data)
- "count": Relative frequency/prominence score 0-100

**recommendedKeywords**: Array of 5-8 keyword strings recommended for this campaign. Mix of competitive must-haves and differentiation opportunities.

IMPORTANT: Base competitive analysis on ACTUAL data from the web search results. Cite specific competitor names and trends where possible. All text values should be in Korean unless the brief is in English. Return ONLY valid JSON."""

    prompt = ChatPromptTemplate.from_template(
        prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = prompt | llm | parser
    print("Invoking synthesizer LLM...")

    report = await chain.ainvoke({
        "web_context": web_context,
        "rag_context": rag_context,
        **brief,
    })

    return {"analysis_report": report}


# ============================================================
# Build LangGraph Workflow
# ============================================================
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("query_planner", query_planner)
workflow.add_node("web_search", web_search)
workflow.add_node("enhanced_rag", enhanced_rag)
workflow.add_node("synthesizer", synthesizer)

# Define edges: query_planner fans out to web_search and enhanced_rag, both converge on synthesizer
workflow.set_entry_point("query_planner")
workflow.add_edge("query_planner", "web_search")
workflow.add_edge("query_planner", "enhanced_rag")
workflow.add_edge("web_search", "synthesizer")
workflow.add_edge("enhanced_rag", "synthesizer")
workflow.add_edge("synthesizer", END)

app_graph = workflow.compile()
print("LangGraph compiled: query_planner → [web_search ∥ enhanced_rag] → synthesizer → END")
