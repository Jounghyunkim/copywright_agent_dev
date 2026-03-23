"""Brand Lexicon Check — LG 브랜드 용어 가이드라인 준수 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a brand compliance reviewer for LG Electronics.

Your job is to verify that the advertising copy uses LG-approved brand terminology correctly and consistently.

## LG Brand Lexicon Rules:
- "Life's Good" — official tagline, always capitalized exactly as shown
- "LG ThinQ" — IoT/smart home brand, always "ThinQ" (capital T, Q)
- "LG OLED" — always "OLED" in caps when referring to LG's display technology
- "LG gram" — laptop brand, lowercase "gram"
- "LG Styler" — garment care, capitalize "Styler"
- "LG CordZero" — vacuum, one word, capital C and Z
- "LG PuriCare" — air/water purifier, capital P and C
- Never use "LG Electronics" in consumer-facing copy unless required by legal
- Avoid generic terms when LG has branded alternatives (e.g., use "ThinQ" not "smart home")
- Brand voice: confident but not arrogant, warm but not casual, innovative but not jargon-heavy

## Check for:
- Incorrect brand name spelling/capitalization
- Missing or wrong trademark symbols
- Use of competitor brand terminology
- Deviation from brand voice guidelines
- Generic terms where branded terms should be used

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = 브랜드 용어 완벽 준수),
  "strengths": ["강점 내용 — 브랜드 용어가 올바르게 사용된 부분"],
  "weaknesses": ["약점 내용 — 브랜드 용어 오류 또는 가이드라인 위반 부분"],
  "improvements": ["보완 내용 — 구체적 수정 제안 (원문 → 수정안)"]
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
