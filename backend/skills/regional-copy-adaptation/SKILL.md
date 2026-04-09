---
name: regional-copy-adaptation
description: 지역별 문화·규정·언어 특성에 맞게 카피를 현지화
action_tags:
- localization
role_tags:
- 지역화 검증
---
글로벌 원형 카피를 지역 맥락에 맞게 transcreation하는 프로시저 스킬이다. 단순 번역이 아닌 문화적 맥락, 계절성, 고객 세그먼트를 고려한 현지화를 수행하며, 현지화 과정에서 발생할 수 있는 리스크를 사전에 식별한다.

---

## 사용 조건

| 조건 | 설명 |
|------|------|
| 글로벌 카피 승인 완료 | global-core-copy-generation에서 승인된 원형 카피가 존재할 때 |
| 특정 지역 타깃팅 | 원형 카피를 특정 국가/지역에 배포해야 할 때 |
| 문화적 현지화 필요 | 단순 번역이 아닌 문화적 맥락 반영이 필요할 때 |
| 시장 진입/확장 | 새로운 시장에 진입하거나 기존 시장에서 메시지를 갱신할 때 |

**선행 조건:**
- `global_copy`가 HITL 승인을 받은 상태여야 한다.
- `locale_market_context`에 해당 지역의 문화/시장 정보가 포함되어야 한다.
- 해당 지역의 언어 리소스(번역 엔진 또는 현지 크리에이터)가 가용해야 한다.

---

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `global_copy` | `GlobalCoreCopy` | Y | 승인된 글로벌 기준 카피 (headline, body, CTA) |
| `locale_market_context` | `LocaleContext` | Y | 대상 지역의 언어, 문화, 시장 특성 정보 |
| `cultural_constraints` | `CulturalConstraints` | Y | 문화적 금기, 선호 표현, 색상/이미지 제약 |
| `target_locale` | `Locale` | Y | 대상 로케일 (언어 + 국가 코드, 예: ko-KR, ja-JP) |
| `local_competitor_context` | `CompetitorContext` | N | 현지 경쟁 환경 정보 |
| `seasonal_context` | `SeasonalContext` | N | 현지 계절, 공휴일, 이벤트 시즌 정보 |
| `segment_profile` | `SegmentProfile` | N | 현지 타깃 세그먼트 프로필 |

---

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `localized_candidates` | `list[LocalizedCopy]` | 지역별 후보 카피 목록 (headline + body + CTA) |
| `localization_rationale` | `list[LocalizationRationale]` | 각 후보의 현지화 의사결정 근거 |
| `risk_candidates` | `list[LocalizationRisk]` | 현지화 과정에서 식별된 리스크 후보 |
| `back_translation` | `list[BackTranslation]` | 역번역 결과 (원형과의 의미 보존도 검증용) |
| `cultural_fit_score` | `dict[str, float]` | 각 후보의 문화 적합도 점수 (0.0-1.0) |

---

## 실행 단계

```
1. 원형 카피 분석 및 핵심 의도 추출
   → global_copy에서 핵심 메시지, 감정 톤, 의도를 구조적으로 분석
   → 반드시 보존해야 할 요소(브랜드명, 필수 표현)와 변형 가능 요소를 구분

2. [language-transcreation] 언어적 현지화
   → target_locale에 맞는 transcreation 수행
   → 단순 번역이 아닌 현지 언어의 자연스러운 표현으로 재창작
   → back_translation 생성하여 의미 보존도 검증

3. [regional-culture-fit-check] 문화 적합성 검증
   → cultural_constraints 기반 문화적 금기 위반 여부 점검
   → 현지 문화 코드에 맞는 표현/비유/유머 적절성 평가
   → cultural_fit_score 산출

4. [seasonality-fit-check] 계절성 적합성 검증
   → seasonal_context 기반 시즌 적합성 평가
   → 현지 공휴일, 기념일, 날씨 패턴과의 정합성 확인
   → 시즌 부적합 시 대체 표현 제안

5. [customer-segment-fit-check] 고객 세그먼트 적합성 검증
   → segment_profile 기반 타깃 세그먼트와의 공감도 평가
   → 연령대, 성별, 라이프스타일에 맞는 표현 수준 확인
   → 세그먼트 부적합 시 조정 제안

6. 리스크 종합 및 후보 순위 결정
   → 문화/계절/세그먼트 적합성 점수를 종합
   → risk_candidates 목록 정리
   → 최적 후보 순위 결정 및 localization_rationale 작성
```

**가드레일:**
- back_translation과 원형 카피의 의미 유사도가 0.7 미만이면 재작업한다.
- cultural_fit_score가 0.5 미만인 후보는 자동 폐기한다.
- 문화적 금기 위반이 감지되면 해당 후보를 즉시 차단하고 대체 표현을 생성한다.
- 원형 카피의 필수 보존 요소(브랜드명 등)가 누락되면 자동 복원한다.

---

## HITL 정책

| 게이트 | 승인 역할 | 조건 |
|--------|-----------|------|
| 현지화 카피 리뷰 | 지역 마케팅 매니저 | 모든 현지화 카피에 대해 필수 |
| 문화 리스크 리뷰 | 현지 문화 자문 | 문화 적합도 0.5-0.7 구간의 카피 |
| 역번역 검증 | 본사 브랜드 매니저 | 의미 유사도 0.7-0.8 구간의 카피 |
| 금기 표현 예외 | 지역 법무 + 마케팅 | 문화적 금기에 해당하지만 전략적으로 사용하고자 할 때 |

