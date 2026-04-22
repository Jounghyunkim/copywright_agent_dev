# 번역 용어집 초안 (Glossary Draft)

다국어 UI 일관성을 위한 핵심 용어 사전. 번역자·검수자는 이 용어집을 **최우선 참조**해야 한다. 자동 번역(LLM) 파이프라인에도 pre-pass로 주입할 기준 파일.

- 대상 언어: `en`(영어) · 확장 대상 `de/fr/es/zh-CN/ar/th`
- 포맷: TSV/CSV 호환 테이블
- 업데이트 주기: Major UI 변경 시마다

---

## 카테고리

1. **브랜드 자산 (번역 금지 — 원문 유지)**
2. **UX 핵심 액션 (버튼·링크)**
3. **UX 상태·메시지**
4. **워크플로우 · 단계 (Steps)**
5. **심각도 라벨 (Severity)**
6. **리뷰 레인 (Lanes)**
7. **카피 구성 요소 (Headline/CTA 등)**
8. **관리자 · 통계 용어**
9. **사용자 역할 · 인증**
10. **톤 & 목소리 (Tone)**

---

## 1. 브랜드 자산 — **번역 금지, 원문 유지**

모든 언어에서 동일하게 영문/고유 이름 그대로 사용. 현지화 시 음역도 금지.

| 한국어 원문 | en | de | fr | es | zh-CN | ar | th | 비고 |
|---|---|---|---|---|---|---|---|---|
| LG | LG | LG | LG | LG | LG | LG | LG | 절대 현지화 금지 |
| LG Electronics | LG Electronics | LG Electronics | LG Electronics | LG Electronics | LG Electronics | LG Electronics | LG Electronics | |
| Life's Good | Life's Good | Life's Good | Life's Good | Life's Good | Life's Good | Life's Good | Life's Good | 글로벌 슬로건 |
| ThinQ | ThinQ | ThinQ | ThinQ | ThinQ | ThinQ | ThinQ | ThinQ | 제품군 이름 |
| OLED | OLED | OLED | OLED | OLED | OLED | OLED | OLED | 기술명 |
| gram | gram | gram | gram | gram | gram | gram | gram | 노트북 라인 |
| DD Motor | DD Motor | DD Motor | DD Motor | DD Motor | DD Motor | DD Motor | DD Motor | 세탁기 기술 |
| Brand Fit | Brand Fit | Brand Fit | Brand Fit | Brand Fit | Brand Fit | Brand Fit | Brand Fit | 내부 지표명 |
| JTBD | JTBD | JTBD | JTBD | JTBD | JTBD | JTBD | JTBD | Jobs-to-be-Done 약어 |

**정책**:
- 브랜드 자산이 들어간 문장 번역 시 해당 토큰만 원문 유지, 나머지는 현지어.
- 예: "LG의 가치" → "LG's values" (de: "LGs Werte") — LG 자체는 금지.

---

## 2. UX 핵심 액션 (버튼·링크) — 공식 번역 확정

