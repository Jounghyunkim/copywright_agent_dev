# 다국어 확장 이슈 및 보완 사항 검토

한국어·영어 MVP 구축 이후 독일어·프랑스어·스페인어·중국어·아랍어·태국어로 확장 시 발생이 예상되는 기술·운영 이슈와 **현 구현의 보완 필요 항목**을 정리.

---

## 0. 현재까지 완료된 기반 (2026-04)

| 영역 | 상태 |
|---|---|
| react-i18next + HttpBackend + LanguageDetector 설치·초기화 | ✅ |
| 네임스페이스 구조 (21개) 정의 | ✅ |
| `public/locales/ko/*.json`, `public/locales/en/*.json` 6개 네임스페이스 | ✅ (common/navigation/settings/home/auth/page) |
| AppShell · Settings · Home · Login 마이그레이션 | ✅ |
| 언어 전환 UI (LanguageSwitcher) | ✅ |
| HTML `lang/dir` 자동 갱신 (setupHtmlDirSync) | ✅ |
| 로케일 메타 (이름·RTL 방향) | ✅ |
| 용어집 초안 + 한국어 인벤토리 + 법인 리뷰어 템플릿 | ✅ |

## 0.5. 아직 미완료 (한/영 MVP 범위 내)

- [ ] 14개 네임스페이스 리소스 파일 (workflow/copy-review/copy-results/generation/review/approval/skills/brief/analysis/chat/knowledge/stats/admin/matrix/dashboard)
- [ ] 잔여 파일(~400 문자열) 마이그레이션:
  - 관리자 3페이지(admin-users / stats / knowledge)
  - 에디터 워크플로우 페이지(editor-page, copy-review-page, workflow-list-page)
  - Feature 컴포넌트(brief/analysis/strategic-message/copy-generation/review/chat/approval/skills)
- [ ] ChatPanel 인사말 등에 `Copywriting Assistant` 하드코딩 교체
- [ ] alert/confirm 문구 전수 `t()` 치환

---

## 1. 언어 확장 시 기술적 이슈

### 1.1 독일어 (de) — 단어 길이

**이슈**: 독일어는 합성어 특성상 영어 대비 **평균 1.3~1.5배, 최대 2배** 길이.
예: `Knowledge Base` → `Wissensdatenbank` (+64%), `Login failed` → `Anmeldung fehlgeschlagen` (+71%)

**UI 파손 예상 지점**
| 파일 | 파손 위험 |
|---|---|
| `shared/ui/app-shell.tsx` — `.nav-item` | 폭 148~200px (collapsed 아님) — "카피라이트 목록" 독일어 "Kopier-Arbeitsliste"(~20자) fit OK, 단 "Admin-Einstellungen"(18자) 경계 |
| `app/settings-layout.tsx` — `.settings-tab` | 탭 4개 가로 배치. 독일어 긴 라벨 → wrap |
| `features/review/review-config.tsx` — 레인 탭 라벨 | "Risikoabsicherung und Einhaltung" 긴 라벨, 탭 2줄 가능성 |
| Button 라벨 | "선택 카피 검토" → "Ausgewählte Kopien prüfen" — 현재 버튼 폭 고정 없음, 대응 OK 예상 |

**보완 필요**
- [ ] CSS `.nav-item`, `.settings-tab`에 `white-space: normal` 허용 + 두 줄 처리 규칙
- [ ] 버튼 컴포넌트에 **flex-wrap** 안전장치 + 최소 폭 제거
- [ ] 비주얼 회귀 테스트 (Chromatic/Percy 권장) 독일어 로케일 스냅샷 추가
- [ ] 독일어 번역 시 **축약 가능한 단어는 축약**(예: "Copy Review" → "Copy-Prüfung" 로 유지)

### 1.2 프랑스어 (fr) — 구두점 NBSP

**이슈**: 프랑스어는 `:`, `?`, `!`, `»` 앞에 Non-Breaking Space 필수. 일반 공백은 타이포 오류.
예: `Prêt à continuer ?` (before `?` NBSP)

**보완 필요**
- [ ] 번역 리소스에서 NBSP (`\u00A0`) 포함 규칙 가이드
- [ ] 자동 린트: 프랑스어 리소스의 `:`·`?` 앞 공백이 일반 공백인지 NBSP인지 검증 스크립트

### 1.3 스페인어 (es) — 역방향 기호 + 지역 변형

**이슈**:
- 의문문/감탄문은 `¿ … ?`, `¡ … !` 쌍 필수 (ko/en에는 없음)
- 이베리아(es-ES) vs 라틴아메리카(es-419) 어휘 차이 (예: `computadora` vs `ordenador`, `ustedes` vs `vosotros`)

