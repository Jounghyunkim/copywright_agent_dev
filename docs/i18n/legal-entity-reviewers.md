# 법인별 번역 검수 담당자 (Reviewer Matrix)

다국어 UI·챗봇·스킬 번역 품질을 법인 차원에서 확보하기 위한 검수 담당자 관리 문서.
각 법인에서 **언어별 1명**을 주검수자, 1명을 백업으로 지정.

---

## 0. 왜 필요한가

- LLM 자동 번역의 초벌 품질이 일정 수준 이상이어도, **현지 마케팅 맥락·브랜드 톤·규제 언어**는 네이티브 검수 필수.
- 영어 기준 "Correct but not marketing-ready" 문제를 법인 실사용자 눈으로 사전 차단.
- 용어집(`glossary-draft.md`) 유지·보완의 현지 책임자 확정.

---

## 1. 역할 정의

### Primary Reviewer (주검수자)
- **소속**: 해당 언어권 법인 마케팅팀
- **요건**: 자사 캠페인 카피 검수 경험 2년 이상 선호, 네이티브 또는 near-native 수준
- **활동**:
  - 배포 전 번역 PR 리뷰 (SLA 영업일 기준 3일 이내)
  - 용어집 갱신 제안
  - Severity 뱃지/UX 라벨의 **톤 적절성** 판정
  - 현지 규제·브랜드 가이드 준수 확인
- **도구 접근 권한**: 서비스 관리자 계정 (번역 테스트용)

### Backup Reviewer (백업)
- Primary 부재 시 대행 (휴가·인사이동 대비)
- 동일 법인·다른 팀원 추천

### Brand Steward (본사)
- LG 본사 브랜드팀 1명
- 브랜드 자산 용어·법적 문구의 최종 승인자
- 언어 무관 **모든 언어의 최종 게이트**

---

## 2. 담당자 매트릭스 (Template — 법인 확인 필요)

> 아래 표는 **초기 템플릿**입니다. 각 법인에 승인을 받은 뒤 실명으로 교체하세요.
> 성명·이메일·사번은 민감 정보이므로 **관리자 전용 문서**로 분리 관리할 수도 있음.

| 언어 | 로케일 코드 | 대상 법인 | Primary (성명) | Primary (연락) | Backup | 상태 |
|---|---|---|---|---|---|---|
| 영어 | `en` | LG Electronics USA (Englewood Cliffs) | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 독일어 | `de` | LG Electronics Deutschland | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 프랑스어 | `fr` | LG Electronics France / Canada | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 스페인어 | `es` | LG Electronics España / Mexico | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 아랍어 | `ar` | LG Electronics Gulf (UAE) | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 중국어 | `zh-CN` | LG Electronics China | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| 태국어 | `th` | LG Electronics Thailand | _TBD_ | _TBD_ | _TBD_ | 🟡 Pending |
| (본사) | — | LG 본사 Brand Stewardship | _TBD_ | _TBD_ | — | 🟡 Pending |

**상태 범례**:
- 🟢 Confirmed — 담당자 확정 및 참여 동의
- 🟡 Pending — 법인 연락 후 답변 대기
- 🔴 Blocked — 법인 응답 없음 · 별도 에스컬레이션 필요
- ⚪ Out-of-scope — 해당 Phase에 포함 안 됨

---

## 3. 검수 프로세스 (PR 기반)

```
[번역 대상 소스 변경]
        │
        ▼
[CI 자동 번역 (LLM)] ─ 용어집 pre-pass ─ Do-not-translate 토큰 보호
        │
        ▼
[PR 생성: i18n/translate-<lang>]
        │
        ▼
[담당 Reviewer 자동 배정] (GitHub CODEOWNERS)
        │
        ▼
[Primary 검수 — Suggest 코멘트로 수정]
        │
        ▼
[영업일 3일 이내 응답 없으면 Backup 자동 배정]
        │
        ▼
[Brand Steward 최종 승인 (브랜드·법적 문구 포함 시)]
        │
        ▼
[머지 → 배포 → 법인 알림]
```