모든 페이지에서 동일 라벨로 렌더되어야 하는 액션.

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| 저장 | Save | Speichern | Enregistrer | Guardar | 保存 | حفظ | บันทึก |
| 저장 및 종료 | Save & Exit | Speichern & Beenden | Enregistrer et quitter | Guardar y salir | 保存并退出 | حفظ وخروج | บันทึกและออก |
| 업데이트 | Update | Aktualisieren | Mettre à jour | Actualizar | 更新 | تحديث | อัปเดต |
| 삭제 | Delete | Löschen | Supprimer | Eliminar | 删除 | حذف | ลบ |
| 제거 | Remove | Entfernen | Retirer | Quitar | 移除 | إزالة | เอาออก |
| 추가 | Add | Hinzufügen | Ajouter | Añadir | 添加 | إضافة | เพิ่ม |
| 확인 | Confirm | Bestätigen | Confirmer | Confirmar | 确认 | تأكيد | ยืนยัน |
| 취소 | Cancel | Abbrechen | Annuler | Cancelar | 取消 | إلغاء | ยกเลิก |
| 닫기 | Close | Schließen | Fermer | Cerrar | 关闭 | إغلاق | ปิด |
| 다시 시도 | Retry | Erneut versuchen | Réessayer | Reintentar | 重试 | إعادة المحاولة | ลองอีกครั้ง |
| 초기화 | Reset | Zurücksetzen | Réinitialiser | Restablecer | 重置 | إعادة تعيين | รีเซ็ต |
| 편집 | Edit | Bearbeiten | Modifier | Editar | 编辑 | تعديل | แก้ไข |
| 상세 | Details | Details | Détails | Detalles | 详情 | التفاصيل | รายละเอียด |
| 로그아웃 | Log out | Abmelden | Déconnexion | Cerrar sesión | 退出登录 | تسجيل الخروج | ออกจากระบบ |
| 로그인 | Sign in | Anmelden | Se connecter | Iniciar sesión | 登录 | تسجيل الدخول | เข้าสู่ระบบ |
| 열기 | Open | Öffnen | Ouvrir | Abrir | 打开 | فتح | เปิด |
| 이전 단계 | Previous step | Vorheriger Schritt | Étape précédente | Paso anterior | 上一步 | الخطوة السابقة | ขั้นตอนก่อนหน้า |
| 다음 단계 | Next step | Nächster Schritt | Étape suivante | Paso siguiente | 下一步 | الخطوة التالية | ขั้นตอนถัดไป |
| 전송 | Send | Senden | Envoyer | Enviar | 发送 | إرسال | ส่ง |
| 업로드 | Upload | Hochladen | Téléverser | Subir | 上传 | رفع | อัปโหลด |
| 전체 선택 | Select all | Alle auswählen | Tout sélectionner | Seleccionar todo | 全选 | تحديد الكل | เลือกทั้งหมด |
| 전체 해제 | Deselect all | Alle abwählen | Tout désélectionner | Deseleccionar todo | 全部取消 | إلغاء تحديد الكل | ยกเลิกทั้งหมด |
| 선택 해제 | Clear | Zurücksetzen | Effacer | Limpiar | 清除 | مسح | ล้าง |
| 전체 보기 | View all | Alle anzeigen | Voir tout | Ver todo | 查看全部 | عرض الكل | ดูทั้งหมด |

---

## 3. UX 상태·메시지

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| 로드 중… | Loading… | Lade… | Chargement… | Cargando… | 加载中… | جارٍ التحميل… | กำลังโหลด… |
| 저장 중… | Saving… | Speichere… | Enregistrement… | Guardando… | 保存中… | جارٍ الحفظ… | กำลังบันทึก… |
| 업로드 중… | Uploading… | Hochladen… | Téléversement… | Subiendo… | 上传中… | جارٍ الرفع… | กำลังอัปโหลด… |
| 검색 중… | Searching… | Suche… | Recherche… | Buscando… | 搜索中… | جارٍ البحث… | กำลังค้นหา… |
| 생성 중… | Generating… | Erstelle… | Génération… | Generando… | 生成中… | جارٍ الإنشاء… | กำลังสร้าง… |
| 완료 | Completed | Abgeschlossen | Terminé | Completado | 已完成 | مكتمل | เสร็จสมบูรณ์ |
| 진행 중 | In progress | In Bearbeitung | En cours | En curso | 进行中 | قيد التنفيذ | กำลังดำเนินการ |
| 실패 | Failed | Fehlgeschlagen | Échoué | Fallido | 失败 | فشل | ล้มเหลว |
| 저장에 실패했습니다. | Save failed. | Speichern fehlgeschlagen. | L'enregistrement a échoué. | Error al guardar. | 保存失败。 | فشل الحفظ. | บันทึกไม่สำเร็จ |
| 삭제에 실패했습니다. | Delete failed. | Löschen fehlgeschlagen. | La suppression a échoué. | Error al eliminar. | 删除失败。 | فشل الحذف. | ลบไม่สำเร็จ |
| 데이터가 없습니다. | No data. | Keine Daten. | Aucune donnée. | Sin datos. | 暂无数据。 | لا توجد بيانات. | ไม่มีข้อมูล |
| 검색 결과가 없습니다. | No results. | Keine Ergebnisse. | Aucun résultat. | Sin resultados. | 无结果 | لا توجد نتائج | ไม่พบผลลัพธ์ |

---

## 4. 워크플로우 단계 (Steps)

