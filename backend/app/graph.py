import os
from dotenv import load_dotenv
from typing import TypedDict
from langgraph.graph import StateGraph, END

from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# --- Load Environment Variables ---
load_dotenv(dotenv_path='.env')

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_MODEL = os.getenv("AZURE_OPENAI_DEPLOYMENT")
EMBEDDING_DEPLOYMENT = os.getenv("EMBEDDING_DEPLOYMENT")
EMBEDDING_ENDPOINT = os.getenv("EMBEDDING_ENDPOINT")

FAISS_INDEX_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "faiss_index")

# --- Pydantic Model for LLM Output ---
class AnalysisReport(BaseModel):
    briefSummary: dict = Field(description="A summary and reinterpretation of the user's brief.")
    persona: dict = Field(description="A detailed persona analysis for the target audience.")
    marketAnalysis: dict = Field(description="Analysis of market opportunities, risks, and untapped keywords.")
    brandFit: dict = Field(description="A score and analysis of brand guideline alignment.")
    competitiveKeywords: list = Field(description="A list of keywords used by competitors.")
    recommendedKeywords: list = Field(description="A list of keywords recommended for the campaign.")

# --- Agent State ---
class AgentState(TypedDict):
    brief: dict
    analysis_report: dict

# --- RAG + LLM Logic for Market Analyst ---
async def market_analyst(state: AgentState):
    print("--- AGENT 1: MARKET ANALYST (REAL RAG + LLM) ---")
    brief = state.get("brief", {})
    query = f"Campaign for {brief.get('projectName')}. Key message: {brief.get('keyMessage')}. Market: {brief.get('marketNeeds')}. Audience: {brief.get('audience')}"

    # 1. Initialize models
    embeddings = AzureOpenAIEmbeddings(azure_deployment=EMBEDDING_DEPLOYMENT, api_version=AZURE_OPENAI_API_VERSION, azure_endpoint=EMBEDDING_ENDPOINT)
    llm = AzureChatOpenAI(azure_deployment=AZURE_OPENAI_MODEL, api_version=AZURE_OPENAI_API_VERSION, azure_endpoint=AZURE_OPENAI_ENDPOINT, temperature=0)

    # 2. Load local FAISS index and retrieve documents
    print(f"Loading FAISS index from {FAISS_INDEX_PATH}...")
    vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    retrieved_docs = await retriever.ainvoke(query)
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])
    print("Retrieved relevant context from knowledge base.")

    # 3. Define prompt and chain
    parser = JsonOutputParser(pydantic_object=AnalysisReport)
    prompt_template = """
    You are a world-class marketing strategist for LG. Based on the provided context and the campaign brief, generate a detailed market analysis report.
    Provide your output in a JSON format that adheres to the following schema: {format_instructions}

    **Retrieved Context from Past Campaigns:**
    {context}

    **Current Campaign Brief (LG Standard Format):**
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

    Now, generate the detailed analysis report as JSON.
    """
    prompt = ChatPromptTemplate.from_template(
        prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = prompt | llm | parser
    print("Invoking LLM for analysis...")

    # 4. Invoke chain and get result
    report = await chain.ainvoke({
        "context": context,
        **brief
    })

    return {"analysis_report": report}

# --- Build Graph ---
workflow = StateGraph(AgentState)
workflow.add_node("analyst", market_analyst)
workflow.set_entry_point("analyst")
workflow.add_edge("analyst", END)
app_graph = workflow.compile()
print("LangGraph for Copywrite Agent compiled with RAG and LLM logic.")