**보완 필요**
- [ ] 초기에는 **중립적 es** (es-419에 가깝게, vosotros 회피)로 단일 유지
- [ ] 추후 분기 필요 시 `es-ES` / `es-419` 서브 로케일 준비 — `fallbackLng`에 `es-ES` → `es` → `en` 체인 설계

### 1.4 중국어 간체 (zh-CN) — 폰트·구두점·간번체

**이슈**:
1. **폰트 fallback**: Noto Sans KR로는 일부 중국 간체 글리프 렌더 실패 (특히 저빈도 한자)
2. **전각 구두점** (`，。！？`) — 반각 섞이면 타이포 엉망
3. **간체/번체** — 중국 본토(zh-CN) vs 홍콩·대만(zh-HK/zh-TW) 다른 변환 필요 — 당장은 zh-CN만

**보완 필요**
- [ ] `html[lang="zh-CN"]` CSS 규칙 추가 — `font-family: 'Noto Sans SC', 'Inter', sans-serif;`
- [ ] `index.html`에 Noto Sans SC 지연 로드 (`<link rel="preload" as="style" ... media="lang(zh)">`)
- [ ] 번역 리소스 구두점 규칙 가이드 (전각 통일)
- [ ] 필요 시 zh-TW/zh-HK 서브 로케일 Phase 4에 분리

### 1.5 아랍어 (ar) — RTL 전면 미러링 ⚠️ 가장 중요

**이슈**: 단순 텍스트 전환이 아닌 **레이아웃 방향 전체 반전**. 현재 코드는 대부분 `margin-left` / `padding-right` 같은 **물리 속성**을 쓰고 있어 RTL 미러링이 작동하지 않음.

**현 코드베이스 스캔** (중요 파일에서 물리 속성 사용 현황):

| 파일 | 물리 속성 사용처 |
|---|---|
| `shared/ui/app-shell.tsx` | `marginLeft`, `paddingLeft` 다수 |
| `shared/ui/split-pane.tsx` | `paddingLeft`, `paddingRight` |
| `shared/styles/globals.css` | `.nav-icon` margin, sidebar padding |
| `features/review/review-results.tsx` | `paddingLeft`, `borderLeft` |
| `features/chat/chat-panel.tsx` | `marginLeft`, `paddingLeft` |
| `features/copy-generation/copy-results.tsx` | `paddingLeft` |
| 전체 | `flex-direction: row` 다수 — RTL에서 **자동 반전됨**, OK |
| 전체 | 아이콘 `←`, `▸` 등 방향 기호 — **수동 반전 필요** |

**보완 필요 (Phase 2 아랍어 착수 전 선행)**
- [ ] CSS 전수 스캔 — `margin-left`·`margin-right`·`padding-left`·`padding-right`·`border-left`·`border-right`·`left:`·`right:` 를 **logical property**로 치환
  - `margin-left` → `margin-inline-start`
  - `padding-right` → `padding-inline-end`
  - `border-left` → `border-inline-start`
  - `left: 0` → `inset-inline-start: 0`
- [ ] 인라인 style 객체 내 `paddingLeft: 8` 같은 것도 `paddingInlineStart: 8`로 변경
- [ ] 방향 기호 아이콘 처리:
  - SVG path 안의 `‹` `›` `←` `→` 는 `html[dir="rtl"] .icon-directional { transform: scaleX(-1); }` 적용
  - "← 이전 단계" 버튼 — 텍스트 내 화살표가 문제. 번역 리소스에서 RTL은 `previousStep: "الخطوة السابقة →"` 식으로 언어별 화살표 방향 바꾸기
- [ ] ChatPanel 메시지 버블의 `justifyContent: flex-start/flex-end` — RTL에서도 사용자 메시지가 "현재 방향의 끝"이 되도록 auto 처리 (flex는 LTR/RTL 자동 반전되므로 OK 확인만 필요)
- [ ] `unicode-bidi: isolate` 적용 — 아랍어 콘텐츠 + 영문 브랜드명/숫자 혼합 시
- [ ] 방향 감지가 필요한 특수 컴포넌트(SplitPane 등)는 `isRTL()` 훅으로 분기

### 1.6 태국어 (th) — 단어 공백·라인 브레이크

**이슈**: 태국어는 **단어 사이에 공백이 없음**. 브라우저의 기본 line-break 알고리즘이 임의 위치에서 끊어 가독성 심각하게 저하.
예: `การตรวจสอบคำโฆษณา` 가 `การตรวจ/สอบคำ/โฆษณา`로 끊기면 의미 파손

