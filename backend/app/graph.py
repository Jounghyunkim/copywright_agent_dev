from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[str], "The history of messages in the conversation"]
    context: dict  # 제품 정보, 타겟 국가 등 저장
    candidates: List[dict] # 생성된 카피 후보들
    feedback: str # 인간의 피드백
    approval: bool # 마케터 승인 여부
    next_step: str

# Define node functions (Reflected Design Philosophy)
def briefing_analyzer(state: AgentState):
    print("--- STEP 1: LOCALIZED BRIEFING ---")
    # 국가별 맞춤형 분석 로직 (미국/독일/인도 등)
    return {"next_step": "human_gate_1"}

def human_gate_1(state: AgentState):
    print("--- HUMAN IN THE LOOP: BRIEFING APPROVAL ---")
    # 마케터의 브리핑 확인 및 컨펌 대기
    return {"next_step": "debate_generator"}

def debate_generator(state: AgentState):
    print("--- STEP 2: MULTI-AGENT DEBATE (Generator & Critic) ---")
    # 생성자 vs 비판자 토론을 통한 품질 고도화
    return {"next_step": "human_gate_2"}

def human_gate_2(state: AgentState):
    print("--- HUMAN IN THE LOOP: FINAL COPY SELECTION ---")
    # 최종 카피 후보군 제안 및 마케터 최종 선택
    return {"next_step": END}

# Build the graph
workflow = StateGraph(AgentState)

workflow.add_node("briefing", briefing_analyzer)
workflow.add_node("human_check_1", human_gate_1)
workflow.add_node("debate_engine", debate_generator)
workflow.add_node("human_check_2", human_gate_2)

workflow.set_entry_point("briefing")
workflow.add_edge("briefing", "human_check_1")
workflow.add_edge("human_check_1", "debate_engine")
workflow.add_edge("debate_engine", "human_check_2")
workflow.add_edge("human_check_2", END)

# Compile
app_graph = workflow.compile()

print("LangGraph for Copylight Agent initialized.")
