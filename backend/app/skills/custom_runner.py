"""커스텀 스킬 공통 실행 엔진 — prompt_template 기반"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

from .rate_limit import invoke_llm
from .skillmd_runner import _language_name


_OUTPUT_INSTRUCTION_TEMPLATE = """

## Output Format (strict)
Respond ONLY with a single JSON object of this shape:
{{
  "passed": true/false,
  "score": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."]
}}

## Output Language (MANDATORY)
- Write every element of `strengths`, `weaknesses`, `improvements`
  in **{output_lang}** only.
- Do NOT mix other languages.
- Keep brand names (LG, ThinQ, Life's Good, OLED, gram) and technical
  identifiers untranslated.
- If an array has no content, return []."""


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

    output_instruction = _OUTPUT_INSTRUCTION_TEMPLATE.format(
        output_lang=_language_name(context.get("output_locale") or "ko"),
    )

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0,
    )
    parser = JsonOutputParser()
    messages = [
        SystemMessage(content=rendered_prompt + output_instruction),
        HumanMessage(content=f"## Copy to review\n{copy_text}"),
    ]
    response = await invoke_llm(llm, messages, skill_id="custom")
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
