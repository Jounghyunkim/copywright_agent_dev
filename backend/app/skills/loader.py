"""SKILL.md 파일 로더 — skills/ 디렉토리에서 스킬 탐색 및 로딩"""
from __future__ import annotations

from pathlib import Path

from .parser import SkillParser

# backend/skills/ 디렉토리 (SKILL.md 파일들이 위치)
_DEFAULT_SKILLS_ROOT = Path(__file__).resolve().parent.parent.parent / "skills"


class SkillLoader:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or _DEFAULT_SKILLS_ROOT

    def list_skills(self) -> list[dict]:
        """모든 SKILL.md 스킬 목록 반환"""
        if not self.root.exists():
            return []

        skills: list[dict] = []
        for skill_dir in sorted(self.root.iterdir()):
            if not skill_dir.is_dir():
                continue
            skill_md = skill_dir / "SKILL.md"
            if not skill_md.exists():
                continue
            frontmatter = SkillParser.parse_frontmatter(skill_md)
            skills.append(
                {
                    "name": frontmatter.get("name", skill_dir.name),
                    "description": frontmatter.get("description", ""),
                    "path": str(skill_md),
                    "frontmatter": frontmatter,
                }
            )
        return skills

    def get_skill(self, skill_name: str) -> dict | None:
        """이름으로 단일 스킬 조회"""
        for skill in self.list_skills():
            if skill["name"] == skill_name:
                return skill
        return None

    def get_skill_body(self, skill_name: str, max_chars: int = 3500) -> str:
        """스킬의 Markdown body 반환 (LLM 컨텍스트 주입용)"""
        skill = self.get_skill(skill_name)
        if not skill:
            return ""
        body = SkillParser.parse_body(Path(skill["path"]))
        return body[:max_chars]

    def list_by_action_tag(self, tag: str) -> list[dict]:
        """action_tags로 스킬 필터링 (generation, evaluation, localization)"""
        return [
            s for s in self.list_skills()
            if tag in s.get("frontmatter", {}).get("action_tags", [])
        ]

    def list_by_skill_type(self, skill_type: str) -> list[dict]:
        """skill_type으로 스킬 필터링 (capability, orchestration, procedure)"""
        return [
            s for s in self.list_skills()
            if s.get("frontmatter", {}).get("skill_type") == skill_type
        ]

    def list_personas(self) -> list[dict]:
        """AI Writer 페르소나 스킬 목록"""
        return [
            s for s in self.list_skills()
            if s["name"].startswith("writer-")
        ]

    def list_culture_profiles(self) -> list[dict]:
        """국가별 문화 프로필 스킬 목록"""
        return [
            s for s in self.list_skills()
            if s["name"].startswith("culture-")
        ]
