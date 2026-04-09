---
name: global-core-copy-generation
description: 캠페인 브리프 기반으로 글로벌 코어 카피(헤드라인/본문/CTA)를 생성
action_tags:
- generation
role_tags:
- 카피 생성
---
글로벌 기준 카피 원형(headline, body, CTA)을 생성하는 프로시저 스킬이다. 정규화된 캠페인 브리프와 톤앤매너 가이드를 기반으로 모든 지역 현지화의 기준이 되는 원형 카피를 제작하며, 필수/금지 표현 규칙을 적용한다.

---

## 사용 조건

| 조건 | 설명 |
|------|------|
| 정규화된 브리프 존재 | campaign-brief-normalizer를 통해 구조화된 브리프가 준비되었을 때 |
| 글로벌 캠페인 시작 | 새로운 글로벌 캠페인 또는 기존 캠페인의 메시지 리뉴얼 시 |
| 원형 카피 필요 | 지역별 현지화(regional-copy-adaptation)의 기준이 되는 카피가 필요할 때 |

**선행 조건:**
- `normalized_brief`가 campaign-brief-normalizer의 출력 스키마를 준수해야 한다.
- `tone_guide`가 유효한 브랜드 톤앤매너 문서여야 한다.
- main-message-clarifier를 통해 핵심 메시지가 확정된 상태여야 한다.

---

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `normalized_brief` | `NormalizedBrief` | Y | 정규화된 캠페인 브리프 (목표, 타깃, 핵심 메시지, KPI) |
| `tone_guide` | `ToneGuide` | Y | 브랜드 톤앤매너 가이드 (보이스, 퍼소나, 감정 톤) |
| `mandatory_and_forbidden_phrases` | `PhraseRules` | Y | 필수 포함 표현 및 금지 표현 목록 |
| `num_variants` | `int` | N | 생성할 카피 후보 수 (기본값: 3) |
| `reference_copies` | `list[ReferenceCopy]` | N | 참고할 기존 성공 카피 |
| `character_limits` | `CharacterLimits` | N | headline/body/CTA별 기본 문자 수 제한 |

---

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `global_core_copy_set` | `list[CoreCopy]` | 글로벌 기준 카피 후보 세트 (headline + body + CTA) |
| `copy_rationale` | `list[CopyRationale]` | 각 카피 후보의 제작 의도 및 전략적 근거 |
| `tone_compliance_score` | `dict[str, float]` | 각 카피의 톤앤매너 적합도 점수 (0.0-1.0) |
| `phrase_check_result` | `PhraseCheckResult` | 필수/금지 표현 준수 결과 |
| `recommended_variant` | `CoreCopy` | 종합 점수 기준 권장 후보 |

---

## 실행 단계

```
1. 브리프 분석 및 카피 전략 수립
   → normalized_brief에서 핵심 메시지, USP, 타깃 오디언스 추출
   → tone_guide에서 보이스 특성, 감정 톤, 표현 수준 확인
   → 카피 전략 프레임 결정 (benefit-led, emotion-led, fact-led 등)

2. [headline-body-cta-composer] headline/body/CTA 초안 생성
   → num_variants 수만큼 후보 카피 생성
   → 각 후보별로 headline, body, CTA를 일관된 메시지 아크로 구성
   → character_limits 준수 여부 자동 검증

3. [tone-and-voice-enforcer] 톤앤매너 적합성 검증
   → 각 후보 카피가 tone_guide에 부합하는지 평가
   → 톤 적합도 점수 산출
   → 부적합 표현 수정 제안

4. 필수/금지 표현 점검
   → mandatory_and_forbidden_phrases 규칙 적용
   → 필수 표현 누락 시 자동 삽입 위치 제안
   → 금지 표현 감지 시 대체 표현 제안

5. 카피 순위 결정 및 권장 후보 선정
   → 톤 적합도, 메시지 명확성, 표현 규칙 준수를 종합 평가
   → 종합 점수 기준으로 권장 후보 선정
   → copy_rationale 작성

6. HITL: 본사 브랜드 리뷰
   → 카피 후보 세트와 rationale을 브랜드 매니저에게 제출
   → amber 이상 리스크 항목은 별도 강조 표시
   → 승인/수정요청/거절 결과에 따라 분기
```

**가드레일:**
- 금지 표현이 포함된 카피는 출력에서 자동 제외하고, 수정 버전만 포함한다.
- 톤 적합도 점수가 0.6 미만인 카피는 자동 재생성한다.
- 모든 카피 후보는 반드시 copy_rationale을 동반해야 한다.
- headline은 의문문이나 부정문을 지양하고, 명확한 가치 제안을 담아야 한다.

---

## HITL 정책

| 게이트 | 승인 역할 | 조건 |
|--------|-----------|------|
| 본사 브랜드 리뷰 | 본사 브랜드 매니저 | 모든 글로벌 카피 생성 후 필수 |
| 톤앤매너 예외 승인 | 크리에이티브 디렉터 | 톤 적합도 0.6-0.7 구간의 카피를 예외적으로 사용하고자 할 때 |
| 금지 표현 예외 | 법무팀 + 브랜드 매니저 | 금지 표현을 특수한 맥락에서 사용해야 할 때 |

- amber 이상의 리스크가 포함된 카피 후보는 반드시 인간 리뷰를 거쳐야 한다.
- 브랜드 매니저가 수정을 요청하면 2단계(headline-body-cta-composer)부터 재실행한다.
- 최대 3회 수정 반복 후에도 승인되지 않으면 에스컬레이션한다.