워크플로우 steppers / 탭 / 진행 표시에서 **항상 동일한 번역**.

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| 브리핑 | Briefing | Briefing | Briefing | Briefing | 简报 | الإحاطة | การสรุป |
| 분석 | Analysis | Analyse | Analyse | Análisis | 分析 | التحليل | การวิเคราะห์ |
| 전략 메시지 | Strategic Message | Strategische Botschaft | Message stratégique | Mensaje estratégico | 战略信息 | الرسالة الاستراتيجية | ข้อความเชิงกลยุทธ์ |
| 카피 생성 | Copy Generation | Texterstellung | Génération de texte | Generación de copy | 文案生成 | إنشاء النص | สร้างคำโฆษณา |
| 검토 | Review | Review | Révision | Revisión | 审核 | المراجعة | การตรวจสอบ |
| 카피 입력 | Copy Input | Texteingabe | Saisie du texte | Entrada de copy | 文案输入 | إدخال النص | ป้อนคำโฆษณา |
| 카피라이트 생성 | Copy Generation | Copy-Erstellung | Création de copy | Creación de copy | 创建文案 | إنشاء النص | สร้างคำโฆษณา |
| 카피라이트 검토 | Copy Review | Copy-Prüfung | Révision de copy | Revisión de copy | 文案审核 | مراجعة النص | ตรวจสอบคำโฆษณา |
| 카피라이트 목록 | Copy List | Copy-Liste | Liste des copies | Lista de copies | 文案列表 | قائمة النصوص | รายการคำโฆษณา |

---

## 5. 심각도 라벨 (Severity)

리뷰 결과 severity 뱃지·카운트 칩. 3단계 고정.

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| Critical | Critical | Kritisch | Critique | Crítico | 严重 | حرج | วิกฤต |
| Warning | Warning | Warnung | Avertissement | Advertencia | 警告 | تحذير | คำเตือน |
| Suggestion | Suggestion | Vorschlag | Suggestion | Sugerencia | 建议 | اقتراح | ข้อเสนอแนะ |
| Pass | Pass | Bestanden | Réussi | Aprobado | 通过 | نجح | ผ่าน |
| Fail | Fail | Nicht bestanden | Échec | Falló | 未通过 | فشل | ไม่ผ่าน |

**정책**: 영어에서는 대문자 표기 그대로 (`CRITICAL`) — 다른 언어도 뱃지에서는 대문자 표시 유지, 일반 텍스트에서는 첫 글자 대문자.

---

## 6. 리뷰 레인 (Lanes)

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| Risk & Compliance | Risk & Compliance | Risiko & Compliance | Risque & Conformité | Riesgo y Cumplimiento | 风险与合规 | المخاطر والامتثال | ความเสี่ยงและการปฏิบัติตามกฎ |
| Brand Integrity | Brand Integrity | Markenintegrität | Intégrité de la marque | Integridad de marca | 品牌一致性 | سلامة العلامة التجارية | ความสมบูรณ์ของแบรนด์ |
| Craft Quality | Craft Quality | Handwerksqualität | Qualité d'écriture | Calidad de redacción | 工艺品质 | جودة الصياغة | คุณภาพงานเขียน |
| Localization | Localization | Lokalisierung | Localisation | Localización | 本地化 | التوطين | การปรับให้เข้ากับท้องถิ่น |
| Light / Standard / Deep | Light / Standard / Deep | Leicht / Standard / Tief | Léger / Standard / Profond | Ligero / Estándar / Profundo | 轻量/标准/深度 | خفيف / قياسي / عميق | เบา / มาตรฐาน / ลึก |

---

