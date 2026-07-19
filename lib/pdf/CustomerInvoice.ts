import { defaultStyles, getCompanyHeader, getFooter, getTermsAndConditions, defaultPdfConfig } from './shared';
import { formatCurrency, formatShortDate, formatDate, getDurationString } from './helpers';

export function generateCustomerInvoice(order: any): any {
  return {
    ...defaultPdfConfig,
    pageMargins: [40, 40, 40, 40],
    styles: defaultStyles,
    footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount),
    content: [
      getCompanyHeader(),
      {
        columns: [
          {
            stack: [
              { text: 'TAX INVOICE', style: 'header' },
              { text: `Invoice No: INV-${new Date().getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`, style: 'normal' },
              { text: `Date: ${formatShortDate(new Date())}`, style: 'normal' },
              { text: `Order Status: ${order.state.toUpperCase()}`, style: 'normal', margin: [0, 5, 0, 0] },
            ],
          },
          {
            stack: [
              { text: 'Billed To:', style: 'subheader', margin: [0, 0, 0, 5] },
              { text: order.customer.name, style: 'normal', bold: true },
              { text: order.customer.email, style: 'normal' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: 'Rental Details', style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Product', style: 'tableHeader' },
              { text: 'Rental Period', style: 'tableHeader' },
              { text: 'Duration', style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader', alignment: 'right' },
            ],
            [
              { text: `${order.product.name}\nQty: ${order.quantity}`, style: 'tableCell' },
              { text: `${formatDate(order.startDate)}\nto\n${formatDate(order.endDate)}`, style: 'tableCell' },
              { text: getDurationString(order.startDate, order.endDate), style: 'tableCell' },
              { text: formatCurrency(order.totalAmount), style: 'tableCell', alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: '40%',
            table: {
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Rental Fee:', style: 'normal' }, { text: formatCurrency(order.totalAmount), alignment: 'right', style: 'normal' }],
                [{ text: 'Refundable Deposit:', style: 'normal' }, { text: formatCurrency(order.depositAmount), alignment: 'right', style: 'normal' }],
                [{ text: 'Late Penalty (if any):', style: 'normal' }, { text: formatCurrency(order.penaltyAmount), alignment: 'right', style: 'normal' }],
                [{ text: 'Total Paid:', style: 'totalRow', margin: [0, 5, 0, 0] }, { text: formatCurrency(order.totalAmount + order.depositAmount), alignment: 'right', style: 'totalRow', margin: [0, 5, 0, 0] }],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        stack: [
          { text: 'Payment Information', style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', 'auto'],
              body: [
                [
                  { text: 'Method', style: 'tableHeader' },
                  { text: 'Status', style: 'tableHeader' },
                  { text: 'Amount', style: 'tableHeader', alignment: 'right' },
                ],
                ...(order.payments.length > 0 ? order.payments.map((p: any) => [
                  { text: p.method, style: 'tableCell' },
                  { text: p.status.toUpperCase(), style: 'tableCell' },
                  { text: formatCurrency(p.amount), style: 'tableCell', alignment: 'right' },
                ]) : [[{ text: 'No payments found', colSpan: 3, alignment: 'center', style: 'tableCell' }, {}, {}]]),
              ],
            },
            layout: 'lightHorizontalLines',
          },
        ],
      },
      getTermsAndConditions('invoice'),
      { text: 'Thank you for your business!', style: 'subheader', alignment: 'center', margin: [0, 40, 0, 0] },
    ],
  };
}
