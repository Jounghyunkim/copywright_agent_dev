"""스킬 병렬 실행 + 라우팅 (SKILL.md / 커스텀 2-tier 분류)"""
import asyncio
from .custom_runner import run_custom_skill
from .skillmd_runner import run_skillmd_review
from .custom import get_custom_skill
from .catalog import get_skillmd_skills
from .loader import SkillLoader
from .routing_policy import select_eval_skills, check_conditional_triggers


def _get_skillmd_ids() -> set[str]:
    return {s["id"] for s in get_skillmd_skills()}


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
    """단일 스킬 실행 — skillmd(SKILL.md+LLM) / custom(template+LLM)"""
    try:
        if skill_type == "skillmd":
            return await run_skillmd_review(skill_id, copy_text, context)
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
    enabled_skills: list[str],
    selected_copies: list[dict],
    brief: dict,
    analysis_report: dict,
    strategic_message: dict,
    on_skill_start: callable = None,
    on_skill_complete: callable = None,
    auto_select: bool = False,
) -> list[dict]:
    """
    선택된 스킬들을 선택된 카피들에 대해 병렬 실행.

    Args:
        auto_select: True이면 routing_policy로 스킬 자동 선택 (enabled_skills 무시)
    Returns: list of result dicts (skill_id, skill_type, target_copy_key, ...)
    """
    if auto_select:
        all_copy_text = " ".join(
            _build_copy_text(c.get("copyData") or c.get("copy", {}))
            for c in selected_copies
        )
        objective = brief.get("objectiveCommercial", "") or brief.get("objectives", "")
        enabled_skills = select_eval_skills(
            objective=str(objective),
            constraints=[],
            copy_text=all_copy_text,
        )

    # 스킬 타입 분류: skillmd 또는 custom
    skillmd_ids = _get_skillmd_ids()
    custom_templates = {}

    for sid in enabled_skills:
        if sid not in skillmd_ids:
            skill_data = get_custom_skill(sid)
            if skill_data and skill_data.get("is_active", True):
                custom_templates[sid] = skill_data["prompt_template"]

    # 태스크 생성: 각 (스킬 × 카피) 조합
    tasks = []
    task_meta = []

    for skill_id in enabled_skills:
        if skill_id in skillmd_ids:
            skill_type = "skillmd"
            prompt_template = None
        elif skill_id in custom_templates:
            skill_type = "custom"
            prompt_template = custom_templates[skill_id]
        else:
            continue

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

    if on_skill_start:
        await on_skill_start(enabled_skills)

    raw_results = await asyncio.gather(*tasks)

    all_results = []
    for meta, result in zip(task_meta, raw_results):
        entry = {**meta, **result}
        all_results.append(entry)
        if on_skill_complete:
            await on_skill_complete(entry)

    return all_results