**보완 필요**
- [ ] `html[lang="th"] { word-break: normal; overflow-wrap: normal; line-break: auto; }` 명시
- [ ] 가능한 경우 `<wbr/>` 또는 `&zwsp;`로 명시적 브레이크 지점 삽입 (번역 리소스 단에서)
- [ ] 버튼·테이블 헤더처럼 짧은 라벨은 영향 적음 / 본문·설명 긴 문장에서만 이슈
- [ ] Noto Sans Thai 폰트 로드 필수 (성조 기호 적층)

### 1.7 폰트 전략 — 현재 미구현

**현재 상태**: `globals.css`의 body는 `Noto Sans KR` 기본. 중국어·아랍어·태국어 전용 폰트 미로드.

**보완 필요**
```css
/* frontend-v2/src/shared/styles/globals.css 끝에 추가 권장 */
html[lang="zh-CN"], html[lang="zh-TW"], html[lang="zh-HK"] {
  font-family: 'Noto Sans SC', 'Noto Sans TC', 'Inter', 'Noto Sans KR', sans-serif;
}
html[lang="ar"] {
  font-family: 'Noto Sans Arabic', 'Inter', 'Noto Sans KR', sans-serif;
}
html[lang="th"] {
  font-family: 'Noto Sans Thai', 'Inter', 'Noto Sans KR', sans-serif;
  word-break: normal;
  line-break: auto;
}
html[lang="de"], html[lang="fr"], html[lang="es"] {
  font-family: 'Inter', 'Noto Sans KR', sans-serif;
}
```

**index.html에 추가해야 하는 지연 로드**:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+Arabic:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&display=swap" />
```

또는 더 나은 방법: JS로 언어 전환 시에만 해당 폰트 링크 주입 (현재 로케일 폰트만 로드) — 초기 페이지 로딩 속도 보존.

---

## 2. 백엔드 i18n 이슈 (현재 전혀 없음)

### 2.1 에러 메시지·SSE 진행 로그

**현 상태**: 백엔드 응답 메시지가 **한국어 하드코딩**:
- `"저장에 실패했습니다"` (main.py)
- `"스킬 실행 오류"` (runner.py)
- `"LLM 응답 파싱 실패"` (main.py)
- SSE `progress` 메시지 — 영어 혼재 (`"Generated N search queries"`)

**보완 필요**
- [ ] FastAPI에 `Accept-Language` 파싱 미들웨어
- [ ] `backend/app/i18n/<lang>.json` 서버 리소스
- [ ] 에러 응답 포맷 `{code, message}` 패턴 — 프론트가 code로 현지화
- [ ] SSE 메시지는 **code 기반**으로 전달하고 프론트에서 render (서버는 "언어 무관 code"만 송출)

### 2.2 Correction 엔드포인트 프롬프트

**현 상태**: 한국어 시스템 프롬프트. "원본 언어와 동일 언어로 출력" 지시로 로케일 무관 동작하지만, **시스템 프롬프트 자체가 한국어**라 비-한국어 사용자 로그 분석 시 불투명.

**보완**
- [ ] 시스템 프롬프트는 영어로 통일 (LLM 성능·다국어 호환성 상)
- [ ] 유지보수 문서는 한국어로 주석 (`# 한국어 설명`)

---

## 3. 챗봇 (AI 어시스턴트) 다국어화

**현 상태**: ChatPanel 초기 인사말은 한국어 하드코딩:
```ts
`안녕하세요, **${userName}**님! Copywriting Assistant입니다…`
```
서버 `/chat` 엔드포인트의 시스템 프롬프트도 한국어 기반 추정.

**보완 필요**
- [ ] 프론트 ChatPanel 인사말 `t('chat:greeting', {userName})`로 전환
- [ ] 프론트가 `/chat` 요청 시 body에 `locale: i18n.language` 포함
- [ ] 백엔드 챗봇 시스템 프롬프트 분기:
  ```python
  CHAT_SYSTEM = {
    'ko': '당신은 LG 글로벌 마케팅 어시스턴트입니다. ...',
    'en': 'You are the LG Global Marketing Assistant. Respond in English.',
    'de': 'Sie sind der LG Global Marketing Assistant. Antworten Sie auf Deutsch.',
    # ...
  }
  ```
- [ ] 가이드 요청(`handleGuideRequest`) 역시 로케일별 가이드 텍스트 분리

---