## 7. 카피 구성 요소

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| Headline | Headline | Headline / Überschrift | Accroche | Titular | 主标题 | العنوان الرئيسي | พาดหัว |
| Subheadline | Subheadline | Unterüberschrift | Sous-titre | Subtítulo | 副标题 | العنوان الفرعي | พาดหัวรอง |
| Body Copy | Body Copy | Fließtext | Corps du texte | Cuerpo | 正文 | النص الأساسي | เนื้อหา |
| CTA | CTA (Call to Action) | CTA | CTA | CTA | 行动号召 (CTA) | الدعوة لاتخاذ إجراء | ปุ่มกระตุ้น |
| 변형 | Variant | Variante | Variante | Variante | 变体 | نسخة | รูปแบบ |
| 국가 | Country | Land | Pays | País | 国家 | البلد | ประเทศ |
| 타겟 | Target | Zielgruppe | Cible | Objetivo | 目标 | الهدف | เป้าหมาย |
| 연령대 | Age group | Altersgruppe | Tranche d'âge | Grupo de edad | 年龄段 | الفئة العمرية | กลุ่มอายุ |
| 페르소나 | Persona | Persona | Persona | Persona | 角色 | الشخصية | บุคลิก |

---

## 8. 관리자 · 통계

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| 관리자 설정 | Admin Settings | Admin-Einstellungen | Paramètres admin | Configuración admin | 管理员设置 | إعدادات المشرف | ตั้งค่าผู้ดูแล |
| 일반 설정 | General Settings | Allgemeine Einstellungen | Paramètres généraux | Configuración general | 常规设置 | الإعدادات العامة | ตั้งค่าทั่วไป |
| 사용 통계 | Usage Stats | Nutzungsstatistiken | Statistiques d'utilisation | Estadísticas de uso | 使用统计 | إحصاءات الاستخدام | สถิติการใช้งาน |
| 지식 구축 | Knowledge Base | Wissensdatenbank | Base de connaissances | Base de conocimiento | 知识库 | قاعدة المعرفة | ฐานความรู้ |
| 시스템 상태 | System Status | Systemstatus | État du système | Estado del sistema | 系统状态 | حالة النظام | สถานะระบบ |
| 오늘 DAU | Today's DAU | Heutige DAU | DAU du jour | DAU de hoy | 今日 DAU | DAU اليوم | DAU วันนี้ |
| 이번 달 MAU | This month's MAU | MAU des Monats | MAU du mois | MAU del mes | 本月 MAU | MAU هذا الشهر | MAU เดือนนี้ |
| 누적 사용자 | Total Users | Benutzer insgesamt | Utilisateurs totaux | Usuarios totales | 累计用户 | إجمالي المستخدمين | ผู้ใช้สะสม |
| 누적 로그인 | Total Logins | Anmeldungen gesamt | Connexions totales | Inicios totales | 累计登录 | إجمالي تسجيلات الدخول | เข้าสู่ระบบสะสม |
| 로그인 성공률 | Login Success Rate | Anmelde-Erfolgsquote | Taux de réussite connexion | Tasa de éxito inicio sesión | 登录成功率 | معدل نجاح الدخول | อัตราเข้าสำเร็จ |

---

## 9. 사용자 역할·인증

| 한국어 | en | de | fr | es | zh-CN | ar | th |
|---|---|---|---|---|---|---|---|
| 관리자 | Administrator / Admin | Administrator | Administrateur | Administrador | 管理员 | المسؤول | ผู้ดูแล |
| 사용자 | User | Benutzer | Utilisateur | Usuario | 用户 | مستخدم | ผู้ใช้ |
| 사번(ID) | Employee ID | Mitarbeiter-ID | ID employé | ID de empleado | 员工 ID | رقم الموظف | รหัสพนักงาน |
| 비밀번호 | Password | Passwort | Mot de passe | Contraseña | 密码 | كلمة المرور | รหัสผ่าน |
| 조직 | Department | Abteilung | Département | Departamento | 部门 | القسم | แผนก |
| 승인 | Approve | Genehmigen | Approuver | Aprobar | 批准 | الموافقة | อนุมัติ |
| 승인 대기 | Pending Approval | Ausstehend | En attente d'approbation | Pendiente de aprobación | 待审核 | بانتظار الموافقة | รออนุมัติ |

---

## 10. 톤 & 목소리 (Tone — 개발자 메모)

UI 전체의 **말투 기조**를 언어별로 고정.

