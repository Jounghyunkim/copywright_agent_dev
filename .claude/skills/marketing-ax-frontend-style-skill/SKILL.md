---
name: marketing-ax-frontend-style-skill
description: Use when bootstrapping or aligning a React/Vite/TS frontend to the Marketing AX design system — LG Red theme, sidebar layout, Card/Badge/Button/Toast/Modal components, and global styles.
author: Jays Lee (sjae.lee@lge.com)
created: 2026-04-13
---

# Marketing AX Frontend Style Skill

## When To Use

Use this skill when the user asks to:

- bootstrap a new Marketing AX frontend project
- apply the Marketing AX design system to an existing React project
- align UI components (Card, Badge, Button, Toast, Modal) to the Marketing AX style
- set up the sidebar + topbar layout structure
- add server connection failure toast notifications

## Prerequisites

- React 18+ with Vite + TypeScript
- Google Fonts 접근 가능 환경

## Dependencies

### 추가 설치 필요

```bash
npm install clsx react-router-dom
```

| 패키지 | 용도 | 사용처 |
|--------|------|--------|
| `clsx` | className 조합 (`cn()` 유틸리티) | 모든 UI 컴포넌트 |
| `react-router-dom` | `NavLink`, `useNavigate`, `Outlet` | AppShell 사이드바, GearMenu, 라우터 |

### Vite 템플릿에 이미 포함

| 패키지 | 비고 |
|--------|------|
| `react` | 18+ |
| `react-dom` | 18+ |
| `typescript` | |
| `vite` | |
| `@vitejs/plugin-react` | |

## Design System Overview

### Color Palette

전체 토큰은 `references/tokens.css` 참조. 아래는 용도별 정리.

**LG Red (브랜드)**

| Token | Value | Usage |
|-------|-------|-------|
| `--lg-red-900` | `#6d000f` | 사이드바 그라디언트 끝, 배경 radial-gradient |
| `--lg-red-800` | `#8a0013` | 예비 |
| `--lg-red-700` | `#a50019` | 사이드바 그라디언트 시작, 프라이머리 호버 |
| `--lg-red-600` | `#c60021` | **프라이머리 색상** (버튼, 링크) |
| `--lg-red-500` | `#d7182a` | 차트 색상 (Recharts fill/stroke) |
| `--lg-red-400` | `#e84a5b` | 예비 (밝은 강조) |
| `--lg-red-300` | `#f07a86` | 예비 |
| `--lg-red-100` | `#fde8eb` | 프라이머리 뱃지 배경, danger 뱃지 배경 |

**Neutral (그레이스케일)**

| Token | Value | Usage |
|-------|-------|-------|
| `--neutral-950` | `#111111` | 카드 그림자 기준색 (rgba) |
| `--neutral-900` | `#1d1d1f` | 본문 텍스트, 제목 |
| `--neutral-700` | `#4b4b52` | 보조 텍스트 (subtitle, description) |
| `--neutral-500` | `#7a7a84` | 비활성 텍스트, placeholder, 날짜 |
| `--neutral-200` | `#e7e7eb` | 보더, 구분선 |
| `--neutral-100` | `#f4f4f7` | 서브틀 배경, secondary 버튼 배경 |
| `--white` | `#ffffff` | 카드 배경, 버튼 텍스트, 사이드바 텍스트 |

**Semantic (상태)**

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#157347` | 성공 뱃지 텍스트 |
| `--warning` | `#b26a00` | 경고 뱃지 텍스트 |
| `--danger` | `#b42318` | 위험 뱃지 텍스트, danger 버튼 배경 |

**컴포넌트 내 하드코딩 색상 (tokens.css 외)**

