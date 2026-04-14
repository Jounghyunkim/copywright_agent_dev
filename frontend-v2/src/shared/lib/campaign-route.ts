import type { CampaignListItem } from '@/shared/api/types'

/**
 * 캠페인 타입에 따라 올바른 페이지 경로를 반환.
 * - "카피라이트 검토" 캠페인 → /copy-review?campaignId=xxx
 * - 그 외 → /workflow?campaignId=xxx
 */
export function campaignRoute(c: CampaignListItem): string {
  if (isCopyReviewCampaign(c)) {
    return `/copy-review?campaignId=${c.id}`
  }
  return `/workflow?campaignId=${c.id}`
}

/**
 * "카피라이트 검토" 전용 캠페인인지 판별.
 * - brandFitScore가 없거나 0 (분석 단계를 거치지 않음)
 * - totalCopies > 0 (카피는 존재)
 * - currentStep >= 4 (카피 입력 이상 단계)
 */
export function isCopyReviewCampaign(c: CampaignListItem): boolean {
  return (
    (!c.brandFitScore || c.brandFitScore === 0) &&
    (c.totalCopies ?? 0) > 0 &&
    c.currentStep >= 4
  )
}
