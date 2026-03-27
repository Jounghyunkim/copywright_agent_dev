"""파일 기반 커스텀 스킬 관리 — skills/custom/ 폴더에 SKILL.md 파일로 저장

파일 형식:
---
id: banmal-detection-skill
label: 반말(비격식체) 표현 검출
description: ...
category: validation
is_active: true
created_at: 2026-03-24T02:19:19+00:00
updated_at: 2026-03-24T02:19:19+00:00
---

# Prompt Template

(프롬프트 본문)

# Output Schema

```json
{ ... }
```
"""
import json
import re
from pathlib import Path
from datetime import datetime, timezone

CUSTOM_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sanitize_filename(name: str) -> str:
    """스킬 이름을 안전한 파일명으로 변환 (공백→_, 특수문자 제거)"""
    name = name.strip()
    name = re.sub(r'[^\w\s가-힣-]', '', name)
    name = re.sub(r'\s+', '_', name)
    return name or 'unnamed'


def _skill_path_by_label(label: str) -> Path:
    return CUSTOM_DIR / f"{_sanitize_filename(label)}.md"


def _find_by_id(skill_id: str) -> Path | None:
    """id 필드를 기준으로 .md 파일 검색"""
    for path in CUSTOM_DIR.glob("*.md"):
        try:
            data = _parse_md(path.read_text(encoding="utf-8"))
            if data and data.get("id") == skill_id:
                return path
        except OSError:
            continue
    return None


# ---------------------------------------------------------------------------
# Markdown ↔ dict 변환
# ---------------------------------------------------------------------------

def _parse_md(text: str) -> dict | None:
    """YAML frontmatter + Markdown 본문을 dict로 파싱"""
    text = text.strip()
    if not text.startswith("---"):
        return None

    parts = text.split("---", 2)
    if len(parts) < 3:
        return None

    # frontmatter (간이 YAML 파서 — key: value 한 줄씩)
    data: dict = {}
    for line in parts[1].strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        sep = line.find(":")
        if sep < 0:
            continue
        key = line[:sep].strip()
        val = line[sep + 1:].strip()
        # 불리언 변환
        if val.lower() == "true":
            val = True
        elif val.lower() == "false":
            val = False
        data[key] = val

    body = parts[2]

    # Prompt Template 섹션 추출
    prompt = _extract_section(body, "Prompt Template")
    if prompt:
        data["prompt_template"] = prompt

    # Output Schema 섹션 추출
    schema_raw = _extract_section(body, "Output Schema")
    if schema_raw:
        # ```json ... ``` 블록 안의 JSON 추출
        m = re.search(r'```json\s*\n(.*?)```', schema_raw, re.DOTALL)
        if m:
            try:
                data["output_schema"] = json.loads(m.group(1))
            except json.JSONDecodeError:
                data["output_schema"] = None
        else:
            # 코드블록 없으면 전체를 JSON 시도
            try:
                data["output_schema"] = json.loads(schema_raw)
            except json.JSONDecodeError:
                data["output_schema"] = None

    # 호환 필드
    data.setdefault("type", "custom")
    data.setdefault("editable", True)
    data.setdefault("is_active", True if data.get("is_active") is not False else False)

    return data


def _extract_section(body: str, heading: str) -> str | None:
    """# Heading 과 다음 # Heading 사이의 텍스트를 추출"""
    pattern = rf'^#\s+{re.escape(heading)}\s*\n'
    m = re.search(pattern, body, re.MULTILINE)
    if not m:
        return None
    start = m.end()
    # 다음 # 헤딩 또는 끝까지
    next_heading = re.search(r'^#\s+', body[start:], re.MULTILINE)
    end = start + next_heading.start() if next_heading else len(body)
    return body[start:end].strip()


def _to_md(data: dict) -> str:
    """dict를 Markdown 파일 텍스트로 변환"""
    # frontmatter 키 순서
    fm_keys = ["id", "label", "description", "category", "is_active", "created_at", "updated_at"]
    lines = ["---"]
    for key in fm_keys:
        if key in data:
            val = data[key]
            if isinstance(val, bool):
                val = "true" if val else "false"
            lines.append(f"{key}: {val}")
    lines.append("---")
    lines.append("")

    # Prompt Template
    if data.get("prompt_template"):
        lines.append("# Prompt Template")
        lines.append("")
        lines.append(data["prompt_template"])
        lines.append("")

    # Output Schema
    if data.get("output_schema"):
        lines.append("# Output Schema")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(data["output_schema"], ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def list_custom_skills() -> list[dict]:
    """custom/ 폴더의 모든 .md 파일을 읽어 스킬 목록 반환"""
    skills = []
    for path in sorted(CUSTOM_DIR.glob("*.md")):
        try:
            data = _parse_md(path.read_text(encoding="utf-8"))
            if data and data.get("is_active", True):
                skills.append(data)
        except OSError:
            continue
    return skills


def get_custom_skill(skill_id: str) -> dict | None:
    """단일 커스텀 스킬 조회 (id 기반)"""
    path = _find_by_id(skill_id)
    if not path:
        return None
    try:
        return _parse_md(path.read_text(encoding="utf-8"))
    except OSError:
        return None


def save_custom_skill(data: dict) -> dict:
    """커스텀 스킬 저장 — 파일명은 label(스킬 이름) 기반, .md 형식"""
    now = datetime.now(timezone.utc).isoformat()
    data.setdefault("type", "custom")
    data.setdefault("editable", True)
    data.setdefault("is_active", True)
    data.setdefault("created_at", now)
    data["updated_at"] = now

    # 기존 파일이 있으면(id 동일, label 변경된 경우) 이전 파일 삭제
    old_path = _find_by_id(data["id"])
    new_path = _skill_path_by_label(data.get("label", data["id"]))

    if old_path and old_path != new_path:
        old_path.unlink(missing_ok=True)

    new_path.write_text(_to_md(data), encoding="utf-8")
    return data


def delete_custom_skill(skill_id: str) -> bool:
    """커스텀 스킬 파일 삭제 (id 기반)"""
    path = _find_by_id(skill_id)
    if not path:
        return False
    path.unlink()
    return True