| 언어 | 존칭 규약 | 구두점 | 비고 |
|---|---|---|---|
| ko | 해요체 기반, 중요 지시는 합쇼체 ("입력해 주세요") | 마침표 O, 권유형 "~세요" | 현재 소스 기준 |
| en | Sentence case (버튼은 Title Case 가능). Direct but polite ("Enter your password"). | 문장 끝 마침표 O, 버튼 X | — |
| de | Sie-Form 통일 (Du 금지). Nominalisierung 절제 | 마침표 O | 비즈니스 톤 |
| fr | Vous 형태. 동사 직설 현재 | 마침표 O, 공백 규칙(`:`, `?` 앞 NBSP) | 타이포 엄격 |
| es | Usted 형태 중립. 지역(LATAM vs ES) 중립 표현 선호 | ¿ ¡ 역방향 기호 | 이베리아·중남미 공통 |
| zh-CN | 존칭 "您" 사용, 공식 톤. 간결·직접 | 전각 `，。！？` | 간체 전용 |
| ar | 공식 표현 (Modern Standard Arabic). 사용자 = 남성형 기본 (단, 중립 가능시 그쪽) | 아랍어 쉼표 `،`, 물음표 `؟` | RTL + 방언 금지 |
| th | 존칭 "ครับ/ค่ะ" 생략한 중립 공식체. 구어 금지 | 단어 공백 없음, 구두점 최소 | — |

---

## 11. 변환 규칙 (Automation Rules)

### Do-Not-Translate 토큰 (자동 감지)
- `LG`, `ThinQ`, `Life's Good`, `OLED`, `gram`, `DD Motor`, `ICU`, `JSON`, `URL`, `API`, `CSV`, `XLSX`, `JPG`, `PNG`, `ID`, `LDAP`, `DAU`, `MAU`, `CTA`, `KPI`, `B2B`, `B2C`
- 숫자 포맷 (`{{count}}`, `{{step}}` 등 i18next 보간 변수)
- 코드 단위 (`px`, `%`, `ms`, `s`)

### 고정 치환 (브랜드 · 지표)
번역 파이프라인 전처리에서 위 토큰을 `__TOKEN_N__`로 치환 → 번역 → 원상 복구.

### 우선 번역 순서
1. **Critical path (P0)**: 로그인, 홈, 사이드바, 설정 — Phase 1
2. **Core workflow (P1)**: 카피 생성·검토 전체 — Phase 2
3. **Management (P2)**: 관리자·통계·지식 구축 — Phase 3

---

## 12. 파일 포맷·저장 위치

### 작업용 스프레드시트
- `docs/i18n/glossary-master.tsv` (TSV, UTF-8 BOM, 첫 행 헤더)
- 열: `ko`, `en`, `de`, `fr`, `es`, `zh-CN`, `ar`, `th`, `context`, `approved_by`, `notes`

### LLM 번역 파이프라인 입력
- 용어집 먼저 로드 → "이 표에 있는 용어는 반드시 지정된 번역을 사용" 프롬프트
- 없는 용어만 LLM이 자유 번역
- 결과는 현지 법인 검수자가 Suggest 코멘트로 수정 (§검수 프로세스)

---

## 13. 검수 프로세스

1. **초벌**: 본 문서 기준 LLM 번역 (GPT-4/Claude)
2. **1차 검수**: 각 법인 마케터 1명이 CSV/PR 리뷰 (`legal-entity-reviewers.md` 참조)
3. **2차 검수**: 브랜드 자산·법적 문구는 본사 브랜드팀 최종 확인
4. **배포**: `main` 머지 후 localStorage 캐시 무효화

---

## 14. 변경 관리

- **버전**: v0.1 (초안, 2026-04)
- **변경 이력**: git log `docs/i18n/glossary-draft.md`
- **변경 시**: 모든 `public/locales/<lang>/*.json`에 영향 — CI가 diff 리뷰 코멘트 자동 달기
- **금지**: 용어집 없이 즉흥 번역 (법인별 편차 원인)

---

## 15. 현황 체크

- [x] P0 용어 (핵심 액션, 상태, 단계) — **완료**
- [x] Severity, Lane, Copy 요소 — **완료**
- [x] 관리자·통계·인증 핵심 — **완료**
- [ ] 중국어(zh-CN) 네이티브 검수
- [ ] 아랍어(ar) 네이티브 검수 + RTL 테스트
- [ ] 태국어(th) 네이티브 검수
- [ ] 지역 바리에이션(ES-419, FR-CA, zh-TW, en-GB) — 확장 Phase에서 분리
