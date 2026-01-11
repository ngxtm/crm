import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Lead } from './types';

/**
 * Export leads to Excel file
 */
export function exportLeadsToExcel(leads: Lead[], filename: string = 'leads.xlsx') {
  // Prepare data for Excel
  const excelData = leads.map((lead) => ({
    'Mã KH': lead.id,
    'Họ và tên': lead.full_name,
    'Số điện thoại': lead.phone,
    'Email': lead.email || '',
    'Nguồn': lead.lead_sources?.name || '',
    'Loại nguồn': lead.lead_sources?.type || '',
    'Nhãn nguồn': lead.source_label || '',
    'Chiến dịch': lead.campaigns?.name || '',
    'Nhu cầu': lead.demand || '',
    'Trạng thái': lead.status,
    'NV Sale': lead.sales_employees?.full_name || '',
    'Ngày tạo': lead.created_at ? new Date(lead.created_at).toLocaleDateString('vi-VN') : '',
    'Đã chuyển KH': lead.is_converted ? 'Có' : 'Không',
  }));

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(excelData[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...excelData.map((row) => String(row[key as keyof typeof row]).length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  ws['!cols'] = colWidths;

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Download file
  saveAs(blob, filename);
}

/**
 * Parse Excel file to lead data
 */
export async function parseExcelToLeads(file: File): Promise<Partial<Lead>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map to Lead format
        const leads = jsonData.map((row: any) => ({
          full_name: row['Họ và tên'] || row['full_name'] || '',
          phone: row['Số điện thoại'] || row['phone'] || '',
          email: row['Email'] || row['email'] || undefined,
          demand: row['Nhu cầu'] || row['demand'] || undefined,
          source_label: row['Nhãn nguồn'] || row['source_label'] || undefined,
        }));

        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Generate Excel template for lead import
 */
export function downloadLeadTemplate() {
  const template = [
    {
      'Họ và tên': 'Nguyễn Văn A',
      'Số điện thoại': '0901234567',
      'Email': 'example@email.com',
      'Nhu cầu': 'Cần in hộp giấy 1000 cái',
      'Nhãn nguồn': 'Facebook Ads - Chiến dịch Tết 2024',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  // Auto-size columns
  ws['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
  ];

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, 'lead_import_template.xlsx');
}
