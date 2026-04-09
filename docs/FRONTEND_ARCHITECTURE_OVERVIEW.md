# Frontend Architecture Overview

> Last updated: 2026-04-08

---

## 1. Tech Stack

| Item | Detail |
|------|--------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 5 |
| Routing | React Router v7 |
| Server State | TanStack React Query 5 |
| UI State | Zustand 5 |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |
| Styling | CSS Variables + Inline Styles (no external CSS framework) |
| i18n | Custom hook-based (3 languages: EN/KO/DE) |
| Dev Server | Vite (port 5173, proxies `/api` → backend:5000) |

---

## 2. Project Structure

```
frontend/src/
├── main.tsx                 # React entry point
├── app/
│   ├── router.tsx           # 6 routes under AppShell
│   └── providers.tsx        # QueryClient + EventBridge
├── pages/
│   ├── home/                # Dashboard — stats + campaign list
│   ├── landing/             # About / marketing page
│   ├── new-workflow/        # 5-step workflow wizard (1316 lines)
│   ├── workflow-list/       # Campaign list view
│   ├── workflow-detail/     # Load campaign → NewWorkflowPage
│   └── settings/            # Language + Skill Builder + Skill Manager
├── components/              # Legacy JSX components
│   ├── BriefingForm.jsx     # 9-section campaign brief form
│   ├── AnalysisReport.jsx   # 10-field report card grid
│   ├── StrategicMessage.jsx # 5-card strategic message display
│   ├── GenerationConfig.jsx # Country/persona/writer config
│   ├── CopyResults.jsx      # Per-country copy display + edit
│   ├── EditorViews.jsx      # 7 timeline bubble views (Initial, Result, Strategic, Generation, CopyResults, Review, ReviewResults)
│   ├── MessageMatrixUpload.jsx  # Excel upload + sheet parser
│   ├── MessageMatrixEditor.jsx  # Inline matrix editor
│   └── MessageMatrixPreviewModal.jsx
├── features/
│   ├── case/api.ts          # useDashboard, useCampaign, useSaveCampaign, useDeleteCampaign
│   ├── skill-registry/api.ts # useSkills, useSkillCatalog, usePersonas, useCultureProfiles
│   ├── skill-authoring/api.ts # useGenerateSkillDraft, useSaveSkill
│   └── approval/api.ts      # useApprove
├── shared/
│   ├── api/
│   │   ├── client.ts        # Fetch wrapper + SSE reader
│   │   └── types.ts         # 15+ TypeScript interfaces
│   ├── state/
│   │   ├── ui-store.ts      # Zustand: sidebar, toasts, SSE status, locale
│   │   └── event-bridge.tsx  # Health polling (15s interval)
│   ├── i18n/
│   │   ├── locales.ts       # 160+ translation keys (EN/KO/DE)
│   │   └── useTranslation.ts # useT() hook
│   ├── ui/                  # Shared UI components (9 files)
│   │   ├── app-shell.tsx    # Layout: sidebar + topbar + main
│   │   ├── button.tsx, card.tsx, badge.tsx, field.tsx
│   │   ├── markdown.tsx, processing-modal.tsx, table.tsx, toast.tsx
│   └── lib/
│       ├── format.ts        # Date formatting (Korean locale)
│       └── skill-labels.ts  # Skill display labels
├── styles/
│   └── theme.js             # LG brand colors (LG_RED: #A50034)
└── data/
    └── mockData.js          # Development mock data
```

---

## 3. Routing

| Path | Page | Purpose |
|------|------|---------|
| `/` | HomePage | Dashboard stats + campaign list (draft/completed badges) |
| `/about` | LandingPage | Marketing intro, workflow visualization |
| `/new` | NewWorkflowPage | 5-step campaign wizard (create) |
| `/workflows` | WorkflowListPage | All campaigns with status badges |
| `/workflows/:id` | WorkflowDetailPage | Load & resume campaign |
| `/settings` | SettingsPage | Language, Skill Builder, Skill Manager |

---

## 4. State Management

### Zustand UI Store
```typescript
locale: 'en' | 'ko' | 'de'     // persisted to localStorage
sseConnected: boolean            // backend health status
sidebarCollapsed: boolean        // sidebar toggle
toasts: Array<{ id, message, type }>  // notification queue
```

### React Query (Server State)
- `useDashboard()` — campaign list + stats
- `useCampaign(id)` — single campaign data
- `useSkills()` / `useSkillCatalog()` — skill catalog
- `usePersonas()` / `useCultureProfiles()` — AI personas & culture data
- Cache: staleTime 30s, retry 1

### Component-Local State (NewWorkflowPage)
- `step` (1-5), `submittedBrief`, `analysisResult`, `strategicData`
- `copyResults`, `copyCandidates`, `selectedCandidateIdx`
- `reviewResults`, `reviewSummary`, `reviewSkills`
- `savedCampaignId` — tracks auto-saved campaign ID
- `timeline` — right panel action history

---

## 5. Workflow UI (NewWorkflowPage)

