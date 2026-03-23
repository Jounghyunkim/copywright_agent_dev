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

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = AI 워싱 리스크 없음, 0 = 심각한 리스크),
  "strengths": ["강점 내용 — AI 표현이 적절하게 사용된 부분 설명"],
  "weaknesses": ["약점 내용 — AI 관련 과장/오해 소지가 있는 부분 설명"],
  "improvements": ["보완 내용 — 구체적인 수정 제안 (원문 → 수정안 형태)"]
}

IMPORTANT: strengths, weaknesses, improvements 각각 한국어 문자열 배열로 작성하세요. 해당 항목이 없으면 빈 배열 []을 반환하세요."""


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
        HumanMessage(content=f"## 검토 대상 카피\n{copy_text}\n\n## 브리프 컨텍스트\n{json.dumps(context.get('brief_summary', ''), ensure_ascii=False)}"),
    ]
    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)
    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 100),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "improvements": result.get("improvements", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }
