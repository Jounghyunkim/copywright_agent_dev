import { Modal } from '@/shared/ui/modal'
import type { BriefSection } from './sections'

export function GuideModal({
  section,
  onClose,
}: {
  section: BriefSection | null
  onClose: () => void
}) {
  return (
    <Modal
      open={!!section}
      onClose={onClose}
      title={section?.title ?? ''}
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
        {section?.guide}
      </p>
    </Modal>
  )
}
