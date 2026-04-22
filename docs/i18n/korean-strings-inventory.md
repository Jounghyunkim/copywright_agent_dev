# 한국어 원본 문자열 인벤토리 (번역 소스)

프론트엔드 사용자 노출 한국어 문자열 전수 조사 결과.
i18n 리소스 파일로 옮겨야 할 번역 대상 목록이며, 번역 작업 지시서로 활용.

- 총 **≈ 446개** 문자열 / **27개 주요 파일** + 15+ feature 컴포넌트
- 네임스페이스: `common`, `navigation`, `page`, `settings`, `workflow`, `copy-review`, `copy-results`, `generation`, `review`, `approval`, `skills`, `brief`, `analysis`, `matrix`, `chat`, `auth`, `admin`, `stats`, `knowledge`, `home`, `dashboard`, `tooltip`, `button`
- 제외 대상: console.log, TS 타입 리터럴, 개발자 주석, 이미 영어인 기술 식별자

---

## 네임스페이스 × 카테고리 분포

| 네임스페이스 | 키 수(대략) | 주요 영역 |
|---|---|---|
| common | 30+ | 공통 버튼, 로딩, 테이블 헤더, 상태 |
| navigation | 10 | 사이드바·상단 내비 |
| page | 11 | 페이지 타이틀·서브타이틀 |
| button | 35+ | 액션 버튼 라벨 |
| tooltip | 10 | 도움말 툴팁 |
| workflow | 25+ | 카피 생성 단계 |
| copy-review | 35+ | 카피 검토 입력·리뷰 |
| review | 12 | 리뷰 조건·실행 |
| copy-results | 10 | 카피 결과 표시 |
| generation | 15 | 생성 조건 입력 |
| analysis | 11 | 분석 리포트 설명 |
| chat | 12 | 챗봇 |
| auth | 10 | 로그인·인증 |
| admin/stats/knowledge | 50+ | 관리자 섹션 |
| brief/matrix/skills | 30+ | 기타 |

---

## 1. AppShell & Top Navigation
`frontend-v2/src/shared/ui/app-shell.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 69 | 홈 | navigation | `navigation:home` |
| 70 | 카피라이트 검토 | navigation | `navigation:copyReview` |
| 71 | 카피라이트 생성 | navigation | `navigation:copyGeneration` |
| 72 | 카피라이트 목록 | navigation | `navigation:workflowList` |
| 73 | 승인 대기 | navigation | `navigation:approvals` |
| 74 | 스킬 | navigation | `navigation:skills` |
| 96 | 관리자 설정 | navigation | `navigation:adminUsers` |
| 97 | 사용 통계 | navigation | `navigation:adminStats` |
| 98 | 지식 구축 | navigation | `navigation:adminKnowledge` |
| 101 | 일반 설정 | navigation | `navigation:settings` |
| 122 | 설정 메뉴 | tooltip | `common:tooltip.settingsMenu` |
| 246 | 사이드바 펼치기 / 접기 | tooltip | `common:tooltip.sidebarExpand` / `common:tooltip.sidebarCollapse` |
| 274 | 서버 연결 끊김 | message-error | `common:toast.serverOffline.title` |
| 275 | 백엔드(:5000) 응답이 없습니다. 데이터가 자동 갱신되지 않을 수 있습니다. | description | `common:toast.serverOffline.description` |
| 320 | 로그아웃 | button | `common:button.logout` |

## 2. Settings Pages
`app/settings-layout.tsx`, `pages/settings/settings-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 13-16 | 일반 설정 / 관리자 설정 / 사용 통계 / 지식 구축 | navigation | `settings:tab.*` |
| 32 | 설정 | heading | `settings:section.title` |
| 13 | 일반 설정 | heading | `page:settings.title` |
| 14 | 플랫폼 구성 및 연동 상태 | description | `page:settings.subtitle` |
| 18 | 시스템 상태 | heading | `settings:systemStatus` |
| 30 | 백엔드 연결 | heading | `settings:backendConnection` |
| 42 | 외부 서비스 | heading | `settings:externalServices` |
| 49 | API 키는 backend/.env 에서 관리합니다. | message-info | `settings:apiKeysManaged` |
| 54 | 사용자 | heading | `settings:userSection` |
| 56 | 캐시 초기화 | button | `common:button.clearCache` |

