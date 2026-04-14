import { createBrowserRouter, Outlet } from 'react-router-dom'

import { AppShell } from '@/shared/ui/app-shell'
import { HomePage } from '@/pages/home/home-page'
import { EditorPage } from '@/pages/editor'
import { WorkflowListPage } from '@/pages/workflow/workflow-list-page'
import { SkillsPage } from '@/pages/skills'
import { ApprovalsPage } from '@/pages/approvals'
import { CopyReviewPage } from '@/pages/copy-review'
import { SettingsPage } from '@/pages/settings/settings-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'workflow', element: <EditorPage /> },
      { path: 'copy-review', element: <CopyReviewPage /> },
      { path: 'workflow-list', element: <WorkflowListPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
