import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'

// Register Inter font from Google Fonts static files
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 700 },
  ],
})

Font.register({
  family: 'Outfit',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a0Ew.ttf', fontWeight: 600 },
  ],
})

const C = {
  navy: '#1a2744',
  cream: '#F5F1E8',
  creamDark: '#E0D7C9',
  blue: '#0057B8',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: C.text,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: C.white,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: C.blue,
    paddingBottom: 20,
  },
  brandName: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 600,
    color: C.navy,
    letterSpacing: -0.5,
  },
  orgLine: {
    fontSize: 9,
    color: C.textLight,
    marginTop: 4,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 600,
    color: C.navy,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: 600,
    color: C.navy,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: 600,
    color: C.navy,
    fontSize: 10,
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: C.text,
  },
  amountBox: {
    backgroundColor: C.cream,
    padding: 16,
    borderRadius: 6,
    marginVertical: 16,
    alignItems: 'center' as const,
  },
  amountLabel: {
    fontSize: 9,
    color: C.textLight,
    marginBottom: 4,
  },
  amountValue: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 600,
    color: C.navy,
  },
  irsBox: {
    backgroundColor: C.cream,
    padding: 16,
    borderRadius: 6,
    marginTop: 24,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
  },
  irsText: {
    fontSize: 9,
    color: C.textLight,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: C.creamDark,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: C.textMuted,
  },
})

export interface TaxReceiptData {
  receiptNumber: string
  donorName: string
  donorOrganization?: string
  donorEmail: string
  amount: number
  paymentMethod: string
  referenceNumber?: string
  projectName: string
  receivedAt: Date
  donationId: string
}

const PAYMENT_LABELS: Record<string, string> = {
  WIRE: 'Wire Transfer',
  DAF: 'DAF Grant',
  CHECK: 'Check',
  ACH: 'ACH Transfer',
  OTHER: 'Other',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function createTaxReceiptDocument(data: TaxReceiptData) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.brandName }, 'hromada'),
        React.createElement(
          Text,
          { style: styles.orgLine },
          'A project of POCACITO Network \u2022 501(c)(3) \u2022 EIN 99-0392258 \u2022 Charlottesville, VA'
        ),
        React.createElement(
          Text,
          { style: styles.title },
          'Tax-Deductible Donation Receipt'
        )
      ),
      // Receipt number and date
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Receipt Number:'),
          React.createElement(Text, { style: styles.value }, data.receiptNumber)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Date Received:'),
          React.createElement(Text, { style: styles.value }, formatDate(data.receivedAt))
        )
      ),
      // Donor info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Donor Information'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Name:'),
          React.createElement(Text, { style: styles.value }, data.donorName)
        ),
        data.donorOrganization
          ? React.createElement(
              View,
              { style: styles.row },
              React.createElement(Text, { style: styles.label }, 'Organization:'),
              React.createElement(Text, { style: styles.value }, data.donorOrganization)
            )
          : null,
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Email:'),
          React.createElement(Text, { style: styles.value }, data.donorEmail)
        )
      ),
      // Amount box
      React.createElement(
        View,
        { style: styles.amountBox },
        React.createElement(Text, { style: styles.amountLabel }, 'DONATION AMOUNT'),
        React.createElement(Text, { style: styles.amountValue }, formatCurrency(data.amount))
      ),
      // Donation details
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Donation Details'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Project:'),
          React.createElement(Text, { style: styles.value }, data.projectName)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Payment Method:'),
          React.createElement(Text, { style: styles.value }, PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod)
        ),
        data.referenceNumber
          ? React.createElement(
              View,
              { style: styles.row },
              React.createElement(Text, { style: styles.label }, 'Reference Number:'),
              React.createElement(Text, { style: styles.value }, data.referenceNumber)
            )
          : null
      ),
      // IRS compliance language
      React.createElement(
        View,
        { style: styles.irsBox },
        React.createElement(
          Text,
          { style: styles.irsText },
          'No goods or services were provided in exchange for this contribution. POCACITO Network is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code. Your donation is tax-deductible to the extent allowed by law.'
        ),
        React.createElement(
          Text,
          { style: { ...styles.irsText, marginTop: 8, fontWeight: 600 } },
          'EIN: 99-0392258'
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          { style: styles.footerText },
          'POCACITO Network \u2022 Charlottesville, VA \u2022 hromadaproject.org'
        ),
        React.createElement(
          Text,
          { style: styles.footerText },
          `Receipt #${data.receiptNumber}`
        )
      )
    )
  )
}

/**
 * Generate a tax receipt PDF as a Buffer.
 * Uses @react-pdf/renderer — pure JS, no headless browser.
 */
export async function generateTaxReceipt(data: TaxReceiptData): Promise<Buffer> {
  const doc = createTaxReceiptDocument(data)
  const buffer = await renderToBuffer(doc as any)
  return Buffer.from(buffer)
}

/**
 * Generate a receipt number from a donation ID.
 * Format: HR-YYYY-<short_id>
 */
export function generateReceiptNumber(donationId: string, receivedAt: Date): string {
  const year = receivedAt.getFullYear()
  const shortId = donationId.slice(-8).toUpperCase()
  return `HR-${year}-${shortId}`
}