## 3. Admin — Users Page
`pages/admin/admin-users-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 93 | 비밀번호가 올바르지 않습니다. 다시 입력해 주세요. | message-error | `auth:error.passwordInvalid` |
| 95 | LDAP 서버에 연결할 수 없습니다. | message-error | `auth:error.ldapUnreachable` |
| 97 | 검색에 실패했습니다. | message-error | `admin:error.searchFailed` |
| 123 | 이미 관리자로 등록된 사용자입니다. | message-error | `admin:error.alreadyAdmin` |
| 125 | 관리자 추가에 실패했습니다. | message-error | `admin:error.addFailed` |
| 135-136 | 자신을 관리자에서 제거하시겠습니까? / {name}을 관리자에서 제거하시겠습니까? | message-info | `admin:confirm.removeSelf` / `admin:confirm.removeOther` |
| 152 | 마지막 관리자는 제거할 수 없습니다. | message-error | `admin:error.lastAdmin` |
| 164 | 관리자 설정 | heading | `page:adminUsers.title` |
| 165 | 관리자 추가/제거 및 사용자 검색 | description | `page:adminUsers.subtitle` |
| 171 | 현재 관리자 ({count}명) | heading | `admin:currentAdmins` |
| 174 | 로드 중… | loading | `common:loading` |
| 177 | 등록된 관리자가 없습니다. | message-info | `admin:noAdmins` |
| 184-189 | 이름 / ID / 조직 / 추가일 / 추가자 | table-header | `admin:table.*` |
| 211 | 제거 | button | `common:button.remove` |
| 224 | 사용자 검색 (LDAP) | heading | `admin:userSearchLdap` |
| 230 | LDAP 검색을 위해 본인 비밀번호를 입력해 주세요. | description | `admin:ldapPasswordRequired` |
| 238 | LDAP 비밀번호 | placeholder | `auth:placeholder.ldapPassword` |
| 249 | 확인 | button | `common:button.confirm` |
| 260 | 이름 또는 ID로 검색 (2글자 이상) | placeholder | `admin:searchPlaceholder` |
| 264 | 검색 중… | loading | `common:searching` |
| 284 | 비밀번호 재입력 | button | `admin:button.redoPassword` |
| 320 | 추가 | button | `common:button.add` |
| 333 | 검색 결과가 없습니다. | message-info | `admin:noResults` |
| 342 | 관리자 추가/제거는 다음 로그인부터 반영됩니다. | message-info | `admin:changesNextLogin` |

## 4. Admin — Stats Page
`pages/admin/stats-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 54-57 | 7일 / 14일 / 30일 / 90일 | label | `stats:period.7d/14d/30d/90d` |
| 123 | 통계 데이터를 불러오지 못했습니다. | message-error | `stats:error.loadFailed` |
| 171 | 사용 통계 | heading | `page:stats.title` |
| 172 | DAU / MAU, 조직별 / 개인별 활동 대시보드 | description | `page:stats.subtitle` |
| 175 | 기간: | label | `stats:period.label` |
| 212-215 | 오늘 DAU / 이번 달 MAU / 누적 사용자 / 누적 로그인 / 로그인 성공률 | kpi-label | `stats:kpi.*` |
| 225 | DAU 추이 (최근 {days}일) | heading | `stats:dauTrend` |
| 228 | 데이터가 없습니다. | message-info | `common:noData` |
| 256 | MAU 추이 (최근 12개월) | heading | `stats:mauTrend` |
| 275 | 조직별 활동 (최근 {days}일) | heading | `stats:deptActivity` |
| 284-287 | 조직 / 사용자 수 / 로그인 횟수 / 평균 활동일 | table-header | `stats:table.*` |
| 308 | 개인별 활동 (최근 {days}일, {count}명) | heading | `stats:userActivity` |

