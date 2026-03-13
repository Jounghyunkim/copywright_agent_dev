from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[str], "The history of messages in the conversation"]
    next_step: str

# Define node functions (Placeholders for Multi-Agent logic)
def input_analyzer(state: AgentState):
    print("---ANALYZING INPUT---")
    # Logic to decide which agent to call
    return {"next_step": "research_agent"}

def research_agent(state: AgentState):
    print("---RESEARCHING (RAG)---")
    # Azure OpenAI + RAG Logic goes here
    return {"messages": ["Research result found."], "next_step": END}

# Build the graph
workflow = StateGraph(AgentState)

workflow.add_node("analyzer", input_analyzer)
workflow.add_node("researcher", research_agent)

workflow.set_entry_point("analyzer")
workflow.add_edge("analyzer", "researcher")
workflow.add_edge("researcher", END)

# Compile
app_graph = workflow.compile()

print("LangGraph for Copylight Agent initialized.")
