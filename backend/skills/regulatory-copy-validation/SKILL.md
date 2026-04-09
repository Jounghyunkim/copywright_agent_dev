---
name: regulatory-copy-validation
description: 광고 카피의 법적 규정 준수 여부를 종합 검증
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---
국가별, 채널별, 제품 카테고리별 광고 규정 적합성을 평가하는 프로시저 스킬이다. 다수의 규정 검증 하위 스킬을 호출하여 종합 판정(red/amber/green)을 산출하고, 수정 권고 및 승인 라우팅을 결정한다.

---

## 사용 조건

| 조건 | 설명 |
|------|------|
| 카피 변형본 존재 | 검증 대상 카피 후보가 1개 이상 존재할 때 |
| 규정 문서 가용 | 해당 국가/채널/제품의 광고 규정 문서가 로드 가능할 때 |
| 릴리즈 전 검증 | 카피가 외부 발행되기 전 규정 적합성을 확인해야 할 때 |
| 규정 변경 후 재검증 | 기존 승인 카피에 대해 변경된 규정으로 재검증이 필요할 때 |

**선행 조건:**
- `copy_variants`가 최소 1개 이상 포함되어야 한다.
- `policy_docs`에 해당 국가/산업의 규정이 포함되어야 한다.
- `product_category`가 유효한 카테고리 코드여야 한다.

---

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `copy_variants` | `list[CopyVariant]` | Y | 검증 대상 카피 후보 목록 |
| `policy_docs` | `PolicyDocs` | Y | 국가별/채널별/산업별 광고 규정 문서 세트 |
| `product_category` | `ProductCategory` | Y | 제품/서비스 카테고리 코드 |
| `target_country` | `CountryCode` | N | 대상 국가 (미지정 시 글로벌 기준 적용) |
| `target_channel` | `Channel` | N | 발행 채널 (채널별 추가 규정 적용) |
| `claims_evidence_map` | `dict[str, Evidence]` | N | 카피 내 주장-근거 매핑 |
| `previous_validation` | `ValidationResult` | N | 이전 검증 결과 (재검증 시 변경점 비교용) |

---

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `verdict` | `dict[str, Verdict]` | 카피별 red/amber/green 종합 판정 |
| `detail_findings` | `list[Finding]` | 세부 검증 결과 (규정 조항, 위반 내용, 심각도) |
| `remediation_suggestions` | `list[Remediation]` | 수정 권고안 (위반 표현 → 대체 표현) |
| `approval_routing` | `ApprovalRouting` | 판정에 따른 승인 라우팅 경로 |
| `compliance_score` | `dict[str, float]` | 카피별 규정 준수 점수 (0.0-1.0) |
| `applied_regulations` | `list[Regulation]` | 적용된 규정 목록 |

---

## 실행 단계

```
1. 규정 프로파일 구성
   → product_category, target_country, target_channel 조합으로 적용 규정 결정
   → policy_docs에서 관련 규정 추출 및 우선순위 설정
   → 산업 특수 규정(금융, 의료 등) 별도 태깅

2. [compliance-redflag-detector] 규정 위반 사전 스크리닝
   → 명백한 법적 위반 표현(허위 주장, 절대적 표현 등) 탐지
   → red flag 발견 시 즉시 태깅

3. [ai-washing-risk-check] AI 관련 표현 검증
   → AI/ML 관련 주장의 정확성 및 과장 여부 검증
   → EU AI Act, 국내 AI 가이드라인 준수 확인

4. [environmental-claim-risk-check] 환경 주장 검증
   → 환경/지속가능성 관련 주장의 근거 충분성 검증
   → 그린워싱 표현 탐지

5. [comparative-ad-risk-check] 비교 광고 표현 검증
   → 경쟁사 비교 표현의 공정성, 객관성 검증
   → 국가별 비교 광고 규정 적합성 확인

6. [brand-lexicon-check] 브랜드 어휘 검증
   → 브랜드 금지어, 필수 표현 준수 여부 확인
   → 상표권 침해 가능성 탐지

7. 종합 판정 및 라우팅 결정
   → 각 하위 스킬 결과를 종합하여 최종 red/amber/green 판정
   → 판정 기준: red가 1개라도 있으면 red, amber만 있으면 amber, 모두 통과면 green
   → 판정에 따른 승인 라우팅 경로 결정:
     - green: 자동 승인 가능
     - amber: 지정 승인권자 리뷰 필요
     - red: 법무팀 필수 리뷰 + 수정 후 재검증
```

**가드레일:**
- red 판정 카피는 어떤 경우에도 자동 승인되지 않는다.
- 근거 없는 주장(claims_evidence_map에 매핑 없음)은 자동으로 amber 이상 판정한다.
- 동일 카피에 대한 재검증 시 이전 결과와의 변경점을 명시한다.
- 규정 문서의 최종 업데이트 일자가 6개월 이상 경과한 경우 경고를 발행한다.

---

## HITL 정책

| 게이트 | 승인 역할 | 조건 |
|--------|-----------|------|
| Amber 리뷰 | 마케팅 매니저 + 브랜드 매니저 | amber 판정 카피 |
| Red 리뷰 | 법무팀 | red 판정 카피 (필수) |
| 고규제 산업 리뷰 | 산업 전문 컴플라이언스 | 금융/의료/공공 카테고리 모든 카피 |
| 비교 광고 리뷰 | 법무팀 | 비교 광고 표현이 포함된 카피 |
| 수정 후 재검증 확인 | 원 검증자 | 수정된 카피의 재검증 결과 확인 |

