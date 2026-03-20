---
name: init-skills-system
description: "SKILL.md 기반 지식 관리 시스템을 초기화한다. 스킬 로더, 파서, 빌트인 scaffold, 라우팅 정책을 구성한다."
user-invocable: true
argument-hint: "[project-dir] [domain-name]"
context: fork
allowed-tools: Bash, Write, Read, Edit
---

# 스킬 시스템 초기화

## 개요

SKILL.md 기반 지식 관리 시스템을 생성한다. 파일 시스템에 저장된 SKILL.md 파일을 자동 탐색하고, LLM 에이전트가 실행 중에 참조할 수 있도록 한다.

## 생성할 컴포넌트

### 1. SkillParser (`infra/skills/parser.py`)

SKILL.md 파일에서 YAML frontmatter와 본문을 분리 파싱한다.

```python
class SkillParser:
    @staticmethod
    def parse_frontmatter(skill_md: Path) -> dict:
        # --- YAML --- 블록 파싱

    @staticmethod
    def parse_body(skill_md: Path) -> str:
        # 본문 마크다운 추출
```

영문과 한국어 섹션명 모두 지원한다 (`## Inputs` / `## 입력`).

### 2. SkillLoader (`infra/skills/loader.py`)

skills_root 디렉토리를 순회하여 카탈로그를 생성한다.

```python
class SkillLoader:
    def list_skills(self) -> list[dict]:
        # 모든 SKILL.md 탐색 → 표준 메타데이터 반환

    def get_skill(self, skill_name: str) -> dict | None:
        # 특정 스킬 조회
```

반환 구조: name, description, version, risk_level, skill_type, path, frontmatter

### 3. SkillRequirementsResolver (`infra/skills/requirements.py`)

스킬이 요구하는 입력 필드를 HITL 폼 필드로 변환한다.

해석 순서:
1. frontmatter의 `required_inputs`
2. 본문의 `## 입력` 섹션의 `필수 입력 필드:` 블록
3. 스킬별 기본 fallback 매핑

alias 정규화, 허용 필드 필터링, 도메인 기본값 fallback을 포함한다.

### 4. BuiltinCatalog (`infra/skills/builtin_catalog.py`)

앱 시작 시 빌트인 스킬 scaffold를 자동 생성한다.

```python
BUILTIN_SKILLS = [
    # "your-domain-skill-1",
    # "your-domain-skill-2",
]

def ensure_builtin_skill_scaffolds(skills_root: Path) -> dict:
    # skills_root 아래에 누락된 스킬 디렉토리 + SKILL.md 자동 생성
```

### 5. RoutingPolicy (`infra/skills/routing_policy.py`)

키워드 기반 스킬 자동 선택. (init-backend의 routing_policy.py.template 참조)

## SKILL.md 표준 구조

```yaml
---
name: skill-id-kebab-case
description: 스킬 설명
domain: {domain-name}
owner_team: team-name
risk_level: low|medium|high
skill_type: capability|procedure|orchestration
version: 0.1.0
human_review:
  required_for: []
  approve_roles: []
tool_policy:
  allowed: [docs.read]
  approval_required: [external.publish]
outputs: []
calls_skills: []
---

# skill-id

## 사용 조건
## 입력
## 출력
## 실행 단계
## HITL 정책
## 도구 정책
## 실패 모드
## 좋은 예시
## 나쁜 예시
## 테스트 케이스
```

## 디렉토리 구조

```
{project-dir}/skills/
├── {domain-name}-skill-1/
│   ├── SKILL.md
│   ├── references/
│   ├── templates/
│   ├── tests/
│   └── evals/
└── {domain-name}-skill-2/
    └── SKILL.md
```

## 도메인 커스터마이징

1. `BUILTIN_SKILLS` 목록 정의
2. scaffold 템플릿 (`_default_skill_md()`) 커스터마이징
3. `CANONICAL_ALIASES` 매핑 (alias → canonical field)
4. `DEFAULT_BY_SKILL` 매핑 (스킬 → 기본 필수 필드)
5. 도메인별 SKILL.md 작성