## 5. Admin — Knowledge Page
`pages/admin/knowledge-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 9 | 저서 / 에세이 / 인터뷰 / 카피샘플 / 인사이트 | category | `knowledge:category.*` |
| 74 | 업로드에 실패했습니다. | message-error | `knowledge:error.uploadFailed` |
| 87 | 직접 입력 | label | `knowledge:directInput` |
| 95 | 저장에 실패했습니다. | message-error | `common:error.saveFailed` |
| 102 | 이 문서를 삭제하면 벡터 인덱스에서도 제거됩니다. 계속하시겠습니까? | message-info | `knowledge:confirm.delete` |
| 108 | 삭제에 실패했습니다. | message-error | `common:error.deleteFailed` |
| 119 | 지식 구축 | heading | `page:knowledge.title` |
| 120-122 | Copywriter 페르소나 RAG 지식 베이스 관리 … | description | `page:knowledge.subtitle` |
| 136 | 등록 문서 | label | `knowledge:registeredDocs` |
| 142 | 총 청크 수 | label | `knowledge:totalChunks` |
| 150 | 파일 업로드 | heading | `knowledge:fileUpload` |
| 153 | 파일 선택 (txt, md, pdf, docx) | label | `knowledge:fileSelect` |
| 163/198 | 카테고리 | label | `common:category` |
| 177 | 업로드 중… / 업로드 | button | `common:button.uploading` / `common:button.upload` |
| 187 | 텍스트 직접 입력 | heading | `knowledge:textInput` |
| 190 | 제목 | label | `common:title` |
| 194 | 예: 2024 인터뷰 발췌 | placeholder | `knowledge:titlePlaceholder` |
| 215 | 에세이, 인터뷰 내용, 인사이트 메모 등을 붙여넣기… | placeholder | `knowledge:textPlaceholder` |
| 221 | {n}자 | label | `common:charCount` |
| 227 | 저장 중… / 저장 | button | `common:button.saving` / `common:button.save` |
| 238 | 등록된 지식 ({n}건) | heading | `knowledge:registered` |
| 244 | 등록된 문서가 없습니다. 파일 업로드 또는 텍스트 입력으로 지식을 추가하세요. | message-info | `knowledge:noDocs` |
| 251-256 | 제목 / 카테고리 / 청크 / 글자 수 / 등록일 | table-header | `knowledge:table.*` |
| 282 | 삭제 | button | `common:button.delete` |

## 6. Home
`pages/home/home-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 34 | 홈 | heading | `page:home.title` |
| 35-36 | LG 브랜드 캠페인을 위한 AI 카피라이팅 플랫폼 | description | `page:home.subtitle` |
| 40 | + 새 카피라이트 생성 | button | `home:button.newCampaign` |
| 41 | 카피라이트 검토 | button | `home:button.reviewCopy` |
| 48 | 저장된 캠페인 | kpi-label | `home:kpi.savedCampaigns` |
| 54 | 평균 Brand Fit | kpi-label | `home:kpi.avgBrandFit` |
| 60 | 평균 Review 점수 | kpi-label | `home:kpi.avgReviewScore` |
| 79 | 최근 캠페인 | heading | `home:recentCampaigns` |
| 84 | 전체 보기 → | navigation | `common:link.viewAll` |
| 88 | 로드 중… | loading | `common:loading` |
| 92 | 대시보드를 불러오지 못했습니다. | message-error | `dashboard:error.loadFailed` |
| 97 | 저장된 캠페인이 없습니다. 새 워크플로우를 시작해 보세요. | message-info | `home:noCampaigns` |
| 151 | 완료 / {step}/5 | status | `common:status.completed` / `common:status.stepOfTotal` |