- green 판정 카피도 고규제 산업(금융, 의료, 공공)인 경우 인간 리뷰를 거쳐야 한다.
- red 판정 카피는 수정 후 전체 검증 파이프라인을 처음부터 재실행한다.
- amber 판정 카피는 승인권자 판단에 따라 수정 없이 진행하거나 수정 후 재검증할 수 있다.

---

## 도구 정책

| 도구 | 권한 | 설명 |
|------|------|------|
| `docs.read` | 허용 | 광고 규정 문서, 법률 조항 조회 |
| `brand_guide.read` | 허용 | 브랜드 어휘 가이드, 금지어 목록 조회 |
| `policy.read` | 허용 | 국가별/채널별 광고 정책 조회 |
| `evidence.read` | 허용 | 주장 근거 자료, 인증서, 시험 성적서 조회 |
| `external.publish` | 승인 필요 | 검증 완료 카피의 승인 상태 외부 전파 |
| `bulk.export` | 승인 필요 | 검증 결과 일괄 내보내기 |
| `system.write` | 승인 필요 | 검증 결과 기록, 판정 상태 업데이트 |

---

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| 규정 문서 미비 | 해당 국가/산업의 규정이 policy_docs에 없음 | 워크플로 중단, 규정 문서 보완 요청 |
| 하위 스킬 오류 | compliance-redflag-detector 등 하위 스킬 실패 | 해당 검증 항목을 amber로 보수적 판정, 수동 검증 요청 |
| 근거 자료 만료 | claims_evidence의 근거 유효기간 초과 | 해당 주장 amber 판정, 근거 갱신 요청 |
| 규정 충돌 | 국가 규정과 채널 규정이 상충 | 충돌 내역 리포트 생성, 더 엄격한 규정 적용 |
| 판정 불확실 | 규정 해석이 모호한 표현 | amber 판정, 법무팀 해석 요청 |
| 대량 카피 타임아웃 | copy_variants가 과다하여 SLA 초과 | 배치 분할 처리, 우선순위 카피 먼저 검증 |

---

## 좋은 예시

**시나리오:** 한국 시장 스킨케어 광고 카피 규정 검증

```yaml
입력:
  copy_variants:
    - id: v1
      headline: "피부 고민, HydraShield로 해결하세요"
      body: "임상 시험에서 92%의 참가자가 보습 효과를 경험했습니다."
      cta: "지금 시작하기"
  policy_docs: [화장품법_광고규정, 공정거래법_표시광고, 식약처_기능성화장품_가이드]
  product_category: cosmetics
  target_country: KR
  claims_evidence_map:
    "92% 보습 효과": "2025년 임상시험 보고서 #CS-2025-0142"

결과:
  verdict: { v1: green }
  detail_findings:
    - { rule: "화장품법 제13조", check: "기능성 주장 근거", result: "pass" }
    - { rule: "공정거래법 표시광고", check: "과장 표현", result: "pass" }
  compliance_score: { v1: 0.95 }
  approval_routing: { v1: "auto_approve" }
```

---

## 나쁜 예시

**시나리오:** 근거 없는 "업계 1위" 주장 포함

```yaml
문제:
  - "업계 1위 보습력" 표현 사용
  - claims_evidence_map에 해당 주장의 근거 없음

결과:
  verdict: { v1: red }
  detail_findings:
    - { rule: "공정거래법 표시광고 제3조", check: "객관적 근거 없는 최상급 표현", result: "fail", severity: "red" }
  remediation_suggestions:
    - { original: "업계 1위 보습력", suggested: "뛰어난 보습력", reason: "객관적 근거 없는 최상급 표현 제거" }
  approval_routing: { v1: "legal_review_required" }
```

**시나리오:** AI 기능 과장 표현

```yaml
문제:
  - "AI가 당신의 피부를 완벽하게 분석합니다" 표현 사용
  - 실제로는 단순 설문 기반 추천 기능

결과:
  verdict: { v1: amber }
  detail_findings:
    - { rule: "AI 워싱 가이드라인", check: "AI 기능 과장", result: "warning", severity: "amber" }
  remediation_suggestions:
    - { original: "AI가 완벽하게 분석", suggested: "AI 기반 알고리즘이 피부 타입을 추천", reason: "실제 기능과 표현 일치" }
```

---

## 테스트 케이스

| ID | 시나리오 | 입력 조건 | 기대 결과 |
|----|----------|-----------|-----------|
| TC-01 | 정상 green 판정 | 모든 규정 준수, 근거 완비 | green 판정, auto_approve 라우팅 |
| TC-02 | Red 판정 (허위 주장) | 근거 없는 최상급 표현 | red 판정, 법무 리뷰 라우팅, 수정 권고 |
| TC-03 | Amber 판정 (AI 워싱) | AI 기능 과장 표현 | amber 판정, 마케팅+브랜드 리뷰 |
| TC-04 | 그린워싱 감지 | "100% 친환경" 근거 부족 | red 판정, 환경 인증 근거 요청 |
| TC-05 | 비교 광고 검증 | "A사 대비 2배 효과" 표현 | amber 판정, 비교 근거 검증 요청 |
| TC-06 | 규정 문서 미비 | 해당 국가 규정 없음 | 워크플로 중단, 규정 보완 요청 |
| TC-07 | 재검증 (규정 변경) | 기존 green 카피, 규정 변경 | 변경점 비교 리포트 + 재판정 |
| TC-08 | 다중 위반 | red 1개 + amber 2개 | 최종 red 판정 (가장 엄격 기준) |
