import { useParams, useNavigate } from 'react-router-dom'
import { Loader, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useCampaign } from '@/features/case/api'
import { NewWorkflowPage } from '@/pages/new-workflow/new-workflow-page'

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useCampaign(id ?? null)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-muted)' }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)', fontWeight: 600 }}>Failed to load campaign.</p>
        <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/workflows')}>
          Back to list
        </Button>
      </div>
    )
  }

  return <NewWorkflowPage campaignId={id!} campaignData={data} />
}
