"""스킬 카탈로그 — SKILL.md 기반 + 파일 기반 커스텀 스킬 통합"""
from __future__ import annotations

from .custom import list_custom_skills
from .loader import SkillLoader

# ---------------------------------------------------------------------------
# action_tag → 카테고리 매핑
# ---------------------------------------------------------------------------
_TAG_TO_CATEGORY = {
    "generation": "generation",
    "evaluation": "validation",
    "localization": "localization",
}


def _skillmd_to_catalog_entry(skill: dict) -> dict:
    """SKILL.md 스킬을 카탈로그 엔트리로 변환"""
    fm = skill.get("frontmatter", {})
    action_tags = fm.get("action_tags", [])
    category = "validation"
    for tag in action_tags:
        if tag in _TAG_TO_CATEGORY:
            category = _TAG_TO_CATEGORY[tag]
            break
    return {
        "id": skill["name"],
        "label": skill["name"],
        "description": skill.get("description", ""),
        "category": category,
        "type": "skillmd",
        "editable": False,
        "skill_type": fm.get("skill_type", "capability"),
        "action_tags": action_tags,
        "role_tags": fm.get("role_tags", []),
        "risk_level": fm.get("risk_level", "medium"),
    }


def get_skillmd_skills() -> list[dict]:
    """SKILL.md 기반 스킬 목록 반환"""
    loader = SkillLoader()
    return [_skillmd_to_catalog_entry(skill) for skill in loader.list_skills()]


def get_all_skills() -> list[dict]:
    """SKILL.md + 커스텀 스킬 통합 목록 반환"""
    all_skills = get_skillmd_skills()

    # 파일 기반 커스텀 스킬
    custom_rows = list_custom_skills()
    seen_ids = {s["id"] for s in all_skills}
    for row in custom_rows:
        if row["id"] not in seen_ids:
            all_skills.append({
                "id": row["id"],
                "label": row["label"],
                "description": row["description"],
                "category": row["category"],
                "type": "custom",
                "editable": True,
            })

    return all_skills