## 7. Login
`pages/login/login-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 37 | 로그인에 실패했습니다. | message-error | `auth:error.loginFailed` |
| 39 | 사번(ID) 또는 비밀번호가 올바르지 않습니다. | message-error | `auth:error.credentialsInvalid` |
| 41 | 인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요. | message-error | `auth:error.serverUnavailable` |
| 64 | ID (메일 아이디) | label | `auth:label.employeeId` |
| 70 | @lge.com 를 제외한 ID 입력 | placeholder | `auth:placeholder.employeeId` |
| 78 | 비밀번호 | label | `auth:label.password` |
| 84 | LDAP 비밀번호 | placeholder | `auth:placeholder.ldapPassword` |
| 101 | 로그인 중… / 로그인 | button | `auth:button.signingIn` / `auth:button.signIn` |
| 106 | LG 사내 LDAP 계정으로 로그인합니다. | message-info | `auth:notice.ldap` |

## 8. Editor / Workflow
`pages/editor/editor-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 42-46 | 브리핑 / 분석 / 전략 메시지 / 카피 생성 / 검토 | step | `workflow:step.brief/analysis/strategy/generation/review` |
| 167 | {step}(으)로 돌아가면 현재 결과와 이후 단계가 초기화됩니다. 계속하시겠습니까? | message-info | `editor:confirm.goBack` |
| 335 | 저장하려면 프로젝트명이 필요합니다. | message-error | `editor:error.projectNameRequired` |
| 351 | 저장에 실패했습니다. 백엔드 연결을 확인해 주세요. | message-error | `editor:error.saveFailed` |
| 417 | 분석에 실패했습니다: {error} | message-error | `workflow:error.analysisFailed` |
| 422 | 브리프로 돌아가기 | button | `workflow:button.backToBrief` |
| 425 / 101 | 다시 시도 | button | `common:button.retry` |
| 434 | 분석 리포트 | heading | `workflow:heading.analysisReport` |
| 451-594 | ← 이전 단계 | button | `common:button.previousStep` |
| 461 | Copywriting Strategy 추출 중… | loading | `workflow:loading.strategyExtraction` |
| 466 | 전략 메시지 | heading | `workflow:heading.strategyMessage` |
| 509 | 카피 생성 중… (국가/변형 수에 따라 수 분 소요) | loading | `workflow:loading.copyGeneration` |
| 514 | 카피 생성 결과 | heading | `workflow:heading.copyResults` |
| 572 | 스킬 기반 리뷰 실행 중… | loading | `workflow:loading.review` |
| 614 | 카피라이트 생성 | heading | `page:editor.title` |
| 623 | 현재 저장된 캠페인 ID | tooltip | `editor:tooltip.campaignId` |
| 635-638 | 저장 중… / 업데이트 / 저장 | button | `common:button.saving` / `common:button.update` / `common:button.save` |
| 644 | 진행 중인 내용을 초기화하시겠습니까? | message-info | `editor:confirm.reset` |
| 651 | 초기화 | button | `common:button.reset` |

## 9. Copy Review
`pages/copy-review/copy-review-page.tsx`

| Line | 문자열 | Category | Key |
|---|---|---|---|
| 35-37 | 카피 입력 / 검토 | step | `copy-review:step.input/review` |
| 42-45 | 브랜딩 / 프로모션 / 퍼포먼스 / 신제품 론칭 | intent | `copy-review:intent.branding/promotion/performance/launch` |
| 436 | 캠페인 컨텍스트 | heading | `copy-review:heading.campaignContext` |
| 445 | 검토 품질을 높이기 위한 공통 맥락. 모든 카피에 함께 반영됩니다. | description | `copy-review:description.context` |
| 451 | 캠페인 목적 | label | `copy-review:label.campaignIntent` |
| 513 | 제품군 / 카테고리 | label | `copy-review:label.productCategory` |
| 528 | 예: OLED TV, 무선 이어폰 | placeholder | `copy-review:placeholder.productCategory` |
| 533 | 원본/마스터 카피 (선택) | label | `copy-review:label.originalCopy` |
| 574 | 국가 | label | `copy-review:label.country` |
| 583 | Headline | label | `copy-review:label.headline` |
| 587 | Subheadline | label | `copy-review:label.subheadline` |
| 592 | Body Copy | label | `copy-review:label.bodyCopy` |
| 596 | CTA | label | `copy-review:label.cta` |
| 601 | 선택 항목 (Methodology / Cultural Notes / Tone Analysis) | label | `copy-review:label.optional` |
| 613 | + 카피 추가 | button | `copy-review:button.addCopy` |
| 615 | {n}개 카피 | label | `copy-review:label.copyCount` |
| 616 | 입력 완료 | button | `copy-review:button.inputDone` |
| 683 | 카피라이트 검토 | heading | `page:copyReview.title` |

## 10. Workflow List / Approvals / Skills