| 색상 | 위치 | 용도 |
|------|------|------|
| `#e7f6ee` | badge-success 배경 | 연한 초록 |
| `#fff4e1` | badge-warning 배경 | 연한 주황 |
| `#fbd6db` | nav-item 기본 텍스트 | 사이드바 비활성 링크 |
| `#e0dce2` | card:hover border | 호버 시 보더 색 |
| `#fef2f2` | toast destructive 배경 | 연한 빨강 |
| `#fca5a5` | toast destructive 보더 | 밝은 빨강 |
| `#b91c1c` | toast destructive 제목 | 진한 빨강 |
| `#991b1b` | toast destructive 설명 | 더 진한 빨강 |

### Typography

| 용도 | 폰트 |
|------|------|
| UI 본문 | Noto Sans KR → Pretendard → Apple SD Gothic Neo → Segoe UI |
| 영문 보조 | Inter (300~800 weight) |
| 코드/데이터 | JetBrains Mono (400, 600, 700) |
| 한국어 세리프 | Noto Serif KR (특수 표시용) |

### Layout Dimensions

| 요소 | 값 |
|------|-----|
| 사이드바 폭 | 260px |
| 카드 border-radius | 14px |
| 버튼 border-radius | 10px (compact: 8px) |
| 뱃지 border-radius | 999px (pill) |
| 반응형 breakpoint | max-width: 1100px |
| 모달 기본 폭 | 480px (max 90vw) |
| 토스트 최대 폭 | 380px |

### Z-index Hierarchy

| 레이어 | z-index |
|--------|---------|
| Toast | 9999 |
| Modal overlay | 1000 |
| Dropdown menu | 100 |
| Topbar | implicit (DOM order) |

## File Structure

```
frontend/
├── index.html                          ← Google Fonts 로딩
├── src/
│   ├── main.tsx                        ← tokens.css + globals.css import
│   ├── shared/
│   │   ├── lib/cn.ts                   ← clsx wrapper
│   │   ├── styles/
│   │   │   ├── tokens.css              ← CSS custom properties
│   │   │   └── globals.css             ← 레이아웃, 컴포넌트 기본 스타일
│   │   └── ui/
│   │       ├── app-shell.tsx           ← 사이드바 + 톱바 + 본문 레이아웃
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── field.tsx               ← FieldLabel, TextInput, TextArea
│   │       ├── step-indicator.tsx      ← 단계 표시 (pending/active/done)
│   │       ├── toast.tsx               ← 포탈 기반 토스트
│   │       └── modal.tsx               ← 포탈 기반 모달
│   └── app/
│       └── router.tsx                  ← AppShell 안에 라우트
```

## Procedure (새 프로젝트에 적용)

### Phase 1: 프로젝트 초기화

1. **Vite 프로젝트 생성** (이미 있으면 건너뜀):
   ```bash
   npm create vite@latest my-project -- --template react-ts
   cd my-project
   ```

2. **의존성 설치**:
   ```bash
   npm install
   npm install clsx react-router-dom
   ```

3. **Vite 기본 파일 정리** — 아래 파일 삭제 (Marketing AX 스타일로 대체):
   - `src/App.tsx` — 삭제
   - `src/App.css` — 삭제
   - `src/index.css` — 삭제

4. **`@/` alias 설정 (두 곳 모두 필수)**:
   - `vite.config.ts` — `references/vite-config-alias.ts` (Vite 번들러용)
   - `tsconfig.app.json` — `references/tsconfig-paths.json` (TypeScript 컴파일러/IDE용)
   - 둘 중 하나라도 빠지면 빌드 또는 IDE에서 import 에러 발생

### Phase 2: 디자인 시스템 파일 배치

5. `index.html` 교체 — `references/index-html.html` (`__PROJECT_TITLE__` 수정)
   - **Noto Sans KR** (primary UI 폰트), Inter, Noto Serif KR, JetBrains Mono 포함 확인