### SLA
- 일반 번역: 영업일 **3일 이내** 리뷰
- 긴급 패치(법규 변경·브랜드 캠페인 연동): **당일**
- Brand Steward 최종 승인: 영업일 2일 이내

---

## 4. GitHub CODEOWNERS 설정 (예시)

PR 파일 경로 기반 자동 리뷰어 배정. 법인 확정 후 이메일/GitHub 핸들로 교체.

```
# .github/CODEOWNERS (예시 — 실제 핸들로 교체 필요)

# 영어
frontend-v2/public/locales/en/                @lge-usa-marketing-reviewer
backend/skills/*/SKILL.en.md                  @lge-usa-marketing-reviewer

# 독일어
frontend-v2/public/locales/de/                @lge-de-marketing-reviewer
backend/skills/*/SKILL.de.md                  @lge-de-marketing-reviewer

# 프랑스어
frontend-v2/public/locales/fr/                @lge-fr-marketing-reviewer
backend/skills/*/SKILL.fr.md                  @lge-fr-marketing-reviewer

# 스페인어
frontend-v2/public/locales/es/                @lge-es-marketing-reviewer
backend/skills/*/SKILL.es.md                  @lge-es-marketing-reviewer

# 아랍어
frontend-v2/public/locales/ar/                @lge-gulf-marketing-reviewer
backend/skills/*/SKILL.ar.md                  @lge-gulf-marketing-reviewer

# 중국어
frontend-v2/public/locales/zh-CN/             @lge-cn-marketing-reviewer
backend/skills/*/SKILL.zh-CN.md               @lge-cn-marketing-reviewer

# 태국어
frontend-v2/public/locales/th/                @lge-th-marketing-reviewer
backend/skills/*/SKILL.th.md                  @lge-th-marketing-reviewer

# 용어집·브랜드
docs/i18n/glossary-draft.md                   @lge-brand-steward
```

---

## 5. 검수 체크리스트

