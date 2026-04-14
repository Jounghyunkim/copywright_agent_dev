import { PendingApprovals } from '@/features/approval'

export function ApprovalsPage() {
  return (
    <>
      <div>
        <h2 className="page-title">승인 대기</h2>
        <p className="page-subtitle">
          사용자 확인이 필요한 단계에 멈춰있는 캠페인을 모아 보세요.
        </p>
      </div>
      <PendingApprovals title="승인이 필요한 항목" />
    </>
  )
}
