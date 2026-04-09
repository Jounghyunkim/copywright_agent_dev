"""SKILL.md 파일 파서 — YAML frontmatter + Markdown body 분리"""
from pathlib import Path

import yaml


class SkillParser:
    @staticmethod
    def parse_frontmatter(skill_md: Path) -> dict:
        text = skill_md.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            return {}
        parts = text.split("---", 2)
        if len(parts) < 3:
            return {}
        parsed = yaml.safe_load(parts[1]) or {}
        if not isinstance(parsed, dict):
            return {}
        return parsed

    @staticmethod
    def parse_body(skill_md: Path) -> str:
        text = skill_md.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            return text.strip()
        parts = text.split("---", 2)
        if len(parts) < 3:
            return ""
        return parts[2].strip()
