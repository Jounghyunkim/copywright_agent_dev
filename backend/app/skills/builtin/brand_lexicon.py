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

Respond ONLY with a valid JSON object:
{
  "passed": true/false,
  "score": 0-100 (100 = perfect brand compliance),
  "findings": [
    {"severity": "high|medium|low", "message": "description", "location": "headline|subheadline|bodyCopy|cta"}
  ],
  "suggestions": [
    {"original": "incorrect text", "suggested": "corrected text", "reason": "brand guideline reference"}
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
