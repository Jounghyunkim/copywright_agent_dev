---
name: add-workflow-step
description: "기존 워크플로우에 새로운 스텝을 추가한다. HUMAN 스텝(입력 폼) 또는 AI 스텝(처리 + 애니메이션)을 선택할 수 있다."
user-invocable: true
argument-hint: "[step-type: human|ai] [step-name] [step-description]"
context: fork
allowed-tools: Write, Read, Edit, Glob
---

# 워크플로우 스텝 추가

## 개요

기존 스텝 기반 위자드에 새로운 스텝을 추가한다.

인자:
- `$ARGUMENTS[0]`: 스텝 타입 (human 또는 ai)
- `$ARGUMENTS[1]`: 스텝 이름 (예: "계약 검토")
- `$ARGUMENTS[2]`: 스텝 설명

## HUMAN 스텝 추가 시

### 프론트엔드 변경

1. **Step 타입 확장**
   `new-workflow-page.tsx`에서 `type Step` 유니온에 새 번호 추가
   ```typescript
   type Step = 1 | 2 | 3 | 4 | 5 | ... | N+1
   ```

2. **STEP_LABELS 배열에 추가**
   ```typescript
   const STEP_LABELS = [...existing, '$ARGUMENTS[1]']
   ```

3. **입력 폼 컴포넌트 생성**
   스텝 렌더링 영역에 새 `{step === N && (...)}` 블록 추가
   - `FieldLabel` + `TextInput` / `TextArea` 조합
   - 한국어 라벨과 placeholder 포함
   - "다음" 버튼으로 다음 스텝 전환

4. **스텝 전환 핸들러 작성**
   필요 시 API 호출 로직 추가 (예: POST /approvals/{id}/approve)

### 백엔드 변경 (필요 시)

5. **approval_type 추가**
   `approval_service.py`에 새 approval_type 핸들러 추가

6. **이벤트 타입 추가**
   새 ExecutionEvent 타입 정의

## AI 스텝 추가 시

### 프론트엔드 변경

1. **Step 타입 확장** (HUMAN과 동일)

2. **STEP_LABELS 배열에 추가** (HUMAN과 동일)

3. **인라인 애니메이션 뷰 생성**
   다크 배경 영역에 프로그레스 표시:
   ```tsx
   {step === N && (
     <div style={{
       background: 'linear-gradient(180deg, #0d0d1a, #1a1a2e, #0f3460)',
       borderRadius: 20, padding: '32px 24px',
       minHeight: 'calc(100vh - 220px)',
       display: 'flex', flexDirection: 'column',
       alignItems: 'center', justifyContent: 'center',
     }}>
       {/* 프로그레스 링 또는 스피너 */}
       {/* 상태 메시지 */}
     </div>
   )}
   ```

4. **timeline polling에 새 이벤트 타입 추가**
   ```typescript
   if (ev.event_type === 'YOUR_NEW_EVENT') {
     setStep(nextStep)
   }
   ```

5. **자동 전환 또는 결과 확인 후 수동 전환**
   - 자동: 이벤트 감지 → 바로 다음 스텝
   - 수동: 결과 표시 → "확인 완료" 버튼 → 다음 스텝

### 백엔드 변경

6. **서비스 메서드 추가**
   `generation_service.py` 또는 새 서비스에 처리 로직 추가

7. **이벤트 발행**
   처리 시작/완료 시 ExecutionEvent 기록 + DB commit

8. **아티팩트 저장**
   결과물이 있으면 Artifact 테이블에 저장

## 검증

스텝 추가 후 확인:
1. 스텝 진행 바에 새 스텝이 표시되는지
2. 해당 스텝에서 정상 렌더링되는지
3. 이전/다음 스텝 전환이 올바른지
4. URL resume (?step=N)이 동작하는지
