import { NextRequest, NextResponse } from 'next/server'
import { verifyPartnerAuth } from '@/lib/auth'
import { uploadDocumentToStaging, buildDocumentKey } from '@/lib/s3'
import { rateLimit } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46] // %PDF

export async function POST(request: NextRequest) {
  // Partner auth required
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 20 document uploads per hour per IP
  const rateLimitResponse = rateLimit(request, { limit: 20, windowSeconds: 3600 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const partnerOrg = formData.get('partnerOrg') as string | null
    const projectName = formData.get('projectName') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!partnerOrg || !projectName) {
      return NextResponse.json(
        { error: 'partnerOrg and projectName are required' },
        { status: 400 }
      )
    }

    // Validate content type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Validate magic bytes (%PDF)
    if (bytes.length < 4 || !PDF_MAGIC_BYTES.every((b, i) => bytes[i] === b)) {
      return NextResponse.json(
        { error: 'File content is not a valid PDF.' },
        { status: 400 }
      )
    }

    const key = buildDocumentKey(partnerOrg, projectName, file.name)
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadDocumentToStaging(key, buffer, 'application/pdf', file.name)
    if (!result) {
      return NextResponse.json(
        { error: 'Document storage is not configured.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { key, filename: file.name, size: file.size },
      { status: 201 }
    )
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
