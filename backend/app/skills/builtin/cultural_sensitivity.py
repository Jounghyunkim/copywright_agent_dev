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

## Scoring guide:
- 90-100: Culturally sensitive and well-localized
- 70-89: Minor cultural adjustments needed
- 50-69: Notable cultural issues that need attention
- Below 50: Potentially offensive or severely mis-localized

Respond ONLY with a valid JSON object:
{
  "passed": true/false,
  "score": 0-100,
  "findings": [
    {"severity": "high|medium|low", "message": "description of cultural issue", "location": "headline|subheadline|bodyCopy|cta"}
  ],
  "suggestions": [
    {"original": "problematic text", "suggested": "culturally adapted text", "reason": "cultural context explanation"}
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
    country = context.get("country_code", "unknown")
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## Copy to review\n{copy_text}\n\n## Target market: {country}\n\n## Brief context\n{json.dumps(context.get('brief_summary', ''), ensure_ascii=False)}"),
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
