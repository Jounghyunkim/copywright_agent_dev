import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Layers, Edit3 } from 'lucide-react';
import { COLORS } from '../styles/theme';

/**
 * MessageMatrixEditor
 *
 * props:
 *   matrixData: { [sheetName]: ProductInfo }  — parse 결과
 *   onChange:   (updatedData) => void          — 편집 시 콜백
 */
const MessageMatrixEditor = ({ matrixData, onChange }) => {
  const [expandedSheets, setExpandedSheets] = useState(() => new Set(Object.keys(matrixData)));
  const [expandedCats, setExpandedCats] = useState(() => {
    // 첫 시트의 첫 카테고리만 펼침
    const init = new Set();
    const firstSheet = Object.keys(matrixData)[0];
    if (firstSheet && matrixData[firstSheet]?.categories?.[0]) {
      init.add(`${firstSheet}-0`);
    }
    return init;
  });

  const toggle = (set, setter, key) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── 수정 핸들러 ──
  const updateProduct = (sheetName, field, value) => {
    const next = { ...matrixData };
    next[sheetName] = { ...next[sheetName], [field]: value };
    onChange(next);
  };

  const updateUSP = (sheetName, catIdx, uspIdx, field, value) => {
    const next = JSON.parse(JSON.stringify(matrixData));
    next[sheetName].categories[catIdx].usps[uspIdx][field] = value;
    onChange(next);
  };

  // ── Styles ──
  const sectionHeader = (expanded) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
    borderRadius: 8, background: expanded ? '#FFF5F7' : '#FAFAFA',
    border: `1px solid ${expanded ? COLORS.LG_RED + '33' : COLORS.BORDER}`,
    transition: 'all 0.15s',
  });

  const cellInput = {
    width: '100%', border: 'none', background: 'transparent',
    fontSize: 12, color: COLORS.TEXT_MAIN, padding: '4px 0',
    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
  };

  const thStyle = {
    padding: '8px 10px', fontSize: 11, fontWeight: 600,
    color: COLORS.TEXT_SUB, textAlign: 'left',
    borderBottom: `2px solid ${COLORS.BORDER}`,
    background: '#F9FAFB', whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '10px 10px', fontSize: 12, borderBottom: `1px solid ${COLORS.BORDER}`,
    verticalAlign: 'top',
  };

  const sheetNames = Object.keys(matrixData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sheetNames.map((sheetName) => {
        const product = matrixData[sheetName];
        const sheetExpanded = expandedSheets.has(sheetName);

        return (
          <div key={sheetName} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.BORDER}` }}>
            {/* 시트 헤더 */}
            <div
              style={sectionHeader(sheetExpanded)}
              onClick={() => toggle(expandedSheets, setExpandedSheets, sheetName)}
            >
              {sheetExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Package size={16} color={COLORS.LG_RED} />
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.TEXT_MAIN }}>{sheetName}</span>
              <span style={{ fontSize: 12, color: COLORS.TEXT_SUB, marginLeft: 'auto' }}>
                {product.categories?.length || 0} categories · {
                  product.categories?.reduce((sum, c) => sum + (c.usps?.length || 0), 0) || 0
                } USPs
              </span>
            </div>

            {sheetExpanded && (
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 제품 정보 */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px',
                  padding: 12, borderRadius: 8, background: '#F9FAFB', fontSize: 13,
                }}>
                  {[
                    ['Product Name', 'product_name'],
                    ['Sub Name', 'sub_name'],
                    ['Head Message', 'head_message'],
                    ['Description', 'description'],
                  ].map(([label, field]) => (
                    <React.Fragment key={field}>
                      <span style={{ fontWeight: 600, color: COLORS.TEXT_SUB, fontSize: 12 }}>{label}</span>
                      <input
                        style={{ ...cellInput, fontSize: 13, borderBottom: `1px solid ${COLORS.BORDER}`, padding: '2px 4px' }}
                        value={product[field] || ''}
                        onChange={(e) => updateProduct(sheetName, field, e.target.value)}
                      />
                    </React.Fragment>
                  ))}
                </div>

                {/* 카테고리별 USP */}
                {product.categories?.map((cat, catIdx) => {
                  const catKey = `${sheetName}-${catIdx}`;
                  const catExpanded = expandedCats.has(catKey);

                  return (
                    <div key={catKey}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 10px', cursor: 'pointer', userSelect: 'none',
                          borderRadius: 6, background: catExpanded ? '#F0F4FF' : '#FAFAFA',
                          border: `1px solid ${catExpanded ? '#93C5FD' : COLORS.BORDER}`,
                        }}
                        onClick={() => toggle(expandedCats, setExpandedCats, catKey)}
                      >
                        {catExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Layers size={14} color="#2563EB" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          Category {cat.number}: {cat.name}
                        </span>
                        <span style={{ fontSize: 11, color: COLORS.TEXT_SUB, marginLeft: 'auto' }}>
                          {cat.usps?.length || 0} USPs
                        </span>
                      </div>

                      {catExpanded && (
                        <div style={{ overflowX: 'auto', marginTop: 6 }}>
                          {cat.key_message && (
                            <div style={{ fontSize: 12, color: COLORS.TEXT_SUB, padding: '4px 10px', fontStyle: 'italic', marginBottom: 6 }}>
                              {cat.key_message}
                            </div>
                          )}
                          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                              <tr>
                                <th style={{ ...thStyle, width: 50 }}>USP #</th>
                                <th style={{ ...thStyle, width: '14%' }}>Feature Name</th>
                                <th style={{ ...thStyle, width: '20%' }}>Key Message (Full)</th>
                                <th style={{ ...thStyle, width: '16%' }}>Key Message (Short)</th>
                                <th style={{ ...thStyle, width: '22%' }}>Benefit Description</th>
                                <th style={{ ...thStyle, width: '22%' }}>RTB</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.usps?.map((usp, uspIdx) => (
                                <tr key={uspIdx} style={{ background: uspIdx % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                                  <td style={tdStyle}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.LG_RED }}>{usp.usp_no}</span>
                                  </td>
                                  {['feature_name', 'key_message_full', 'key_message_short', 'benefit_description', 'rtb'].map((field) => (
                                    <td key={field} style={tdStyle}>
                                      <textarea
                                        style={{ ...cellInput, minHeight: field === 'rtb' ? 180 : 110 }}
                                        value={usp[field] || ''}
                                        onChange={(e) => updateUSP(sheetName, catIdx, uspIdx, field, e.target.value)}
                                        rows={field === 'rtb' ? 9 : 6}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageMatrixEditor;
