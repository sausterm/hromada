import { NextRequest, NextResponse } from 'next/server'
import { generateTaxReceipt, generateReceiptNumber } from '@/lib/tax-receipt'

/**
 * GET /api/admin/test-receipt — Generates a sample tax receipt PDF.
 * Temporary endpoint for review. Delete after use.
 */
export async function GET(request: NextRequest) {
  const donationId = 'clxyz12345abcdef'
  const receivedAt = new Date('2026-02-28')

  const data = {
    receiptNumber: generateReceiptNumber(donationId, receivedAt),
    donorName: 'Thomas Protzman',
    donorOrganization: 'Hromada',
    donorEmail: 'thomasprotzman@proton.me',
    amount: 56000,
    paymentMethod: 'WIRE',
    referenceNumber: 'HRO-2026-0001',
    projectName: 'Horenka Central Hospital Heat Pump & Solar Array',
    receivedAt,
    donationId,
  }

  try {
    const pdfBuffer = await generateTaxReceipt(data)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tax-receipt-${data.receiptNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Tax receipt generation failed:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
