import api from '@/lib/api';

const ENDPOINT = '/admin/doctors/reports/generate';

/**
 * Preview a doctor report (returns JSON data for display before export).
 * @param {Object} params
 * @param {number} params.doctor_id
 * @param {'full'|'custom'} params.report_type
 * @param {string[]} [params.sections]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 */
export async function previewDoctorReport(params) {
  const response = await api.post(ENDPOINT, { ...params, format: 'json' });
  return response.data;
}

/**
 * Generate and download a doctor report as PDF or Excel.
 * Returns a Blob that the caller should trigger as a download.
 * @param {Object} params
 * @param {'pdf'|'excel'} params.format
 */
export async function generateDoctorReport(params) {
  const response = await api.post(ENDPOINT, params, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'] ?? '';
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = filenameMatch
    ? filenameMatch[1].replace(/['"]/g, '')
    : `doctor-report.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`;

  return { blob: response.data, filename };
}

const SHOP_ENDPOINT = '/admin/shops/reports/generate';

/**
 * Preview a shop report (returns JSON data for display before export).
 * @param {Object} params
 * @param {number} params.shop_id
 * @param {'full'|'custom'} params.report_type
 * @param {string[]} [params.sections]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 */
export async function previewShopReport(params) {
  const response = await api.post(SHOP_ENDPOINT, { ...params, format: 'json' });
  return response.data;
}

/**
 * Generate and download a shop report as PDF or Excel.
 * @param {Object} params
 * @param {'pdf'|'excel'} params.format
 */
export async function generateShopReport(params) {
  const response = await api.post(SHOP_ENDPOINT, params, { responseType: 'blob' });

  const contentDisposition = response.headers['content-disposition'] ?? '';
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = filenameMatch
    ? filenameMatch[1].replace(/['"]/g, '')
    : `shop-report.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`;

  return { blob: response.data, filename };
}
