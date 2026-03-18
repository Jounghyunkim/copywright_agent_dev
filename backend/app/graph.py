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
    briefSummary: dict = Field(description="Keys: objective, coreChallenge, aiDirection, toneRole")
    persona: dict = Field(description="Keys: avatar, name, belief, frustration, purchaseTrigger, emotionalTriggerWords")
    brandFit: dict = Field(description="Keys: score(0-100), functionalFit, emotionalFit, culturalFit")
    marketAnalysis: dict = Field(description="Keys: opportunityGap, riskKeyword, untappedKeywords(list)")
    competitiveKeywords: list = Field(description="List of {word: str, count: int(0-100)}")
    categoryNarrative: dict = Field(description="Keys: oldNarrative, newNarrative")
    emotionalJTBD: str = Field(description="Single sentence: the emotional job-to-be-done")
    culturalTension: dict = Field(description="Keys: tensions(list of strings)")
    copyImplications: dict = Field(description="Keys: doList(list), dontList(list)")
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

    prompt_template = """You are a world-class marketing strategist and copywriting director specializing in LG Electronics global campaigns.

Your role: Produce a Market Analyst Report that defines "the context in which words work."
This report is NOT a market summary — it is the strategic foundation that tells copywriters WHAT language will resonate and WHY.

Principle:
- Brief = Direction
- Market Analyst Report = The context in which messages survive or die
- Copy = Execution

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

### Field-specific guidelines (FOLLOW PRECISELY):

---

**1. briefSummary** — Transform the brief into copywriting-ready strategic language. Do NOT merely summarize the brief.
- "objective": One-sentence strategic objective that reframes the business goal as a communication mission
- "coreChallenge": The single biggest communication barrier this campaign must break through, informed by competitive landscape
- "aiDirection": A creative direction statement for copywriters. Example tone: "Write copy that makes people feel the difference before they understand the specs."
- "toneRole": Declare the copy's tone and role. Example: "The copy should act as a quiet invitation, not a loud announcement."

---

**2. persona** — NOT demographics. Build a psychographic portrait that reveals how this person SEES THE WORLD.
- "avatar": DiceBear URL like "https://api.dicebear.com/7.x/personas/svg?seed=<FirstName>"
- "name": A vivid persona archetype name. Example: "The Experience Seeker" or "The Quiet Optimizer"
- "belief": What they currently believe about this product category. Example: "All TVs look great now."
- "frustration": Their hidden, unarticulated frustration. Example: "I don't feel the 'wow' anymore."
- "purchaseTrigger": What would make them act NOW. Example: "A moment that feels cinematic, quiet, immersive."
- "emotionalTriggerWords": Array of 4-6 words/phrases that emotionally resonate with this persona.

---

**3. brandFit** — Assess whether LG can NATURALLY own this message, or must work to earn it.
- "score": Integer 0-100. High score = declarative copy possible. Low score = explanatory copy needed.
- "functionalFit": One sentence on product/technology alignment
- "emotionalFit": One sentence on alignment with LG's "Life's Good" emotional territory (optimism, warmth, humanity)
- "culturalFit": One sentence on alignment with current cultural/zeitgeist movements

---

**4. marketAnalysis** — Define where the message can WIN and where it can FAIL.
- "opportunityGap": The specific messaging space competitors have NOT claimed. This directly tells copywriters what angle to amplify.
- "riskKeyword": The specific expression, framing, or territory to AVOID because it will blend into category noise or trigger negative associations.
- "untappedKeywords": Array of 5-8 keywords/phrases. These must be sensory/emotional/experiential words, NOT technical specs. Good: "Silence", "Depth", "Presence". Bad: "8K", "120Hz", "HDMI 2.1".

---

**5. competitiveKeywords** — Language territory already OCCUPIED by competitors. These are words whose meaning is EXHAUSTED.
Array of 5-7 objects:
- "word": A keyword/phrase competitors actively own (from web search data)
- "count": Relative saturation score 0-100 (100 = completely owned/overused)
Copy should intentionally AVOID or REDEFINE these words.

---

**6. categoryNarrative** — How the market has been talking vs how we will talk.
- "oldNarrative": The dominant category story. Example: "Better TV = Brighter, Bigger, More Numbers"
- "newNarrative": The narrative LG will establish. Example: "Better TV = Deeper feelings, quieter moments, real immersion"
Without this, copy always regresses to category language.

---

**7. emotionalJTBD** — The Emotional Job To Be Done. A single sentence capturing what the consumer wants to FEEL.
This becomes the root sentence of all copy. Example: "I want my time at home to feel meaningful, not just entertaining."

---

**8. culturalTension** — The cultural/emotional tensions people feel RIGHT NOW that the campaign can tap into.
- "tensions": Array of 2-4 tension pairs. Example: ["Louder world vs desire for quiet depth", "More content vs less real feeling"]

---

**9. copyImplications** — Concrete creative guardrails for copywriters.
- "doList": Array of 3-5 actionable directives. Example: ["Write slowly, visually, emotionally", "Use sensory language over specs", "Let silence speak"]
- "dontList": Array of 3-5 things to avoid. Example: ["Don't explain OLED like a spec sheet", "Don't shout superiority", "Don't use competitor comparison language"]

---

**10. recommendedKeywords** — Array of 5-8 keyword strings. Mix of:
- Words from untapped territory
- Words that match the new narrative
- Words aligned with emotionalJTBD and persona trigger words

---

CRITICAL RULES:
1. Base competitive analysis on ACTUAL data from web search results. Cite specific competitors.
2. All text in the SAME LANGUAGE as the brief (Korean if brief is Korean, English if English).
3. Every field must serve COPYWRITING — if it doesn't help a copywriter write better copy, rewrite it until it does.
4. Return ONLY valid JSON. No markdown, no explanation outside JSON."""

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