### 번역 품질
- [ ] 용어집에 정의된 용어가 **정확히** 사용됨
- [ ] 브랜드 자산(LG, ThinQ, Life's Good, OLED, gram, DD Motor) 번역되지 않음
- [ ] 보간 변수(`{{count}}`, `{{step}}`) 원형 보존
- [ ] 복수형(`_one`/`_other`) 구분 필요 시 적용
- [ ] 톤 가이드 준수 (§ glossary-draft §10)
- [ ] 오탈자·띄어쓰기

### UX 맥락
- [ ] 버튼 라벨 길이가 UI 폭에 맞음 (독일어는 특히 주의 — +50% 예비)
- [ ] 맥락에 맞는 존칭·어조 (비즈니스 도구 기준)
- [ ] 문장 부호 규칙 (`¿ ¡` 스페인어, 전각 중국어, NBSP 프랑스어)
- [ ] RTL 언어(아랍어): 방향 전환 후 레이아웃 확인

### 규제·법적
- [ ] 시장별 금지 표현 없음 (예: 아랍어권 "No.1" 주장 금지 규정 등)
- [ ] 현지 광고법 기준 불확정 용어(e.g. "Best ever") 회피
- [ ] 문화적 민감 이슈 확인

### 시각 검증
- [ ] 해당 언어로 전환 후 주요 페이지 스크린샷 첨부 (PR 코멘트)
- [ ] 모바일 폭에서 줄바꿈 깨짐 없음

---

## 6. Onboarding Checklist (신규 Reviewer)

- [ ] `docs/다국어지원.md` 전략 문서 숙지
- [ ] `docs/i18n/glossary-draft.md` 용어집 숙독
- [ ] `docs/i18n/korean-strings-inventory.md` 번역 범위 파악
- [ ] 서비스 관리자 계정 발급
- [ ] GitHub 레포지토리 read 권한 + 해당 CODEOWNERS 핸들 등록
- [ ] 테스트 PR에서 Suggest 리뷰 연습
- [ ] Brand Steward와 1회 온보딩 콜 (30분) — 용어집·규정 Q&A

---

## 7. 커뮤니케이션 채널

| 채널 | 용도 | 응답 SLA |
|---|---|---|
| GitHub PR 코멘트 | 번역 Suggest, 정책 논의 | 영업일 3일 |
| 이메일 (`i18n-reviewers@lge.com` — 생성 필요) | 긴급 이슈, 법인 담당자 변경 | 영업일 2일 |
| Slack `#i18n-reviewers` (또는 사내 Teams) | 실시간 Q&A, 용어 합의 | 영업일 내 |
| 분기 회의 (30분 × 4회/년) | 전략 정렬, 품질 회고 | — |

---

## 8. 에스컬레이션 정책

### Reviewer 무응답 (SLA 초과)
1. 1일 초과 → Slack/이메일 리마인더
2. 3일 초과 → Backup Reviewer 자동 배정
3. 7일 초과 → 법인 마케팅 책임자 에스컬레이션, 담당자 교체 검토

### 품질 이슈 발견 (법인 측 컴플레인)
1. GitHub Issue 생성 — `label: i18n-quality`
2. 담당 Reviewer 확인 → 후속 PR로 수정
3. 반복 이슈 시 용어집에 반영해 재발 방지

---

## 9. 데이터 관리

### 개인정보 보호
- 이메일·사번은 **본 문서에 기재 금지** (관리자 전용 별도 시트)
- GitHub 핸들·공식 법인 이메일 별칭만 공개
- 예: `lge-usa-marketing-reviewer@lge.com` (익명 ROLE 계정 권장)

### 보존 기간
- 담당자 변경 이력은 **5년 보관** (번역 품질 이슈 추적)

---

## 10. 현 작업 상태 (2026-04)

### 완료
- [x] 용어집 초안 v0.1 작성
- [x] 한국어 문자열 인벤토리 완성
- [x] Reviewer 템플릿 문서 (본 문서)

### 진행 중
- [ ] 영어 번역 리소스 (en) MVP 작성 및 내부 검수
- [ ] 법인별 Primary Reviewer 7명 확정 연락 (언어별)

### 대기
- [ ] GitHub CODEOWNERS 반영 (핸들 확정 후)
- [ ] Brand Steward 1명 확정
- [ ] 분기 회의 첫 회차 일정 확정
- [ ] i18n-reviewers ML 이메일 생성
- [ ] Slack `#i18n-reviewers` 채널 개설

---

## 11. 법인 접촉 대본 (Outreach Template)

```
제목: [카피라이팅 에이전트] 다국어 UI 번역 검수자 참여 요청

안녕하세요, {법인명} 마케팅팀 {담당자}님

LG 본사에서 개발 중인 'Copywriting Agent' 서비스를 {법인} 마케터 분들이 자국 언어로
이용할 수 있도록 UI를 다국어화하고자 합니다.

품질 확보를 위해 언어별 **검수 담당자 1명**을 법인에서 지정해 주시면 감사하겠습니다.

[역할]
- 주 1회 이내 PR 번역 검수 (영업일 3일 이내 회신)
- 용어집(50~100개) 현지 적합성 판정
- 본사 Brand Steward와 분기 회의 (30분)

[추정 소요 시간]: 월 2~4시간

담당자 확정해 주시면 GitHub 핸들·공식 이메일(ROLE 계정 권장)을 공유 부탁드립니다.

감사합니다.
```

---

## 12. 이 문서의 유지 관리

- 담당자 변경 시 즉시 반영 (PR 필수)
- 분기 회의 직후 상태 갱신
- CODEOWNERS 파일과 **동기화 책임자**: 본사 i18n 리드 (별도 지정)