6. 디렉토리 생성 + 파일 복사:
   ```
   src/shared/lib/cn.ts       ← references/cn-util.ts
   src/shared/styles/tokens.css ← references/tokens.css
   src/shared/styles/globals.css ← references/globals.css
   src/shared/ui/card.tsx      ← references/components/card.tsx
   src/shared/ui/badge.tsx     ← references/components/badge.tsx
   src/shared/ui/button.tsx    ← references/components/button.tsx
   src/shared/ui/field.tsx     ← references/components/field.tsx
   src/shared/ui/toast.tsx     ← references/components/toast.tsx
   src/shared/ui/modal.tsx     ← references/components/modal.tsx
   src/shared/ui/step-indicator.tsx ← references/components/step-indicator.tsx
   ```

### Phase 3: 앱 구조 연결

7. `src/shared/ui/app-shell.tsx` 생성 — `references/app-shell-skeleton.tsx`를 기반으로 프로젝트에 맞게 수정
   - `BRAND_TITLE` 변경
   - `mainNav` 배열을 프로젝트 메뉴로 수정
   - GearMenu 내 메뉴 항목 수정

8. `src/main.tsx` 작성 — Vite 기본 코드를 아래로 교체:
   ```tsx
   import React from 'react'
   import { createRoot } from 'react-dom/client'
   import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'

   import '@/shared/styles/tokens.css'   // ← 순서 중요: tokens 먼저
   import '@/shared/styles/globals.css'   // ← globals 다음

   import { AppShell } from '@/shared/ui/app-shell'

   const router = createBrowserRouter([
     {
       path: '/',
       element: <AppShell><Outlet /></AppShell>,  // ← Outlet으로 자식 라우트 렌더링
       children: [
         { index: true, element: <div>홈</div> },
         // 프로젝트별 라우트 추가
       ],
     },
   ])

   createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <RouterProvider router={router} />
     </React.StrictMode>,
   )
   ```

   > **핵심**: `<AppShell><Outlet /></AppShell>` 구조. AppShell이 사이드바+톱바를 그리고, `<Outlet />`이 현재 라우트의 페이지 컴포넌트를 렌더링한다.

## 컴포넌트별 사용 가이드

### Card

```tsx
<Card>카드 내용</Card>
<Card className="stack">여러 요소를 gap 0.8rem으로 배치</Card>
```

- 호버 시 약간 위로 떠오르는 효과 (translateY -1px)
- `.stack` 클래스 조합으로 내부 요소 간격 조절

### Badge

```tsx
<Badge tone="success">성공</Badge>
<Badge tone="danger">실패</Badge>
<Badge tone="warning">대기</Badge>
<Badge tone="primary">중요</Badge>
<Badge>기본</Badge>
```

### Button

```tsx
<Button>기본 (Primary)</Button>
<Button variant="secondary">보조</Button>
<Button variant="danger">위험</Button>
<Button variant="ghost">투명</Button>
```

### Toast (서버 연결 실패 표시)

```tsx
<Toast
  open={!sseConnected}
  variant="destructive"
  title="서버 연결 끊김"
  description="실시간 연결이 끊어졌습니다. 데이터가 자동 갱신되지 않을 수 있습니다."
/>
```

- Portal 기반 (document.body에 렌더링)
- `open` prop으로 표시/숨김 제어
- slide-in + fade-in 애니메이션
- `destructive` 변형: 빨간 배경 + 경고 아이콘

### Modal

```tsx
<Modal open={showModal} onClose={() => setShowModal(false)} title="확인">
  <p>정말 삭제하시겠습니까?</p>
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
    <Button variant="ghost" onClick={() => setShowModal(false)}>취소</Button>
    <Button variant="danger" onClick={handleDelete}>삭제</Button>
  </div>
</Modal>
```

- 백드롭 클릭 또는 ESC 키로 닫기
- fadeIn + slideUp 애니메이션

### StepIndicator (단계 표시)

3가지 상태: `pending` / `active` / `done`

