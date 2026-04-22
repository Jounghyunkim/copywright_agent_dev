import { useTranslation } from 'react-i18next'

import { Modal } from '@/shared/ui/modal'
import type { BriefSection } from './sections'

export function GuideModal({
  section,
  onClose,
}: {
  section: BriefSection | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Modal
      open={!!section}
      onClose={onClose}
      title={section ? t(section.titleKey) : ''}
      width={560}
    >
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--neutral-700)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}
      >
        {section?.guideKey ? t(section.guideKey) : ''}
      </p>
    </Modal>
  )
}