## 4. 스킬 다국어화 — **가장 큰 미완료 영역**

**현 상태**: 56개 SKILL.md 모두 **한국어 단일 언어**.

**보완 필요 (Phase 3)**
- [ ] `backend/app/skills/loader.py`의 `get_skill_body(skill_name, locale)` 시그니처 확장
- [ ] 파일 분리 방식: `SKILL.md` / `SKILL.en.md` / `SKILL.de.md` / ...
- [ ] 존재하지 않으면 `SKILL.md` (한국어) fallback
- [ ] LLM 기반 번역 파이프라인 (빌드 타임 1회):
  ```bash
  python scripts/translate_skills.py --source=ko --target=en --dir=backend/skills/
  ```
- [ ] **우선 번역 대상** (Risk + Brand 11개만이라도 우선):
  - `ai-washing-risk-check`, `compliance-redflag-detector`, `environmental-claim-risk-check`, `comparative-ad-risk-check`, `claim-extractor`, `proof-point-checker`, `regulatory-copy-validation`
  - `lg-brand-fit-check`, `lg-brand-voice`, `brand-lexicon-check`, `tone-and-voice-enforcer`, `writer-solmi-check`
- [ ] 체크섬 기반 번역 버전 추적 (`prompt.meta.json`)

---

## 5. 로케일 감지·저장 이슈

### 5.1 사용자 프로필 preferred_locale 미연동

**현 상태**: localStorage만 사용. 다른 기기에서 로그인 시 매번 재설정 필요.

**보완**
- [ ] DB `User` 테이블에 `preferred_locale VARCHAR(8)` 컬럼 추가
- [ ] `PATCH /auth/me/preferences` 엔드포인트
- [ ] 프론트: 언어 전환 시 비동기 PATCH → localStorage 업데이트
- [ ] 로그인 시: `/auth/me` 응답의 `preferred_locale`이 있으면 초기값으로 적용

### 5.2 i18next-http-backend 초기 로딩 지연

**현재 이슈 가능성**: `useSuspense: false`로 설정해 초기 번역 키가 순간적으로 `common:button.save` 같은 **키 그대로** 노출될 수 있음.

**보완**
- [ ] 초기 렌더 시 `i18n.isInitialized` 대기 플래그 추가
- [ ] 또는 `Suspense` + fallback(흰 배경 로딩 스피너)

---

## 6. QA·시각 회귀

### 6.1 비주얼 회귀 테스트 부재

**현 상태**: 스크린샷 기반 회귀 없음. 독일어 긴 문자열·아랍어 RTL 등에서 레이아웃 붕괴를 조기 감지할 수단 없음.

**권장**
- [ ] Chromatic 또는 Percy 연동
- [ ] 각 언어 × 주요 페이지(홈·생성·검토·설정·로그인) = **8 × 5 = 40 스냅샷**
- [ ] PR CI에서 diff 검출

### 6.2 번역 커버리지 미측정

**보완**
- [ ] `i18next-scanner` CI 스텝 — 누락 키 count → README badge
- [ ] 관리자 페이지에 **번역 커버리지 위젯**: 언어별 %

---

## 7. 우선순위 제안 (다음 작업)

### P0 — 다음 스프린트 (1-2주)
1. **폰트 스택 로케일별 분기** (globals.css) — 중국어·아랍어·태국어 대비 선결
2. **CSS logical properties 전수 전환** — RTL 대응의 90%를 차지하는 선결 작업
3. **잔여 400개 문자열 마이그레이션** — editor / copy-review / features/*
4. **나머지 15개 네임스페이스 JSON 생성** (ko + en)

### P1 — Phase 2 (3주)
5. 독일어·프랑스어·스페인어·중국어 번역 리소스
6. 백엔드 i18n 미들웨어 (에러 메시지 code-based)
7. 챗봇 시스템 프롬프트 언어 분기
8. ChatPanel 인사말·가이드 다국어화
9. User DB `preferred_locale` 컬럼 + API
10. 비주얼 회귀 테스트 기반

### P2 — Phase 3 (3주)
11. 아랍어 RTL — CSS 완전 전환 후 번역 + 시각 QA
12. 태국어 — line-break 처리 + 폰트
13. 주요 스킬(Brand/Risk 12개) `SKILL.<locale>.md` 번역

### P3 — 지속
14. 전체 56 스킬 번역 자동화 CI
15. 번역 커버리지 대시보드
16. 지역 변형(es-ES/es-419, zh-TW/zh-HK) 필요 시 분리

---

## 8. 현재 구현의 보완 필요 항목 (Quick Wins)

Phase 2 착수 전 최소 이 항목들은 반영 권장:

### 8.1 globals.css에 언어별 폰트 스택 추가 (15분)
```css
/* 언어별 폰트 분기 — 추후 실제 해당 언어 사용자만 로드되도록 개선 가능 */
html[lang^="zh"] { font-family: 'Noto Sans SC', 'Inter', 'Noto Sans KR', sans-serif; }
html[lang="ar"]  { font-family: 'Noto Sans Arabic', 'Inter', 'Noto Sans KR', sans-serif; }
html[lang="th"]  { font-family: 'Noto Sans Thai', 'Inter', 'Noto Sans KR', sans-serif; line-break: auto; word-break: normal; }
html[lang="de"]  { /* 공백 그대로 — 독일어 긴 단어 대응은 컴포넌트에서 */ }
```

### 8.2 index.html에 언어별 폰트 지연 로드 (10분)
```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap"
  media="print"
  onload="this.media='all'"
