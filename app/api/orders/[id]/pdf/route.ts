import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
const pdfMake = require('pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

// Seed the server-side VirtualFS with Roboto fonts from pdfFonts
Object.keys(pdfFonts).forEach(fontFileName => {
  pdfMake.virtualfs.writeFileSync(fontFileName, pdfFonts[fontFileName], 'base64');
});

pdfMake.setFonts({
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
});

import { generateCustomerInvoice } from '@/lib/pdf/CustomerInvoice';
import { generateVendorAgreement } from '@/lib/pdf/VendorAgreement';
import { generateAdminInvoice } from '@/lib/pdf/AdminInvoice';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'customer' | 'vendor' | 'admin';

    if (!['customer', 'vendor', 'admin'].includes(type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role-Based Access Control (RBAC)
    if (type === 'customer') {
      if (session.role !== 'CUSTOMER' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (order.customerId !== session.userId && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 });
      }
    } else if (type === 'vendor') {
      if (session.role !== 'VENDOR' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // VENDOR logic could verify product ownership, but currently any VENDOR accesses their dashboard
    } else if (type === 'admin') {
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let docDefinition;
    let filename = `document-${order.id}.pdf`;

    if (type === 'customer') {
      docDefinition = generateCustomerInvoice(order);
      filename = `INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(0, 4).toUpperCase()}.pdf`;
    } else if (type === 'vendor') {
      docDefinition = generateVendorAgreement(order);
      filename = `AGR-${new Date(order.createdAt).getFullYear()}-${order.id.slice(0, 4).toUpperCase()}.pdf`;
    } else if (type === 'admin') {
      docDefinition = generateAdminInvoice(order);
      filename = `ERP-RECORD-${order.id.toUpperCase()}.pdf`;
    } else {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const doc = pdfMake.createPdf(docDefinition);
    const buffer = await doc.getBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