| 파일 | 주요 문자열 | Key 네임스페이스 |
|---|---|---|
| `pages/workflow/workflow-list-page.tsx` | 카피라이트 작업 목록 · 저장된 캠페인을 열어 이어서 작업하거나 삭제하세요. · 열기 / 삭제 · {title} 캠페인을 삭제할까요? | `page:workflowList`, `workflow:*`, `common:button.*` |
| `pages/approvals/approvals-page.tsx` / `features/approval/pending-list.tsx` | 승인 대기 · 사용자 확인이 필요한 단계 · 분석 승인 / 전략 승인 / 카피 리뷰 · Market Analyst Report 승인/수정 필요 | `page:approvals`, `approval:*` |
| `pages/skills/skills-page.tsx` | 스킬 관리 · 카피 검증/생성/분석… · ✦ AI 초안 생성 · + 새 스킬 · 스킬을 불러오는 중… | `page:skills`, `skills:*` |

## 11. Feature Components (요약)

### Brief / Analysis / Strategic
- `features/brief/briefing-form.tsx` — 프로젝트명과 Project Context를 먼저 입력해 주세요. · 3자 이상 · 20자 이상/5단어 이상 · AI 자동생성에 실패 · 캠페인 브리프 9개 항목… · Message Matrix (선택) · 가이드 보기 · 펼치기/접기
- `features/brief/preview-panel.tsx` — ← 돌아가기 · 미작성 · 생성일
- `features/analysis/analysis-report.tsx` — 섹션 도움말 11개 (Research Summary / Deep-dive Persona / Brand Fit Score / Market Opportunity & Risk / Competitive Keywords / Untapped Keywords / Category Narrative Shift / Emotional JTBD / Cultural Tension Map / Copy Implications & Guardrails / Recommended Keywords) · ③ 전략 메시지 생성
- `features/strategic-message/strategic-message-view.tsx` — ④ 카피 후보 생성

### Generation / Review Results
- `features/copy-generation/generation-config.tsx` — 카피 생성 조건 · 타겟 국가 · 전체 해제/선택 · 타겟 연령대 · Audience 기반 자동 선택 · 타겟 페르소나 · AI 작가 페르소나 (선택) · 선택 해제 · 변형 수 · 카피 생성 → · 국가/연령/페르소나를 각각 1개 이상 · 소개 / 문체 특징
- `features/copy-generation/copy-results.tsx` — Copy Results ({n}개 국가 · {m}개 카피) · 선택 {n}개 · {n}개 변형 · 변형 N · 선택 · ⑤ 선택 카피 검토 · 한국어 번역 중…
- `features/review/review-config.tsx` — 리뷰 조건 설정 · 검증 레인을 선택해… · 선택된 카피 ({n}개) · 법무·규제·허위 주장 리스크를 탐지합니다. · LG 브랜드 톤·사전·보이스 정합성을 검증합니다. · 카피의 명확성·임팩트·세그먼트 적합도… · 국가·문화·언어 현지화 품질… · 이 레인 해제 · 전체 해제 · 스킬을 1개 이상 선택해 주세요.

### Chat
- `features/chat/chat-panel.tsx` — 안녕하세요, {name}님! Copywriting Assistant입니다… · 용량 초과 · 첨부 불가 · 파일 처리 중… · 생각 중… · 파일 첨부 ({desc}) · 메시지를 입력하세요 · 전송 · 응답을 가져오지 못했습니다 · 일부만 전달됨

### Skills / Matrix
- `features/skill-authoring/draft-wizard.tsx` — AI 스킬 초안 생성 · 간단한 정보를 입력하면… · 스킬 이름 · 작성 목적 · 스킬 목적 · 좋은 예시 / 나쁜 예시 · 왜 이 스킬을 만드는지 / 이 스킬이 달성해야 하는 것
- `features/skill-registry/skill-list.tsx` — 등록된 스킬이 없습니다. · 상세 / 편집 / 삭제
- `features/skill-registry/skill-detail-modal.tsx` — 편집 / 닫기
- `features/message-matrix/upload.tsx` — {n}개 시트 · {m}개 USP 추출 · 파싱 실패 · .xlsx/.xls 형식만 지원 · 시트가 비어 있습니다 · 시트 목록 로드 실패 · 시트 목록 로드 중… · 시트 파싱 중… · 파싱할 시트를 선택 · 취소 · ✓ 파싱 시작 · 제거

### Shared
- `app/protected-layout.tsx` — 인증 확인 중…

---

