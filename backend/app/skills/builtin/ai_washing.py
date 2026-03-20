"""AI Washing Risk Check — 카피 텍스트에서 AI 관련 과장/오해 소지 표현 감지"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are an AI claims compliance reviewer for LG Electronics advertising copy.

Your job is to detect AI-related exaggerations, vague claims, and misleading expressions in the given copy text.

## What to flag:
- Vague AI claims without concrete benefit proof ("AI-powered", "smart", "intelligent" without specifics)
- Over-promising language ("AI that understands you perfectly", "AI does everything for you")
- Claims that imply sentience or autonomous decision-making
- Use of "AI" as a marketing buzzword without substantive backing
- Claims that could mislead consumers about what the AI actually does

## What is acceptable:
- Specific, verifiable AI feature descriptions ("AI-based noise reduction reduces background noise by 40%")
- Qualified claims ("AI-assisted", "AI helps optimize")
- Technical accuracy with proof points

Respond ONLY with a valid JSON object:
{
  "passed": true/false,
  "score": 0-100 (100 = no AI washing risk, 0 = severe risk),
  "findings": [
    {"severity": "high|medium|low", "message": "description of the issue", "location": "headline|subheadline|bodyCopy|cta"}
  ],
  "suggestions": [
    {"original": "problematic text", "suggested": "improved text", "reason": "why this is better"}
  ]
}"""


async def run(copy_text: str, context: dict) -> dict:
    start = time.perf_counter()
    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0,
    )
    parser = JsonOutputParser()
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## Copy to review\n{copy_text}\n\n## Brief context\n{json.dumps(context.get('brief_summary', ''), ensure_ascii=False)}"),
    ]
    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)
    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 100),
        "findings": result.get("findings", []),
        "suggestions": result.get("suggestions", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }
