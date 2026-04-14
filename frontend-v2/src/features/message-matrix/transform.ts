import type { MessageMatrixProduct } from '@/shared/api/types'

export interface BriefSeed {
  projectName: string
  projectContext: string
}

/**
 * 파싱된 Message Matrix 결과(시트별 ProductInfo)에서 첫 시트를 사용하여
 * 브리프의 projectName / projectContext 초기값을 생성한다.
 */
export function matrixToBriefSeed(
  matrix: Record<string, MessageMatrixProduct>,
): BriefSeed | null {
  const firstKey = Object.keys(matrix)[0]
  if (!firstKey) return null
  const product = matrix[firstKey]
  if (!product) return null

  const projectName = [product.product_name, product.sub_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  const parts: string[] = []
  if (product.description) parts.push(product.description)
  if (product.head_message) parts.push(`Head Message: ${product.head_message}`)
  for (const cat of product.categories ?? []) {
    if (cat.name) {
      parts.push(`[${cat.name}] ${cat.key_message ?? ''}`.trim())
    }
    for (const usp of cat.usps ?? []) {
      if (usp.feature_name && usp.benefit_description) {
        parts.push(`  - ${usp.feature_name}: ${usp.benefit_description}`)
      }
    }
  }

  return {
    projectName,
    projectContext: parts.join('\n'),
  }
}

/**
 * 파싱 결과로부터 통계 카운트(시트 수, USP 총합)를 계산.
 */
export function countMatrixStats(
  matrix: Record<string, MessageMatrixProduct>,
): { sheetCount: number; uspCount: number } {
  let usp = 0
  for (const p of Object.values(matrix)) {
    for (const cat of p.categories ?? []) {
      usp += (cat.usps ?? []).length
    }
  }
  return {
    sheetCount: Object.keys(matrix).length,
    uspCount: usp,
  }
}