## 키 네이밍 규약

### 원칙
1. **namespace:dot.path** 형식 (`common:button.save`)
2. **네임스페이스**는 영역/페이지 단위로 분리 — 파일 단위가 아님 (여러 파일에서 공유 가능)
3. **camelCase**로 점 구분 (`navigation:copyReview`) — 언더스코어·대문자 혼용 금지
4. 액션성 키는 `button.*`, `link.*`, `confirm.*` 같은 카테고리 접두사
5. 메시지는 `error.*`, `info.*`, `warning.*` 으로 심각도 표기
6. 상태는 `status.*`, 카테고리는 `category.*`, 단계는 `step.*`

### 네임스페이스 목록 (최종)
- `common` — 전 영역 공용 (버튼, 로딩, 에러, 툴팁, 테이블)
- `navigation` — 사이드바·링크
- `page` — 각 페이지의 타이틀/서브타이틀 (`page:home.title` 등)
- `auth` — 로그인·LDAP 관련
- `home` · `workflow` · `copy-review` · `copy-results` · `generation` · `review` · `approval` · `skills` · `knowledge` · `stats` · `admin` · `settings` · `brief` · `analysis` · `matrix` · `chat` · `dashboard`

---

## 변환 규칙

### 단순 텍스트
```tsx
// Before
<h2>홈</h2>

// After
<h2>{t('page:home.title')}</h2>
```

### 변수 보간 (interpolation)
```tsx
// Before
<span>{entries.length}개 카피</span>

// After
<span>{t('copy-review:label.copyCount', { count: entries.length })}</span>
// 리소스: "copyCount": "{{count}}개 카피"  (ko)
// 리소스: "copyCount": "{{count}} copies"   (en)
```

### 복수형(Plural)
```json
// ko/copy-review.json
{
  "label": {
    "copyCount_one": "{{count}}개 카피",
    "copyCount_other": "{{count}}개 카피"
  }
}
// en/copy-review.json
{
  "label": {
    "copyCount_one": "{{count}} copy",
    "copyCount_other": "{{count}} copies"
  }
}
```
한국어는 복수형 구분이 없어 단일 키로 통일, 영어는 one/other 분리.

### alert / confirm
```tsx
// Before
alert('저장에 실패했습니다.')

// After
alert(t('common:error.saveFailed'))
```

### Placeholder · title · aria-label
```tsx
<input placeholder={t('auth:placeholder.ldapPassword')} />
<button title={t('common:tooltip.settingsMenu')} aria-label={t('common:tooltip.settingsMenu')}>
```

### 보간 값이 여럿
```tsx
t('editor:confirm.goBack', { step: stepLabels[targetStep] })
// ko: "{{step}}(으)로 돌아가면 현재 결과와 이후 단계가 초기화됩니다. 계속하시겠습니까?"
// en: "Going back to {{step}} will reset the current result and all later steps. Continue?"
```

---

## 검증 체크리스트

마이그레이션 후 다음을 확인:

- [ ] `grep -R "'[가-힣]" frontend-v2/src/` 결과가 0줄 (한국어 리터럴 제거)
- [ ] i18next-scanner가 모든 키를 추출하는지 확인
- [ ] ko 리소스와 코드의 `t()` 키가 1:1 대응
- [ ] en 리소스에 동일 키가 존재 (누락 키 경고 0건)
- [ ] 복수형 키는 `_one`/`_other` 쌍이 모두 존재
- [ ] 보간 변수명이 한국어/영어에서 일치 (`{{count}}`, `{{step}}` 등)
- [ ] alert/confirm 메시지도 모두 `t()` 경유
- [ ] 제품명/브랜드명(LG, ThinQ, Life's Good, OLED, gram)은 번역 안 됨

---

## Next Action

1. 본 인벤토리를 기반으로 `public/locales/ko/*.json`, `public/locales/en/*.json` 초기 세트 작성
2. `features/` 컴포넌트는 feature별 namespace로 키 묶기
3. 네임스페이스별 파일 구조 확정 후, 파일 단위로 순차 마이그레이션 (AppShell → Settings → Home → Login → …)
4. 번역 품질 리뷰어 법인별 1명 배정 (`docs/i18n/legal-entity-reviewers.md` 참조)
