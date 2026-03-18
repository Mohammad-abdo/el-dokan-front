/**
 * Report types and column definitions for table exports (Doctors, Shops, Companies, Representatives, Drivers).
 * Used by Admin Reports page for "استخراج تقارير الجداول".
 */

export const TABLE_REPORT_TYPES = [
  { key: 'doctors', api: '/admin/doctors', detailApi: (id) => `/admin/doctors/${id}`, labelAr: 'أطباء', labelEn: 'Doctors' },
  { key: 'shops', api: '/admin/shops', detailApi: (id) => `/admin/shops/${id}`, labelAr: 'متاجر', labelEn: 'Shops' },
  { key: 'companies', api: '/admin/shops', apiParams: { type: 'company' }, detailApi: (id) => `/admin/shops/${id}`, labelAr: 'شركات', labelEn: 'Companies' },
  { key: 'representatives', api: '/admin/representatives', detailApi: (id) => `/admin/representatives/${id}`, labelAr: 'مندوبو مبيعات', labelEn: 'Representatives' },
  { key: 'drivers', api: '/admin/drivers', detailApi: (id) => `/admin/drivers/${id}`, labelAr: 'سائقون', labelEn: 'Drivers' },
];

function col(key, headerEn, headerAr, getExportValue) {
  return { accessorKey: key, header: headerEn, headerAr, getExportValue: getExportValue || ((row) => row[key] ?? '') };
}

export function getReportColumns(reportKey, language) {
  const lang = language || 'en';
  const L = (en, ar) => (lang === 'ar' ? ar : en);

  switch (reportKey) {
    case 'doctors':
      return [
        col('id', 'ID', 'المعرف', (r) => r.id),
        col('name', L('Name', 'الاسم'), L('Name', 'الاسم'), (r) => r.name || r.fullName || r.user?.name || r.user?.username || '-'),
        col('email', L('Email', 'البريد'), L('Email', 'البريد'), (r) => r.email || r.user?.email || '-'),
        col('phone', L('Phone', 'الهاتف'), L('Phone', 'الهاتف'), (r) => r.phone || r.user?.phone || '-'),
        col('specialty', L('Specialty', 'التخصص'), L('Specialty', 'التخصص'), (r) => r.specialty || r.specialization || '-'),
        col('status', L('Status', 'الحالة'), L('Status', 'الحالة'), (r) => r.status || 'active'),
      ];
    case 'shops':
      return [
        col('id', 'ID', 'المعرف', (r) => r.id),
        col('name', L('Name', 'الاسم'), L('Name', 'الاسم'), (r) => r.name),
        col('user', L('User', 'المستخدم'), L('User', 'المستخدم'), (r) => r.user?.username || r.user?.email || '-'),
        col('category', L('Category', 'الفئة'), L('Category', 'الفئة'), (r) => r.category),
        col('phone', L('Phone', 'الهاتف'), L('Phone', 'الهاتف'), (r) => r.phone),
        col('address', L('Address', 'العنوان'), L('Address', 'العنوان'), (r) => r.address),
        col('is_active', L('Status', 'الحالة'), L('Status', 'الحالة'), (r) => r.is_active !== false ? L('Active', 'نشط') : L('Inactive', 'غير نشط')),
        col('vendor_status', L('Vendor', 'حالة البائع'), L('Vendor', 'حالة البائع'), (r) => {
          const labels = { pending_approval: L('Pending', 'قيد المراجعة'), approved: L('Approved', 'مفعّل'), suspended: L('Suspended', 'موقوف'), rejected: L('Rejected', 'مرفوض') };
          return labels[r.vendor_status] || r.vendor_status || 'approved';
        }),
      ];
    case 'companies':
      return [
        col('id', 'ID', 'المعرف', (r) => r.id),
        col('name', L('Name', 'الاسم'), L('Name', 'الاسم'), (r) => r.name),
        col('user', L('User', 'المستخدم'), L('User', 'المستخدم'), (r) => r.user?.username || r.user?.email || '-'),
        col('category', L('Category', 'الفئة'), L('Category', 'الفئة'), (r) => r.category),
        col('phone', L('Phone', 'الهاتف'), L('Phone', 'الهاتف'), (r) => r.phone),
        col('address', L('Address', 'العنوان'), L('Address', 'العنوان'), (r) => r.address),
        col('vendor_status', L('Access status', 'حالة الموافقة'), L('Access status', 'حالة الموافقة'), (r) => {
          const labels = { pending_approval: L('Pending', 'قيد المراجعة'), approved: L('Approved', 'مفعّل'), suspended: L('Suspended', 'موقوف'), rejected: L('Rejected', 'مرفوض') };
          return labels[r.vendor_status] || r.vendor_status || 'approved';
        }),
        col('company_plan', L('Plan', 'الخطة'), L('Plan', 'الخطة'), (r) => r.company_plan?.name_ar || r.company_plan?.name || '—'),
        col('is_active', L('Status', 'الحالة'), L('Status', 'الحالة'), (r) => r.is_active !== false ? L('Active', 'نشط') : L('Inactive', 'غير نشط')),
      ];
    case 'representatives':
      return [
        col('id', 'ID', 'المعرف', (r) => r.id),
        col('user', L('User', 'المستخدم'), L('User', 'المستخدم'), (r) => r.user?.username || r.user?.email || '-'),
        col('territory', L('Territory', 'المنطقة'), L('Territory', 'المنطقة'), (r) => r.territory),
        col('status', L('Status', 'الحالة'), L('Status', 'الحالة'), (r) => {
          const labels = { approved: L('Approved', 'موافق عليه'), suspended: L('Suspended', 'معلق'), pending: L('Pending', 'قيد الانتظار') };
          return labels[r.status] || r.status || 'pending';
        }),
      ];
    case 'drivers':
      return [
        col('id', 'ID', 'المعرف', (r) => r.id),
        col('name', L('Name', 'الاسم'), L('Name', 'الاسم'), (r) => r.name),
        col('phone', L('Phone', 'الهاتف'), L('Phone', 'الهاتف'), (r) => r.phone ?? '-'),
        col('status', L('Status', 'الحالة'), L('Status', 'الحالة'), (r) => {
          const labels = { available: L('Available', 'متاح'), busy: L('Busy', 'مشغول'), offline: L('Offline', 'غير متصل') };
          return labels[r.status] || r.status || '—';
        }),
        col('rating', L('Rating', 'التقييم'), L('Rating', 'التقييم'), (r) => (typeof r.rating === 'number' ? r.rating.toFixed(1) : '0.0')),
        col('location', L('Location', 'الموقع'), L('Location', 'الموقع'), (r) => (r.current_location_lat && r.current_location_lng) ? L('On Map', 'على الخريطة') : L('N/A', 'غير متاح')),
      ];
    default:
      return [];
  }
}

/** Get column header for display (by language) */
export function getColumnHeader(column, language) {
  return language === 'ar' ? (column.headerAr || column.header) : column.header;
}
