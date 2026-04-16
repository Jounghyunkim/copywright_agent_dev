import { createBrowserRouter, Outlet } from 'react-router-dom'

import { AppShell } from '@/shared/ui/app-shell'
import { ProtectedLayout } from '@/app/protected-layout'
import { LoginPage } from '@/pages/login/login-page'
import { HomePage } from '@/pages/home/home-page'
import { EditorPage } from '@/pages/editor'
import { WorkflowListPage } from '@/pages/workflow/workflow-list-page'
import { SkillsPage } from '@/pages/skills'
import { ApprovalsPage } from '@/pages/approvals'
import { CopyReviewPage } from '@/pages/copy-review'
import { SettingsPage } from '@/pages/settings/settings-page'
import { AdminUsersPage } from '@/pages/admin/admin-users-page'
import { StatsPage } from '@/pages/admin/stats-page'

export const router = createBrowserRouter([
  // Public: 로그인 페이지
  { path: '/login', element: <LoginPage /> },

  // Protected: 인증 필수
  {
    element: <ProtectedLayout />,
    children: [
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
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/stats', element: <StatsPage /> },
        ],
      },
    ],
  },
])
