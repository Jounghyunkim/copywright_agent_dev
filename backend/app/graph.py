from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[str], "The history of messages in the conversation"]
    next_step: str

# Define node functions (Copywright Agent Process)
def briefing_analyzer(state: AgentState):
    print("--- STEP 1: BRIEFING & ANALYSIS ---")
    # 제품 특성, 타겟, 목표 설정 로직
    return {"next_step": "market_researcher"}

def market_researcher(state: AgentState):
    print("--- STEP 2: MARKET & TARGET RESEARCH ---")
    # 지역별 문화 특성, 경쟁사 메시지 분석 (RAG 활용 가능)
    return {"next_step": "copy_generator"}

def copy_generator(state: AgentState):
    print("--- STEP 3: COPY DRAFTING (IDEATION) ---")
    # 다양한 톤앤매너의 카피 생성
    return {"messages": ["Draft copy generated."], "next_step": "compliance_reviewer"}

def compliance_reviewer(state: AgentState):
    print("--- STEP 4: REVIEW & COMPLIANCE ---")
    # 브랜드 가이드라인 및 법적 규제 검토
    return {"next_step": END}

# Build the graph
workflow = StateGraph(AgentState)

workflow.add_node("briefing", briefing_analyzer)
workflow.add_node("researcher", market_researcher)
workflow.add_node("generator", copy_generator)
workflow.add_node("reviewer", compliance_reviewer)

workflow.set_entry_point("briefing")
workflow.add_edge("briefing", "researcher")
workflow.add_edge("researcher", "generator")
workflow.add_edge("generator", "reviewer")
workflow.add_edge("reviewer", END)

# Compile
app_graph = workflow.compile()

print("LangGraph for Copylight Agent initialized.")