```tsx
import { StepIndicator } from '@/shared/ui/step-indicator'

{/* 카드 안에 수평 배치 + 화살표 구분자 */}
<Card style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0.65rem 1rem' }}>
  <StepIndicator step={1} label="입력" active={false} done />
  <span style={{ color: 'var(--neutral-300)' }}>&rarr;</span>
  <StepIndicator step={2} label="처리 중" active done={false} />
  <span style={{ color: 'var(--neutral-300)' }}>&rarr;</span>
  <StepIndicator step={3} label="완료" active={false} done={false} />
</Card>
```

**상태별 스타일:**

| 상태 | 원형 배경 | 원형 텍스트 | 라벨 색상 |
|------|----------|-----------|----------|
| pending | `var(--neutral-200)` | `var(--neutral-500)` + 숫자 | `var(--neutral-500)` |
| active | `var(--lg-red-700)` | `#fff` + 숫자 | `var(--neutral-900)` |
| done | `var(--success, #22c55e)` | `#fff` + 체크마크(✓) | `var(--success)` |

**치수:**
- 원형 뱃지: 22x22px, `borderRadius: '50%'`
- 숫자/체크: `fontSize: 12`, `fontWeight: 700`
- 라벨: `<small>`, `fontWeight: 600`
- 원형과 라벨 간격: `gap: 6`
- 단계 간 간격: `gap: 16` (카드 flex)
- 단계 구분 화살표: `→` (`&rarr;`), `color: var(--neutral-300)`

### Field

```tsx
<FieldLabel>라벨</FieldLabel>
<TextInput placeholder="입력" />
<TextArea placeholder="긴 텍스트" />
```

## 배경 스타일 특징

본문 배경은 단색이 아닌 **LG Red 기반 미묘한 그라디언트**:

```css
background:
  radial-gradient(circle at top right, rgba(215, 24, 42, 0.08), transparent 45%),
  radial-gradient(circle at bottom left, rgba(109, 0, 15, 0.08), transparent 40%),
  var(--color-surface-subtle);
```

