export const COLORS = {
  primary: '#0f172a',
  secondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  error: '#dc2626',
  white: '#ffffff',
  background: '#f8fafc',
};

export const defaultStyles = {
  header: {
    fontSize: 24,
    bold: true,
    color: COLORS.primary,
    margin: [0, 0, 0, 10],
  },
  subheader: {
    fontSize: 16,
    bold: true,
    color: COLORS.primary,
    margin: [0, 15, 0, 5],
  },
  normal: {
    fontSize: 10,
    color: COLORS.primary,
  },
  muted: {
    fontSize: 10,
    color: COLORS.secondary,
  },
  small: {
    fontSize: 8,
    color: COLORS.secondary,
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: COLORS.primary,
    fillColor: COLORS.background,
  },
  tableCell: {
    fontSize: 10,
    margin: [0, 5, 0, 5],
  },
  totalRow: {
    bold: true,
    fontSize: 12,
    color: COLORS.primary,
  },
};

export const defaultPdfConfig = {
  defaultStyle: {
    font: 'Roboto'
  }
};

export function getCompanyHeader() {
  return {
    columns: [
      {
        stack: [
          { text: 'Rental ERP', style: 'header' },
          { text: '123 Equipment Ave, Industrial Park', style: 'muted' },
          { text: 'Mumbai, Maharashtra 400001', style: 'muted' },
          { text: 'Phone: +91 98765 43210 | Email: support@rentalerp.com', style: 'muted' },
        ],
        width: '*',
      },
    ],
    margin: [0, 0, 0, 20],
  };
}

export function getFooter(currentPage: number, pageCount: number) {
  return {
    columns: [
      {
        text: 'Rental ERP Document System',
        style: 'small',
        alignment: 'left',
        margin: [40, 10, 0, 0],
      },
      {
        text: `Page ${currentPage} of ${pageCount}`,
        style: 'small',
        alignment: 'right',
        margin: [0, 10, 40, 0],
      },
    ],
  };
}

export function getTermsAndConditions(type: 'invoice' | 'agreement') {
  if (type === 'invoice') {
    return {
      stack: [
        { text: 'Terms & Conditions', style: 'subheader' },
        {
          text: '1. All rentals are subject to the signed Rental Agreement.\n2. Late fees are applied daily as per the product policy.\n3. The deposit will be refunded within 5-7 business days after successful equipment return and inspection.\n4. Any damage beyond normal wear and tear will be deducted from the deposit.',
          style: 'small',
        },
      ],
      margin: [0, 20, 0, 0],
    };
  } else {
    return {
      stack: [
        { text: 'Rental Handover Terms', style: 'subheader' },
        {
          text: '1. The customer confirms that the equipment has been received in the condition documented above.\n2. The customer assumes full responsibility for the equipment during the rental period.\n3. The vendor confirms the deposit has been collected and equipment is functional.\n4. Both parties agree to the documented late fee and damage policies.',
          style: 'small',
        },
      ],
      margin: [0, 20, 0, 0],
    };
  }
}

export function getSignatureBlock() {
  return {
    columns: [
      {
        stack: [
          { text: '__________________________', margin: [0, 40, 0, 5] },
          { text: 'Customer Signature', style: 'muted' },
          { text: 'Date: ____________', style: 'small', margin: [0, 5, 0, 0] },
        ],
      },
      {
        stack: [
          { text: '__________________________', margin: [0, 40, 0, 5] },
          { text: 'Vendor Signature', style: 'muted' },
          { text: 'Date: ____________', style: 'small', margin: [0, 5, 0, 0] },
        ],
        alignment: 'right',
      },
    ],
    margin: [0, 30, 0, 0],
  };
}
