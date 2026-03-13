from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[str], "The history of messages in the conversation"]
    context: dict  # 제품 정보, 타겟 국가, 연령대, 페르소나, 로컬 키워드 등
    candidates: List[dict] # 생성된 카피 후보들 (문구, 기획의도, 적합성 점수 등 포함)
    critic_feedback: List[str] # Brand Critic의 피드백
    approval: bool # 마케터 승인 여부
    current_step: str

# (1) Market Analyst Agent: 시장 분석 및 페르소나 추출
def market_analyst(state: AgentState):
    print("--- AGENT 1: MARKET ANALYST ---")
    # TODO: RAG 연동하여 경쟁사 카피 및 로컬 키워드 도출 로직 구현
    return {"current_step": "market_analysis_done", "context": {"persona": "...", "keywords": []}}

# (2) Copy Generator Agent: 다양한 관점의 카피 생성
def copy_generator(state: AgentState):
    print("--- AGENT 2: COPY GENERATOR ---")
    # TODO: 감성적/기술적 등 멀티 페르소나 기반 생성 로직 구현
    return {"current_step": "copy_generation_done", "candidates": []}

# (3) Brand Critic Agent: LG BCG 기반 품질 검증
def brand_critic(state: AgentState):
    print("--- AGENT 3: BRAND CRITIC (Self-Correction) ---")
    # TODO: LG 브랜드 가이드라인 기반 체크 및 수정 제안 로직 구현
    return {"current_step": "brand_review_done", "critic_feedback": []}

# (4) Decision Support: 최종 리포트 및 마케터 컨펌 (HITL)
def decision_support(state: AgentState):
    print("--- STEP 4: DECISION SUPPORT & HITL ---")
    # TODO: 상세 리포트 생성 및 최종 승인 대기 로직
    return {"current_step": "waiting_for_human"}

# Build the workflow graph
workflow = StateGraph(AgentState)

workflow.add_node("analyst", market_analyst)
workflow.add_node("generator", copy_generator)
workflow.add_node("critic", brand_critic)
workflow.add_node("support", decision_support)

workflow.set_entry_point("analyst")
workflow.add_edge("analyst", "generator")
workflow.add_edge("generator", "critic")
workflow.add_edge("critic", "support")
workflow.add_edge("support", END)

app_graph = workflow.compile()

# Compile
app_graph = workflow.compile()

print("LangGraph for Copylight Agent initialized.")