/>
```
(언어별 조건부 로드는 JS로 동적 inject하는 편이 더 나음 — 초기 페이로드 절감)

### 8.3 잔여 문자열 마이그레이션 우선순위 (2일)
1. `pages/editor/editor-page.tsx` (가장 큰 페이지, 사용 빈도 최고)
2. `pages/copy-review/copy-review-page.tsx`
3. `pages/workflow/workflow-list-page.tsx`
4. `pages/approvals/approvals-page.tsx`, `features/approval/pending-list.tsx`
5. `features/review/review-config.tsx`, `features/review/review-results.tsx`
6. `features/copy-generation/*`
7. `features/brief/*`, `features/analysis/*`, `features/strategic-message/*`
8. `features/chat/chat-panel.tsx`
9. `pages/admin/*` (3페이지)
10. `pages/skills/*`, `features/skill-*/*`, `features/message-matrix/*`

### 8.4 i18next-scanner CI 도입 (30분)
- `npm run i18n:extract` 스크립트 추가
- PR CI에서 누락 키 0 확인

### 8.5 번역 품질 E2E 플로우 검증 (영어만)
- 모든 페이지를 영어로 전환하고 **실제 흐름 테스트**: 로그인 → 홈 → 카피 생성 → 검토 → 저장
- 누락·어색한 문장 리스트 작성

---

## 9. 리스크 재평가

| 리스크 | 현재 상태 | 대응 우선순위 |
|---|---|---|
| 아랍어 RTL 레이아웃 붕괴 | 아직 시도 안 함 | P1 — CSS 전환이 선결 |
| 독일어 긴 단어 UI 파손 | 버튼 wrap 미허용 | P0 |
| 태국어 line break | 미대응 | P1 |
| 중국어 폰트 fallback | 미대응 | P0 |
| 번역 누락 | scanner 미도입 | P0 |
| 사용자 언어 기억 (기기간) | localStorage only | P1 |
| 스킬 56개 번역 | 0% | P2 (Risk/Brand 12개만이라도 P2 끝까지) |
| 챗봇 응답 언어 | 미분기 | P1 |

---

## 10. 결론 및 제언

**현재 MVP는 견고하게 세팅**되었습니다 — react-i18next + 로케일 메타 + 언어 전환 UI + HTML dir 동기화. 그러나 다음 4가지가 **Phase 2 착수 전 선결 과제**:

1. **CSS logical properties 전수 전환** (아랍어 RTL 대응의 90%)
2. **언어별 폰트 스택 분기** (중국어·아랍어·태국어 렌더 정상화)
3. **잔여 UI 문자열 마이그레이션** — 현재 커버리지 약 15% (AppShell·Settings·Home·Login만)
4. **14개 네임스페이스 리소스 파일** — 나머지 페이지 마이그레이션에 필수

이 4가지를 P0로 끝내면, 독일어·프랑스어·스페인어·중국어는 번역 리소스 **추가만**으로 확장 가능합니다. 아랍어·태국어는 별도 시각 QA 스프린트 권장.

---

## 11. 지금 이 시점에 검증 가능한 것

1. **한국어 ↔ 영어 전환 동작 확인** — 사이드바·설정·홈·로그인은 완전 전환
2. **localStorage 지속성** — 새로고침 후 언어 유지
3. **HTML lang/dir 자동 갱신** — DevTools에서 `<html lang="en">` 확인
4. **브라우저 기본 언어 감지** — 최초 방문 시 navigator.language 반영

이 MVP에서 이미 **영어 법인에 보여줄 수 있는 수준의 Pilot 가능성 확보**.