### Layout
```
┌─────────────────────────────────────────────┐
│ StepProgressBar (clickable: completed steps) │
├──────────────────┬──────────────────────────┤
│   Left Panel     │    Right Panel           │
│   (resizable)    │    (timeline + chat)     │
│                  │                          │
│ Step 1: Brief    │ Initial greeting         │
│ Step 2: Report   │ Workflow guide           │
│ Step 3: Strategic│ Status bubbles           │
│ Step 4: Copies   │ Generation config        │
│                  │ Copy results             │
│                  │ Review settings          │
│                  │ Review results           │
│                  │ Chat input               │
└──────────────────┴──────────────────────────┘
```

### Step Progression
| Step | Left Panel | Right Panel | Auto-save |
|------|-----------|-------------|-----------|
| 1 Research | Brief form + Matrix upload | Greeting + Workflow guide | — |
| 2 Analysis | Analysis Report (collapsible) | Status: "Report generated" | autoSave(2) |
| 3 Strategic | Strategic Message (collapsible) | Status: "Message extracted" | autoSave(3) |
| 4 Generation | Copy Results (collapsible) | Generation Config → Copy results | autoSave(4) |
| 5 Review | (all collapsed) | Review settings → Review results | autoSave(5) |

### Auto-Save
- Uses `useRef` for latest state access (avoids stale closure)
- Saves to `POST /api/v1/campaigns/save` (new) or `PUT /api/v1/campaigns/{id}` (update)
- Passes `currentStep` for resume capability
- Status: `draft` (steps 1-4) or `completed` (step 5 with review)

### Step Click Navigation
- Completed/active steps in StepProgressBar are clickable
- Clicking a step expands its left panel section and collapses others
- Scrolls left panel to top

### Collapsing Behavior
- Each step transition collapses all previous sections
- User can manually expand any section by clicking its header

---

## 6. Key Components

### GenerationConfig.jsx
- **Countries**: 20 countries with flags (US, DE, GB, FR, IT, ES, JP, CN, IN, BR, KR, AU, ID, TH, SA, NL, SE, PL, MX, CA)
- **Age Groups**: 5 ranges (18-24 through 55+)
- **Target Personas**: 5 consumer types (Tech Enthusiast, Premium Lifestyle, etc.)
- **AI Writer Personas**: 10 writers loaded from `/api/v1/personas` (avatar emoji mapping for SKILL.md keywords)
- **Persona Mode Toggle**: ON → parallel generation per writer, OFF → standard single generation

### EditorViews.jsx (7 view components)
- `InitialView` — Greeting + workflow guide (i18n)
- `ResultView` — Analysis report display + approve/modify
- `StrategicMessageView` — Strategic message + approve/modify
- `GenerationConfigView` — Config form wrapper (passes aiPersonas)
- `CopyResultsView` — Persona candidate tabs + skill reviews + copy display
- `ReviewView` — Copy selection + skill toggles (61 skills with type/category badges)
- `ReviewResultsView` — Score tree: country → copy → skill (strengths/weaknesses/improvements)

### BriefingForm.jsx
- 9 sections with i18n placeholders
- AI auto-generate button (fills remaining 9 fields from Project Name + Context)
- Context guide tooltips per section

---

## 7. Internationalization (i18n)

### Setup
- 160+ translation keys in `locales.ts` (EN/KO/DE)
- `useT()` hook: `const t = useT(); t('nav.home')` → "Home" / "홈" / "Startseite"
- Template params: `t('gen.generateWithWriters', { n: 3 })` → "Generate with 3 Writers"
- Locale persisted in `localStorage`

### Coverage
| Area | i18n Applied |
|------|-------------|
| App Shell | Navigation, settings menu, SSE status, topbar title |
| Settings | Tab labels, language selector, skill builder labels |
| Generation Config | Section titles, buttons, validation messages, persona mode |
| Review | Settings labels, skill count, submit button |
| Copy Results | Completion message, candidate tabs, skill reviews |
| Briefing Form | Placeholders, guide button, AI generate button/alerts |
| Matrix Upload | Upload instructions, sheet selection, status messages |
| Chat | Placeholders per step (5 steps) |
| Workflow Steps | Step names, descriptions, status messages |
| Buttons | Save, Cancel, Edit, Delete, Approve, Modify |

---

## 8. Type Definitions (types.ts)

| Type | Key Fields |
|------|-----------|
| CampaignBrief | projectName, projectContext, 3 objectives, audience, keyMessage, ... |
| AnalysisReport | briefSummary, persona, brandFit, marketAnalysis, ... (10 fields) |
| StrategicMessageData | coreMessage, messagePillars[], emotionalHook, toneDirection, keyPhrases[] |
| CopyResult | countryCode, copies[{headline, subheadline, bodyCopy, cta, methodology?, culturalNotes?, toneAnalysis?}] |
| ReviewResult | skillId, skillType, targetCopyKey, score, passed, strengths[], weaknesses[], improvements[] |
| Skill | id, type ('builtin'/'custom'/'skillmd'), category, action_tags[], risk_level |
| AIPersona | id, name, avatar, color, tags[], temperature |
| CultureProfile | id, description, country_code |
| CopyCandidate | persona_id, persona_name, persona_avatar, copies[], selected_skills[], skill_reviews{} |
| CampaignListItem | id, title, status ('draft'/'completed'), currentStep, countries[], totalCopies |
