import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/shared/ui/app-shell'
import { HomePage } from '@/pages/home/home-page'
import { LandingPage } from '@/pages/landing/landing-page'
import { NewWorkflowPage } from '@/pages/new-workflow/new-workflow-page'
import { WorkflowListPage } from '@/pages/workflow-list/workflow-list-page'
import { WorkflowDetailPage } from '@/pages/workflow-detail/workflow-detail-page'
import { SettingsPage } from '@/pages/settings/settings-page'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<LandingPage />} />
          <Route path="/new" element={<NewWorkflowPage />} />
          <Route path="/workflows" element={<WorkflowListPage />} />
          <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
