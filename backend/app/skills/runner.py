"""스킬 병렬 실행 + 라우팅 (빌트인/커스텀 분류)"""
import asyncio
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import CustomSkill
from .builtin import BUILTIN_REGISTRY
from .custom_runner import run_custom_skill
from .catalog import BUILTIN_IDS


def _build_copy_text(copy: dict) -> str:
    """카피 dict를 LLM 입력용 텍스트로 변환"""
    parts = []
    if copy.get("headline"):
        parts.append(f"Headline: {copy['headline']}")
    if copy.get("subheadline"):
        parts.append(f"Subheadline: {copy['subheadline']}")
    if copy.get("bodyCopy"):
        parts.append(f"Body Copy: {copy['bodyCopy']}")
    if copy.get("cta"):
        parts.append(f"CTA: {copy['cta']}")
    return "\n".join(parts)


async def _run_single(
    skill_id: str,
    skill_type: str,
    copy_text: str,
    context: dict,
    prompt_template: str | None = None,
) -> dict:
    """단일 스킬 실행 — 빌트인이면 전용 함수, 커스텀이면 공통 러너"""
    try:
        if skill_type == "builtin":
            fn = BUILTIN_REGISTRY[skill_id]
            return await fn(copy_text, context)
        else:
            return await run_custom_skill(prompt_template, copy_text, context)
    except Exception as e:
        return {
            "passed": False,
            "score": 0,
            "strengths": [],
            "weaknesses": [f"스킬 실행 오류: {str(e)}"],
            "improvements": [],
            "raw_llm_response": str(e),
            "execution_ms": 0,
        }


async def run_review(
    db: AsyncSession,
    enabled_skills: list[str],
    selected_copies: list[dict],
    brief: dict,
    analysis_report: dict,
    strategic_message: dict,
    on_skill_start: callable = None,
    on_skill_complete: callable = None,
) -> list[dict]:
    """
    선택된 스킬들을 선택된 카피들에 대해 병렬 실행.
    Returns: list of result dicts (skill_id, skill_type, target_copy_key, ...)
    """
    # 커스텀 스킬 prompt_template 미리 로딩
    custom_ids = [sid for sid in enabled_skills if sid not in BUILTIN_IDS]
    custom_templates = {}
    if custom_ids:
        result = await db.execute(
            select(CustomSkill).where(
                CustomSkill.id.in_(custom_ids),
                CustomSkill.is_active == True,
            )
        )
        for row in result.scalars().all():
            custom_templates[row.id] = row.prompt_template

    # 태스크 생성: 각 (스킬 × 카피) 조합
    tasks = []
    task_meta = []

    for skill_id in enabled_skills:
        if skill_id in BUILTIN_IDS:
            skill_type = "builtin"
            prompt_template = None
        elif skill_id in custom_templates:
            skill_type = "custom"
            prompt_template = custom_templates[skill_id]
        else:
            continue  # 존재하지 않는 스킬 무시

        for copy_entry in selected_copies:
            copy_key = copy_entry["key"]
            copy_data = copy_entry.get("copyData") or copy_entry.get("copy", {})
            country_code = copy_entry.get("countryCode", "")

            copy_text = _build_copy_text(copy_data)
            context = {
                "brief_summary": brief,
                "analysis_context": analysis_report,
                "strategic_message": strategic_message,
                "country_code": country_code,
                "language": copy_data.get("language", ""),
            }

            tasks.append(_run_single(skill_id, skill_type, copy_text, context, prompt_template))
            task_meta.append({
                "skill_id": skill_id,
                "skill_type": skill_type,
                "target_copy_key": copy_key,
            })

    # 병렬 실행
    if on_skill_start:
        await on_skill_start(enabled_skills)

    raw_results = await asyncio.gather(*tasks)

    # 결과 조합
    all_results = []
    for meta, result in zip(task_meta, raw_results):
        entry = {**meta, **result}
        all_results.append(entry)
        if on_skill_complete:
            await on_skill_complete(entry)

    return all_results
