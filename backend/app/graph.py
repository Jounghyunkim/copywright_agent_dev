from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    brief: dict
    analysis_report: dict
    current_step: str

def market_analyst(state: AgentState):
    print("--- AGENT 1: MARKET ANALYST (SIMULATED) ---")
    brief = state.get("brief", {})
    target_country = brief.get("targetCountry", "Unknown")

    # --- RAG & LLM Simulation ---
    # Based on the input, create a simulated analysis.
    persona_name = "Global Nomad"
    if target_country == "USA":
        persona_name = "American Dreamer"
    elif target_country == "Germany":
        persona_name = "German Meister"
    elif target_country == "India":
        persona_name = "Digital Indian"
        
    simulated_report = {
        "briefSummary": {
            "objective": f"Successfully analyzed objective for {target_country}.",
            "coreChallenge": "Identified core challenges in the target market.",
            "aiDirection": "Direction set to focus on local nuances."
        },
        "persona": {
            "name": persona_name,
            "details": f"A persona tailored for the {target_country} market."
        },
        "brandFit": { "score": 93 },
        "marketAnalysis": {
            "opportunityGap": "Found a key opportunity gap in the market.",
            "riskKeyword": "Identified potential risk keywords to avoid.",
            "untappedKeywords": ["Local-first", "Community", "Authenticity"]
        },
        "competitiveKeywords": [{"word": "Competitor A", "count": 80}],
        "recommendedKeywords": ["Value", "Trust", "Innovation"]
    }
    # --- End Simulation ---

    return {"analysis_report": simulated_report, "current_step": "analysis_done"}

workflow = StateGraph(AgentState)

workflow.add_node("analyst", market_analyst)
workflow.set_entry_point("analyst")
workflow.add_edge("analyst", END)

app_graph = workflow.compile()

# Compile
app_graph = workflow.compile()

print("LangGraph for Copylight Agent initialized.")
