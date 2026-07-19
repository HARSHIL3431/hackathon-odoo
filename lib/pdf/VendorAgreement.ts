import { defaultStyles, getCompanyHeader, getFooter, getTermsAndConditions, getSignatureBlock, defaultPdfConfig } from './shared';
import { formatDate, getDurationString, formatCurrency } from './helpers';

export function generateVendorAgreement(order: any): any {
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
              { text: 'RENTAL HANDOVER AGREEMENT', style: 'header' },
              { text: `Booking No: RA-${new Date().getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`, style: 'normal' },
              { text: `Status: ${order.state.toUpperCase()}`, style: 'normal' },
            ],
          },
          {
            stack: [
              { text: 'Customer Details:', style: 'subheader', margin: [0, 0, 0, 5] },
              { text: order.customer.name, style: 'normal', bold: true },
              { text: `Email: ${order.customer.email}`, style: 'normal' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: 'Equipment Details', style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Equipment', style: 'tableHeader' },
              { text: 'Quantity', style: 'tableHeader', alignment: 'center' },
              { text: 'Pickup Time', style: 'tableHeader' },
              { text: 'Expected Return', style: 'tableHeader' },
            ],
            [
              { text: order.product.name, style: 'tableCell' },
              { text: order.quantity.toString(), style: 'tableCell', alignment: 'center' },
              { text: formatDate(order.startDate), style: 'tableCell' },
              { text: formatDate(order.endDate), style: 'tableCell' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Handover Checklist', style: 'subheader' },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    [{ text: '[  ]', style: 'normal' }, { text: 'Identity Verified (Govt ID)', style: 'normal' }],
                    [{ text: '[  ]', style: 'normal' }, { text: `Security Deposit Collected (${formatCurrency(order.depositAmount)})`, style: 'normal' }],
                    [{ text: '[  ]', style: 'normal' }, { text: 'Equipment powered on and tested', style: 'normal' }],
                    [{ text: '[  ]', style: 'normal' }, { text: 'Accessories handed over (chargers, cases, etc.)', style: 'normal' }],
                    [{ text: '[  ]', style: 'normal' }, { text: 'Safety instructions provided', style: 'normal' }],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'Condition / Damage Notes', style: 'subheader' },
              {
                table: {
                  widths: ['*'],
                  body: [
                    [{ text: 'Pre-existing damage / notes:\n\n\n\n\n\n', style: 'normal', margin: [5, 5, 5, 5] }],
                  ],
                },
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },
      getTermsAndConditions('agreement'),
      getSignatureBlock(),
    ],
  };
}
