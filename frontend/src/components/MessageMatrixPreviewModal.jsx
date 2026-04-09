import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Package, Layers } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { PreviewBody } from './BriefingForm';

/**
 * Research Preview Modal — 탭 기반 (Message Matrix / LG Campaign Research)
 *
 * props:
 *   matrixData:  { [sheetName]: ProductInfo } | null
 *   briefData:   formData object | null
 *   onClose:     () => void
 */
const MessageMatrixPreviewModal = ({ matrixData, briefData, onClose }) => {
  const hasMatrix = matrixData && Object.keys(matrixData).length > 0;
  const hasBrief = briefData && briefData.projectName;
  const tabs = [];
  if (hasMatrix) tabs.push('matrix');
  if (hasBrief) tabs.push('research');
  const [activeTab, setActiveTab] = useState(tabs[0] || 'matrix');

  if (tabs.length === 0) return null;

  const tabStyle = (active) => ({
    padding: '10px 20px',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    borderBottom: active ? `3px solid ${COLORS.LG_RED}` : '3px solid transparent',
    background: 'none',
    color: active ? COLORS.LG_RED : COLORS.TEXT_SUB,
    transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFF', borderRadius: 14, width: '85vw', maxWidth: 1000,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px 0', borderBottom: `1px solid ${COLORS.BORDER}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.TEXT_MAIN }}>
              Research Preview
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={20} color={COLORS.TEXT_SUB} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {hasMatrix && (
              <button style={tabStyle(activeTab === 'matrix')} onClick={() => setActiveTab('matrix')}>
                <FileSpreadsheet size={15} /> Message Matrix
              </button>
            )}
            {hasBrief && (
              <button style={tabStyle(activeTab === 'research')} onClick={() => setActiveTab('research')}>
                <FileText size={15} /> LG Campaign Research
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'matrix' && hasMatrix && <MatrixPreviewContent matrixData={matrixData} />}
          {activeTab === 'research' && hasBrief && (
            <div style={{ maxWidth: 700 }}>
              <PreviewBody formData={briefData} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: `1px solid ${COLORS.BORDER}`,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: COLORS.LG_RED, color: '#FFF',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Message Matrix 탭 컨텐츠 ── */
function MatrixPreviewContent({ matrixData }) {
  const sheetNames = Object.keys(matrixData);

  return sheetNames.map((sheetName) => {
    const product = matrixData[sheetName];
    return (
      <div key={sheetName} style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          paddingBottom: 10, borderBottom: `2px solid ${COLORS.LG_RED}`,
        }}>
          <Package size={18} color={COLORS.LG_RED} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{sheetName}</span>
        </div>

        {/* Product info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <tbody>
            {[
              ['Product Name', `${product.product_name}${product.sub_name ? ' ' + product.sub_name : ''}`],
              ['Head Message', product.head_message],
              ['Description', product.description],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{
                  padding: '8px 12px', fontWeight: 600, fontSize: 13,
                  color: COLORS.TEXT_SUB, width: 150, verticalAlign: 'top',
                  borderBottom: `1px solid ${COLORS.BORDER}`, background: '#F9FAFB',
                }}>{label}</td>
                <td style={{
                  padding: '8px 12px', fontSize: 13, color: COLORS.TEXT_MAIN,
                  borderBottom: `1px solid ${COLORS.BORDER}`,
                }}>{value || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Categories */}
        {product.categories?.map((cat, catIdx) => (
          <div key={catIdx} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 8, padding: '6px 10px',
              background: '#F0F4FF', borderRadius: 6, border: '1px solid #DBEAFE',
            }}>
              <Layers size={14} color="#2563EB" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                Category {cat.number}: {cat.name}
              </span>
            </div>

            {cat.key_message && (
              <div style={{ fontSize: 12, color: COLORS.TEXT_SUB, fontStyle: 'italic', padding: '4px 10px', marginBottom: 8 }}>
                {cat.key_message}
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['USP #', 'Feature Name', 'Key Message (Full)', 'Key Message (Short)', 'Benefit Description'].map((h) => (
                    <th key={h} style={{
                      padding: '8px 10px', fontWeight: 600, fontSize: 11,
                      color: COLORS.TEXT_SUB, textAlign: 'left',
                      borderBottom: `2px solid ${COLORS.BORDER}`, background: '#F9FAFB',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cat.usps?.map((usp, ui) => (
                  <tr key={ui} style={{ background: ui % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.BORDER}`, fontWeight: 600, color: COLORS.LG_RED }}>{usp.usp_no}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.BORDER}` }}>{usp.feature_name}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.BORDER}` }}>{usp.key_message_full}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.BORDER}` }}>{usp.key_message_short}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.BORDER}` }}>{usp.benefit_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cat.usps?.some(u => u.rtb) && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#FFFBEB', borderRadius: 6, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>RTB (Reason to Believe)</div>
                {cat.usps.filter(u => u.rtb).map((usp, ri) => (
                  <div key={ri} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{usp.feature_name}: </span>
                    <span style={{ fontSize: 12, color: COLORS.TEXT_SUB, whiteSpace: 'pre-wrap' }}>{usp.rtb}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  });
}

export default MessageMatrixPreviewModal;
