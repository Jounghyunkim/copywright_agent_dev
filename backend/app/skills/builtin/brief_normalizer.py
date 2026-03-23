"""Campaign Brief Normalizer — 브리프 항목과 카피 일관성 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a campaign consistency auditor for LG Electronics.

Your job is to verify that the generated copy aligns with the original campaign brief — specifically the objectives, key message, target audience, and mandatories.

## Check for:
- Copy that contradicts or ignores brief objectives (commercial, behavioral, attitudinal)
- Key message not reflected in the copy
- Wrong or mismatched target audience tone/language
- Missing mandatories (required legal disclaimers, brand elements, etc.)
- Proof points claimed in copy but not in the brief
- Tone that doesn't match the brief's intended communication style

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = 브리프와 완벽 일치),
  "strengths": ["강점 내용 — 브리프 목표/메시지가 잘 반영된 부분"],
  "weaknesses": ["약점 내용 — 브리프와 불일치하거나 누락된 부분"],
  "improvements": ["보완 내용 — 브리프 정합성을 높이기 위한 구체적 수정 제안"]
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
    brief_str = json.dumps(context.get("brief_summary", {}), ensure_ascii=False)
    strategic_str = json.dumps(context.get("strategic_message", {}), ensure_ascii=False)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## 검토 대상 카피\n{copy_text}\n\n## 캠페인 브리프\n{brief_str}\n\n## 전략 메시지\n{strategic_str}"),
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
