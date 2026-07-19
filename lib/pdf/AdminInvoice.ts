import { defaultStyles, getCompanyHeader, getFooter, defaultPdfConfig } from './shared';
import { formatDate, getDurationString, formatCurrency, formatShortDate } from './helpers';

export function generateAdminInvoice(order: any): any {
  return {
    ...defaultPdfConfig,
    pageMargins: [40, 40, 40, 40],
    styles: defaultStyles,
    footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount),
    content: [
      getCompanyHeader(),
      {
        stack: [
          { text: 'ERP RENTAL RECORD (MASTER)', style: 'header', alignment: 'center' },
          { text: `Record ID: ERP-${new Date().getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`, style: 'normal', alignment: 'center' },
          { text: `Generated On: ${formatDate(new Date())}`, style: 'small', alignment: 'center', margin: [0, 5, 0, 20] },
        ],
      },
      {
        columns: [
          {
            stack: [
              { text: 'System Audit', style: 'subheader' },
              { text: `Order ID: ${order.id}`, style: 'small' },
              { text: `Created At: ${formatDate(order.createdAt)}`, style: 'small' },
              { text: `Updated At: ${formatDate(order.updatedAt)}`, style: 'small' },
              { text: `Current State: ${order.state.toUpperCase()}`, style: 'normal', bold: true, margin: [0, 5, 0, 0] },
            ],
          },
          {
            stack: [
              { text: 'Customer Information', style: 'subheader' },
              { text: `ID: ${order.customerId}`, style: 'small' },
              { text: `Name: ${order.customer.name}`, style: 'normal', bold: true },
              { text: `Email: ${order.customer.email}`, style: 'normal' },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: 'Product & Inventory Snapshot', style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Product', style: 'tableHeader' },
              { text: 'SKU / Barcode', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader', alignment: 'center' },
              { text: 'Total Stock', style: 'tableHeader', alignment: 'center' },
              { text: 'Status', style: 'tableHeader' },
            ],
            [
              { text: order.product.name, style: 'tableCell' },
              { text: `${order.product.sku || 'N/A'}\n${order.product.barcode || 'N/A'}`, style: 'small' },
              { text: order.quantity.toString(), style: 'tableCell', alignment: 'center' },
              { text: order.product.stockQty.toString(), style: 'tableCell', alignment: 'center' },
              { text: order.product.isActive ? 'Active' : 'Archived', style: 'tableCell' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
      { text: 'Rental Timeline', style: 'subheader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [{ text: 'Start Date (Requested Pickup)', style: 'tableHeader' }, { text: 'End Date (Expected Return)', style: 'tableHeader' }],
            [{ text: formatDate(order.startDate), style: 'tableCell' }, { text: formatDate(order.endDate), style: 'tableCell' }],
            [{ text: 'Calculated Duration', style: 'tableHeader' }, { text: getDurationString(order.startDate, order.endDate), style: 'tableCell' }],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Financial Breakdown', style: 'subheader' },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Base Rental Amount', style: 'normal' }, { text: formatCurrency(order.totalAmount), alignment: 'right', style: 'normal' }],
                    [{ text: 'Required Deposit', style: 'normal' }, { text: formatCurrency(order.depositAmount), alignment: 'right', style: 'normal' }],
                    [{ text: 'Assessed Penalties', style: 'normal' }, { text: formatCurrency(order.penaltyAmount), alignment: 'right', style: 'normal' }],
                    [{ text: 'Deposit Refunded', style: 'normal' }, { text: formatCurrency(order.depositRefunded), alignment: 'right', style: 'normal' }],
                    [{ text: 'Total Customer Paid', style: 'totalRow', margin: [0, 5, 0, 0] }, { text: formatCurrency(order.totalAmount + order.depositAmount), alignment: 'right', style: 'totalRow', margin: [0, 5, 0, 0] }],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Payment Log', style: 'subheader', margin: [20, 0, 0, 5] },
              {
                table: {
                  headerRows: 1,
                  widths: ['auto', '*', 'auto'],
                  body: [
                    [{ text: 'Date', style: 'tableHeader' }, { text: 'Method', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader', alignment: 'right' }],
                    ...(order.payments.length > 0 ? order.payments.map((p: any) => [
                      { text: formatShortDate(p.paidAt), style: 'small' },
                      { text: `${p.method} (${p.status})`, style: 'small' },
                      { text: formatCurrency(p.amount), style: 'small', alignment: 'right' },
                    ]) : [[{ text: 'No payments', colSpan: 3, alignment: 'center', style: 'small' }, {}, {}]]),
                  ],
                },
                layout: 'lightHorizontalLines',
                margin: [20, 0, 0, 0],
              },
            ],
          },
        ],
      },
    ],
  };
}