---

## 도구 정책

| 도구 | 권한 | 설명 |
|------|------|------|
| `docs.read` | 허용 | 캠페인 브리프, 참고 카피 조회 |
| `brand_guide.read` | 허용 | 톤앤매너 가이드, 브랜드 퍼소나 조회 |
| `policy.read` | 허용 | 필수/금지 표현 규칙, 글로벌 광고 정책 조회 |
| `evidence.read` | 허용 | USP 근거 자료, 성과 데이터 조회 |
| `external.publish` | 승인 필요 | 글로벌 카피 확정 후 하위 스킬에 배포 |
| `bulk.export` | 승인 필요 | 카피 후보 세트 일괄 내보내기 |
| `system.write` | 승인 필요 | 카피 승인 상태 기록 |

---

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| 브리프 스키마 불일치 | normalized_brief가 예상 스키마를 준수하지 않음 | 스키마 검증 오류 반환, campaign-brief-normalizer 재실행 요청 |
| 톤 적합도 전체 미달 | 모든 후보가 0.6 미만 | tone_guide 재확인 요청, 참고 카피 추가 제공 권고 |
| 금지 표현 대체 실패 | 금지 표현의 적절한 대체어를 찾지 못함 | 인간 크리에이터에게 수동 작성 요청 |
| 문자 수 초과 | character_limits를 반복 초과 | 자동 축약 1회 시도, 실패 시 수동 편집 요청 |
| HITL 반복 거절 | 3회 연속 브랜드 리뷰 거절 | 크리에이티브 디렉터에게 에스컬레이션 |
| 필수 표현 충돌 | 필수 표현이 톤앤매너와 충돌 | 충돌 내역 리포트 생성, 브랜드 매니저 판단 요청 |

---

## 좋은 예시

**시나리오:** 스킨케어 브랜드 여름 캠페인 글로벌 카피 생성

```yaml
입력:
  normalized_brief:
    campaign_name: "Summer Glow 2026"
    core_message: "자연 유래 성분으로 여름에도 건강한 피부"
    usp: "특허 성분 HydraShield 함유"
    target_audience: "25-40세 여성, 피부 건강에 관심"
  tone_guide:
    voice: "따뜻하고 신뢰감 있는"
    emotion: "편안함, 자신감"
    formality: "semi-formal"
  mandatory_and_forbidden_phrases:
    mandatory: ["HydraShield"]
    forbidden: ["최고", "완벽한", "기적"]

결과:
  global_core_copy_set:
    - headline: "여름 피부, HydraShield로 지키세요"
      body: "자연 유래 특허 성분 HydraShield가 여름 자외선과 열기로부터 피부를 보호합니다."
      cta: "건강한 여름 피부 시작하기"
    - headline: "HydraShield, 여름에도 촉촉한 피부의 비결"
      body: "자연에서 찾은 특허 보습 성분이 여름 내내 피부 장벽을 강화합니다."
      cta: "지금 경험하기"
  recommended_variant: variant_1
  tone_compliance_score: { variant_1: 0.92, variant_2: 0.88 }
  phrase_check_result: { mandatory_included: true, forbidden_detected: false }
```

---

## 나쁜 예시

**시나리오:** 금지 표현을 포함한 카피 생성

```yaml
문제:
  - "최고의 스킨케어" 표현 사용 (금지어 "최고" 포함)
  - tone_guide의 semi-formal과 불일치하는 과도한 구어체 사용

결과:
  - phrase_check_result에서 forbidden 감지
  - 해당 카피 자동 제외
  - "금지 표현 '최고'가 감지되었습니다. 대체 표현: '신뢰받는', '검증된'" 수정 제안
```

**시나리오:** 핵심 메시지와 무관한 카피 생성

```yaml
문제:
  - core_message "자연 유래 성분"과 관련 없는 가격 할인 중심 카피 생성
  - USP(HydraShield)가 카피에 반영되지 않음

결과:
  - copy_rationale에서 메시지 정합성 점수 낮음
  - "핵심 메시지와의 정합성이 부족합니다. core_message를 재확인하세요" 경고
  - mandatory 표현(HydraShield) 누락으로 phrase_check 실패
```

---

## 테스트 케이스

| ID | 시나리오 | 입력 조건 | 기대 결과 |
|----|----------|-----------|-----------|
| TC-01 | 정상 카피 생성 | 완전한 브리프, 톤가이드, 표현 규칙 | 3개 후보 + rationale + 권장 후보 선정 |
| TC-02 | 금지 표현 감지 | "최고" 포함 브리프 | 금지 표현 제외, 대체 표현 제안 |
| TC-03 | 톤 미달 | 과도한 구어체 카피 | 톤 적합도 0.6 미만, 자동 재생성 |
| TC-04 | 필수 표현 누락 | mandatory phrase 미포함 카피 | 자동 삽입 위치 제안 |
| TC-05 | HITL 승인 | 브랜드 매니저 승인 | 승인 상태 기록, 다음 단계 진행 |
| TC-06 | HITL 수정 요청 | 브랜드 매니저 수정 요청 | 2단계부터 재실행 |
| TC-07 | 문자 수 초과 | headline 30자 제한에 40자 카피 | 자동 축약 시도, 성공 시 통과 |
