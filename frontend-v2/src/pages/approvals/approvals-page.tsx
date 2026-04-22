import { useTranslation } from 'react-i18next'

import { PendingApprovals } from '@/features/approval'

export function ApprovalsPage() {
  const { t } = useTranslation()
  return (
    <>
      <div>
        <h2 className="page-title">{t('page:approvals.title')}</h2>
        <p className="page-subtitle">{t('page:approvals.subtitle')}</p>
      </div>
      <PendingApprovals titleKey="approval:pending" />
    </>
  )
}