- 우상단과 좌하단에서 LG Red가 은은하게 번지는 효과
- 불투명도 8%로 매우 미묘하게 처리
- 기본 배경색(`--color-surface-subtle`: #f4f4f7) 위에 겹침

## 세부 스타일 사양 (느낌을 결정하는 요소)

### Box Shadow (카드의 깊이감)

```css
/* 기본 상태 — 가벼운 부유 */
box-shadow:
  0 8px 24px rgba(17, 17, 17, 0.06),
  0 1px 2px rgba(17, 17, 17, 0.06);

/* 호버 상태 — 더 깊은 부유 + 살짝 위로 */
box-shadow:
  0 14px 30px rgba(17, 17, 17, 0.1),
  0 2px 5px rgba(17, 17, 17, 0.08);
transform: translateY(-1px);
```

`rgba(17,17,17)` = `--neutral-950` 기반. 순수 검정이 아닌 회색 톤으로 자연스러운 그림자.

### Transition 타이밍

| 요소 | 속도 | 속성 |
|------|------|------|
| 버튼 | `0.16s ease` | transform, box-shadow, background-color |
| 카드 | `0.2s ease` | box-shadow, transform, border-color |
| 토스트 | `0.3s ease` | transform, opacity |
| 모달 fadeIn | `0.15s ease` | opacity |
| 모달 slideUp | `0.2s ease` | opacity, transform |
| 사이드바 섹션 접기 | `0.35s ease` | max-height, opacity |

### pen-btn 호버 패턴 (카드 내 편집 버튼)

카드 안의 편집 버튼은 평소 투명하다가 카드 호버 시 나타남:

```tsx
{/* 카드 안에서 사용 */}
<button className="pen-btn" onClick={handleEdit}>편집</button>
```

```css
/* globals.css에 이미 포함 */
.pen-btn { opacity: 0.25; transition: opacity 0.2s ease; }
.card:hover > * .pen-btn,
.card:hover > .pen-btn { opacity: 1; }
```

### 톱바 Frosted Glass 효과

```css
.topbar {
  background: rgba(255, 255, 255, 0.88);  /* 반투명 백색 */
  backdrop-filter: blur(8px);              /* 배경 블러 */
}
```

스크롤 시 본문 배경의 radial-gradient가 블러되어 보이며 고급스러운 느낌.

## Inline Style Conventions (페이지 작성 시 따를 규칙)

이 프로젝트에서는 globals.css의 클래스와 함께 **인라인 스타일**을 병행 사용한다.
아래 값들은 전체 페이지에서 일관되게 사용되므로 새 페이지 작성 시 반드시 따를 것.

### Font Size 계층

| 용도 | fontSize | 예시 |
|------|----------|------|
| 페이지 제목 | CSS `.page-title` (1.25rem) | `<h2 className="page-title">` |
| 섹션 제목 (카드 내) | `14` | `<h3 style={{ fontSize: 14 }}>` |
| 본문 텍스트, 입력 | `14` | input, 설명 텍스트 |
| 보조 텍스트, 버튼 내 | `13` | 필터 라벨, 상태 메시지, 에러 |
| 메타데이터 (날짜, ID) | `12` | 추가일, 추가자, 작은 라벨 |
| 뱃지/태그 내부 | `11` | 인라인 버튼, 태그 텍스트 |

### Spacing (gap / padding) 규칙

| 값 | 용도 |
|----|------|
| `gap: 4` | 라벨과 입력 사이, 아주 촘촘한 간격 |
| `gap: 6` | 필터 버튼 그룹, 뱃지 그룹 |
| `gap: 8` | 폼 컨트롤, 수평 배치 요소 |
| `gap: 12` | 카드 내 섹션, 메뉴 항목 |
| `gap: 16` | 큰 섹션 간격 |
| `padding: '8px 12px'` | **모든 input/select** (고정) |
| `padding: '8px 16px'` | 일반 버튼 |
| `padding: '4px 10px'` | 테이블 내 소형 버튼 |
| `padding: '10px 16px'` | 드롭다운 메뉴 항목 |
| `padding: '20px 16px'` | 카드 내부 (통계, 차트 등) |
| `marginTop: 16` | 카드 간 간격 |
| `marginBottom: 12` | 카드 내 제목 아래 |

### 텍스트 색상 규칙

| 용도 | 색상 |
|------|------|
| 제목, 주요 텍스트 | `var(--neutral-900)` |
| 보조 텍스트 (조직명, ID) | `var(--neutral-600)` |
| 비활성 텍스트 (날짜, placeholder) | `var(--neutral-500)` |
| 에러 메시지 | `var(--color-danger, #d32f2f)` |
| 위험 버튼/링크 (로그아웃, 삭제) | `var(--color-danger, #d32f2f)` |

### Border Radius 규칙

| 값 | 용도 |
|----|------|
| `6` | 인라인 input, 소형 요소 |
| `8` | 검색 바, compact 버튼 |
| `10` | 드롭다운 메뉴, 토스트, 네비 항목 |
| `14` | 카드, 모달 (globals.css `.card`) |
| `16` | 프로세싱 모달 |
| `999px` | 뱃지 (pill 형태, globals.css `.badge`) |

### 페이지 헤더 패턴 (반복 구조)

```tsx
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
  <div>
    <h2 className="page-title">페이지 제목</h2>
    <p className="page-subtitle">설명</p>
  </div>
  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
    {/* 우측: 필터, 셀렉트, 버튼 등 */}
  </div>
</div>
```

### 테이블 스타일 패턴

```tsx
<div style={{ overflowX: 'auto' }}>
  <table className="table" style={{ width: '100%' }}>
    <thead>
      <tr>
        <th>이름</th>
        <th>ID</th>
        <th style={{ textAlign: 'right' }}>수치 컬럼</th>  {/* 숫자는 우정렬 */}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ fontWeight: 500 }}>주요 값</td>              {/* 첫 번째 컬럼 볼드 */}
        <td style={{ color: 'var(--neutral-600)' }}>보조 값</td>   {/* ID, 조직 등 */}
        <td style={{ textAlign: 'right' }}>123</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 상태 표시 패턴

```tsx
{/* 로딩 */}
<p style={{ fontSize: 13, color: 'var(--neutral-500)', marginTop: 8 }}>검색 중...</p>

{/* 빈 상태 */}
<p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>데이터가 없습니다.</p>

{/* 에러 */}
<p style={{ fontSize: 13, color: 'var(--color-danger, #d32f2f)', marginTop: 8 }}>
  오류 메시지
</p>
```

### 드롭다운 메뉴 패턴 (GearMenu)

```tsx
{/* 메뉴 컨테이너 */}
<div style={{
  position: 'absolute', bottom: 44, left: 0,
  background: '#fff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  minWidth: 160, overflow: 'hidden', zIndex: 100,
}}>

{/* 메뉴 항목 */}
<button style={{
  display: 'block', width: '100%',
  padding: '10px 16px',
  background: 'none', border: 'none',
  textAlign: 'left', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
  color: 'var(--neutral-900)',
}}>항목</button>

{/* 구분선 */}
<div style={{ borderTop: '1px solid var(--color-border, #e5e7eb)' }} />

{/* 위험 항목 (로그아웃 등) */}
<button style={{ ...같은 스타일, color: 'var(--color-danger, #d32f2f)' }}>로그아웃</button>
```

### 스피너 (Processing Modal)

```tsx
<div style={{
  width: 48, height: 48,
  border: '4px solid var(--neutral-200, #e5e7eb)',
  borderTopColor: 'var(--lg-red-700, #c4314b)',
  borderRadius: '50%',
  animation: 'modal-spin 0.8s linear infinite',
}} />
<style>{`@keyframes modal-spin { to { transform: rotate(360deg) } }`}</style>
```

## Quick Self-Check

### Setup
- `clsx`와 `react-router-dom`이 설치되어 있는가?
- Vite 기본 파일 (`App.tsx`, `App.css`, `index.css`)이 삭제되었는가?
- tokens.css와 globals.css가 main.tsx에서 순서대로 import 되는가? (Vite 기본 `index.css` import 제거)
- index.html에 Google Fonts (**Noto Sans KR**, Inter, Noto Serif KR, JetBrains Mono) 로딩이 있는가?
- vite.config.ts에 `@/` → `./src` alias가 설정되어 있는가?
- tsconfig.app.json에 `baseUrl: "./src"` + `paths: {"@/*": ["./*"]}` 가 설정되어 있는가?

### Layout
- 사이드바 그라디언트가 `linear-gradient(170deg, --lg-red-900, --lg-red-700)` 인가?
- 카드 border-radius가 14px이고 호버 시 떠오르는 효과가 있는가?
- 반응형 breakpoint 1100px에서 사이드바가 접히는가?
- 토스트가 Portal 기반으로 fixed bottom-right에 표시되는가?
- 모달에 ESC 키 닫기와 백드롭 클릭 닫기가 있는가?

### Inline Convention (새 페이지 작성 시)
- input padding이 `8px 12px`이고 borderRadius `6`인가?
- 보조 텍스트에 `var(--neutral-600)`, 비활성 텍스트에 `var(--neutral-500)` 사용하는가?
- 에러 메시지에 `fontSize: 13`, `color: var(--color-danger, #d32f2f)` 사용하는가?
- 테이블 숫자 컬럼이 `textAlign: 'right'`인가?
- 빈 상태 메시지가 `fontSize: 13`, `color: var(--neutral-500)`인가?
- 페이지 헤더가 title/subtitle 좌측 + 컨트롤 우측 구조인가?
