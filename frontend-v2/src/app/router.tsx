import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { AppShell } from '@/shared/ui/app-shell'
import { ProtectedLayout } from '@/app/protected-layout'
import { SettingsLayout } from '@/app/settings-layout'
import { useAuthStore } from '@/shared/state/auth-store'
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
import { KnowledgePage } from '@/pages/admin/knowledge-page'

/** 관리자 역할 가드 — admin이 아니면 홈으로 리다이렉트 */
function AdminGuard() {
  const user = useAuthStore((s) => s.user)
  if (!user?.roles?.includes('admin')) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

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
          // 설정 섹션: 공통 탭 네비 + Outlet
          {
            element: <SettingsLayout />,
            children: [
              { path: 'settings', element: <SettingsPage /> },
              // 관리자 전용 라우트
              {
                path: 'admin',
                element: <AdminGuard />,
                children: [
                  { path: 'users', element: <AdminUsersPage /> },
                  { path: 'stats', element: <StatsPage /> },
                  { path: 'knowledge', element: <KnowledgePage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
