"""Cultural Sensitivity Check — 문화적 민감성 및 현지화 적합성 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a cultural sensitivity and localization reviewer for LG Electronics global campaigns.

Your job is to verify that the advertising copy is culturally appropriate and properly localized for the target market.

## Check for:
- Culturally offensive or insensitive expressions, metaphors, or imagery references
- Idioms or humor that don't translate well to the target culture
- Religious, political, or social sensitivities specific to the target market
- Color, number, or symbol associations that may be negative in the target culture
- Gender, age, or social hierarchy assumptions that may be inappropriate
- Formality level appropriateness (e.g., Korean honorifics, Japanese keigo, German Sie/Du)
- Local competitor or cultural context that makes the message awkward
- RTL (right-to-left) considerations for Arabic markets

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = 문화적으로 완벽하게 적합),
  "strengths": ["강점 내용 — 현지 문화에 잘 맞는 표현이나 접근"],
  "weaknesses": ["약점 내용 — 문화적으로 부적절하거나 개선이 필요한 부분"],
  "improvements": ["보완 내용 — 문화적 적합성을 높이기 위한 구체적 수정 제안"]
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
    country = context.get("country_code", "unknown")
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## 검토 대상 카피\n{copy_text}\n\n## 타겟 시장: {country}\n\n## 브리프 컨텍스트\n{json.dumps(context.get('brief_summary', ''), ensure_ascii=False)}"),
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