- 지역 마케팅 매니저가 수정을 요청하면 2단계(language-transcreation)부터 재실행한다.
- 문화 리스크가 amber 이상이면 현지 문화 자문의 승인 없이 진행할 수 없다.

---

## 도구 정책

| 도구 | 권한 | 설명 |
|------|------|------|
| `docs.read` | 허용 | 지역 시장 보고서, 문화 가이드 조회 |
| `brand_guide.read` | 허용 | 글로벌/지역별 브랜드 가이드 조회 |
| `policy.read` | 허용 | 현지 광고 규정, 문화적 가이드라인 조회 |
| `evidence.read` | 허용 | 현지 소비자 조사, 경쟁사 분석 자료 조회 |
| `external.publish` | 승인 필요 | 현지화 카피 확정 후 다음 단계에 전달 |
| `bulk.export` | 승인 필요 | 현지화 후보 일괄 내보내기 |
| `system.write` | 승인 필요 | 현지화 상태 기록 |

---

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| Transcreation 품질 미달 | 의미 보존도가 현저히 낮음 | back_translation 비교 리포트 생성, 재작업 요청 |
| 문화 금기 위반 | 현지 문화에서 부정적/공격적으로 해석되는 표현 | 즉시 차단, 대체 표현 제안, 현지 자문 에스컬레이션 |
| 계절 부적합 | 현지 계절/시즌과 맞지 않는 표현 | 대체 표현 제안 (예: 남반구 여름/겨울 역전) |
| 세그먼트 미스매치 | 타깃 세그먼트의 언어 수준/선호와 불일치 | 세그먼트 프로필 기반 표현 수준 조정 |
| 필수 요소 누락 | transcreation 과정에서 브랜드명/필수 표현 탈락 | 자동 복원 후 자연스러운 위치 재배치 |
| 언어 리소스 부족 | 해당 로케일의 번역 엔진/크리에이터 미가용 | 워크플로 중단, 리소스 확보 후 재시작 |

---

## 좋은 예시

**시나리오:** 스킨케어 브랜드 글로벌 카피를 일본 시장에 현지화

```yaml
입력:
  global_copy:
    headline: "여름 피부, HydraShield로 지키세요"
    body: "자연 유래 특허 성분 HydraShield가 여름 자외선과 열기로부터 피부를 보호합니다."
    cta: "건강한 여름 피부 시작하기"
  target_locale: ja-JP
  locale_market_context:
    beauty_trend: "미백·보습 중시, 자연주의 선호 증가"
    communication_style: "정중하고 과학적 근거 중시"
  cultural_constraints:
    avoid: ["과도한 직접 비교", "지나친 자기 주장"]
  seasonal_context:
    current_season: "梅雨 (장마) → 여름"
    relevant_events: ["お盆 (오봉)"]

결과:
  localized_candidates:
    - headline: "夏の素肌を、HydraShieldで守る"
      body: "自然由来の特許成分HydraShieldが、紫外線や暑さからお肌をやさしく守ります。"
      cta: "健やかな夏肌へ、始めましょう"
  localization_rationale:
    - "일본 시장의 정중한 커뮤니케이션 스타일을 반영하여 'やさしく(부드럽게)' 추가"
    - "장마 시즌을 고려하여 보습 측면도 암시"
  cultural_fit_score: { variant_1: 0.91 }
  back_translation:
    - "여름 맨 피부를, HydraShield로 지키다"  # 의미 유사도: 0.93
```

---

## 나쁜 예시

**시나리오:** 기계 번역만으로 현지화 처리

```yaml
문제:
  - Google Translate 수준의 직역 적용
  - "건강한 여름 피부 시작하기" → "健康な夏の肌を開始する" (부자연스러운 표현)
  - 문화적 맥락(장마 시즌, 정중한 톤) 미반영

결과:
  - cultural_fit_score: 0.35 (자동 폐기 기준 미달)
  - back_translation 의미 유사도: 0.82이지만 자연스러움 부족
  - "직역체가 감지되었습니다. transcreation을 재수행하세요" 경고
```

**시나리오:** 중동 시장에 부적절한 이미지 연상 표현 사용

```yaml
문제:
  - "돼지 피부처럼 탄력있는" 비유 사용 (이슬람 문화권 금기)

결과:
  - cultural_constraints 위반 즉시 감지
  - 해당 후보 자동 차단
  - "문화적 금기 위반이 감지되었습니다. 해당 표현은 이슬람 문화권에서 부적절합니다" 경고
  - 대체 표현 제안: "실크처럼 부드러운"
```

---

## 테스트 케이스

| ID | 시나리오 | 입력 조건 | 기대 결과 |
|----|----------|-----------|-----------|
| TC-01 | 정상 일본 현지화 | 완전한 글로벌 카피, ja-JP 컨텍스트 | 현지화 카피 + rationale + cultural_fit 0.8 이상 |
| TC-02 | 문화 금기 감지 | 이슬람 문화권 금기 표현 포함 | 즉시 차단, 대체 표현 제안 |
| TC-03 | 역번역 의미 유사도 미달 | 유사도 0.65 | 재작업 트리거 |
| TC-04 | 남반구 계절 역전 | 호주 시장, 원형에 "여름" 표현 | 계절 부적합 감지, 대체 표현 제안 |
| TC-05 | 브랜드명 누락 | transcreation 시 HydraShield 탈락 | 자동 복원 |
| TC-06 | 세그먼트 미스매치 | 10대 타깃에 격식체 사용 | 표현 수준 조정 제안 |
| TC-07 | 다수 후보 생성 | num_variants: 5 | 5개 후보 + 순위 + 권장 후보 |
