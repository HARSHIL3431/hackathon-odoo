import { format, differenceInHours } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function formatShortDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function getDurationString(start: Date | string, end: Date | string): string {
  const hours = differenceInHours(new Date(end), new Date(start));
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  const parts = [];
  if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : '0 Hours';
}

export function generateFileName(type: 'customer' | 'vendor' | 'admin', orderId: string): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const year = new Date().getFullYear();
  
  if (type === 'customer') {
    return `INV-${year}-${shortId}.pdf`;
  } else if (type === 'vendor') {
    return `RA-${year}-${shortId}.pdf`;
  } else {
    return `ERP-${year}-${shortId}.pdf`;
  }
}

export function buildTable(data: any[][], widths: string[]) {
  return {
    table: {
      headerRows: 1,
      widths: widths,
      body: data,
    },
    layout: 'lightHorizontalLines',
  };
}
