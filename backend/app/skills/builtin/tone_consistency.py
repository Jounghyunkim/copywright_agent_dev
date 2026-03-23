"""Tone Consistency Guard — 톤 앤 매너 일관성 유지 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a tone and voice consistency reviewer for LG Electronics campaigns.

Your job is to verify that the advertising copy maintains a consistent tone across all elements (headline, subheadline, body, CTA) and aligns with the strategic tone direction.

## Check for:
- Tone shifts between headline and body copy (e.g., playful headline → formal body)
- CTA tone mismatch (e.g., warm body → aggressive CTA)
- Deviation from the strategic tone direction (primary tone, avoid list, voice character)
- Inconsistent formality level within the same copy
- Emotional register jumps (e.g., aspirational → fear-based within same copy)
- Brand voice deviation from LG's "confident but not arrogant, warm but not casual" guideline

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = 톤 완벽 일관성),
  "strengths": ["강점 내용 — 톤이 일관되게 유지된 부분"],
  "weaknesses": ["약점 내용 — 톤 불일치 또는 브랜드 보이스 이탈 부분"],
  "improvements": ["보완 내용 — 톤 일관성을 높이기 위한 구체적 수정 제안"]
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
    strategic_str = json.dumps(context.get("strategic_message", {}), ensure_ascii=False)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## 검토 대상 카피\n{copy_text}\n\n## 전략적 톤 방향\n{strategic_str}"),
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
