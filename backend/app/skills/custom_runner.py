"""커스텀 스킬 공통 실행 엔진 — prompt_template 기반"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser


OUTPUT_INSTRUCTION = """

IMPORTANT: You MUST respond ONLY with a valid JSON object in this exact format:
{
  "passed": true/false,
  "score": 0-100,
  "findings": [
    {"severity": "high|medium|low", "message": "description", "location": "headline|subheadline|bodyCopy|cta|general"}
  ],
  "suggestions": [
    {"original": "original text", "suggested": "improved text", "reason": "why"}
  ]
}"""


def _render_template(template: str, variables: dict) -> str:
    """{{variable}} 형태의 변수를 치환"""
    rendered = template
    for key, value in variables.items():
        placeholder = "{{" + key + "}}"
        rendered = rendered.replace(placeholder, str(value))
    return rendered


async def run_custom_skill(prompt_template: str, copy_text: str, context: dict) -> dict:
    start = time.perf_counter()

    variables = {
        "copy_text": copy_text,
        "brief_summary": json.dumps(context.get("brief_summary", {}), ensure_ascii=False),
        "analysis_context": json.dumps(context.get("analysis_context", {}), ensure_ascii=False),
        "strategic_message": json.dumps(context.get("strategic_message", {}), ensure_ascii=False),
        "country_code": context.get("country_code", ""),
        "language": context.get("language", ""),
    }

    rendered_prompt = _render_template(prompt_template, variables)

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0,
    )
    parser = JsonOutputParser()
    messages = [
        SystemMessage(content=rendered_prompt + OUTPUT_INSTRUCTION),
        HumanMessage(content=f"## Copy to review\n{copy_text}"),
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
