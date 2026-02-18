import { NextRequest, NextResponse } from 'next/server'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Magic byte signatures for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
}

function validateMagicBytes(buffer: ArrayBuffer, claimedType: string): boolean {
  const expected = MAGIC_BYTES[claimedType]
  if (!expected) return false

  const bytes = new Uint8Array(buffer)
  if (bytes.length < expected.length) return false

  for (let i = 0; i < expected.length; i++) {
    if (bytes[i] !== expected[i]) return false
  }

  return true
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 uploads per hour per IP
  const rateLimitResponse = rateLimit(request, { limit: 10, windowSeconds: 3600 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Storage not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (client-claimed)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()

    // Validate magic bytes (don't trust client Content-Type alone)
    if (!validateMagicBytes(arrayBuffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type.' },
        { status: 400 }
      )
    }

    // Generate unique filename with submissions prefix
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `submissions/${timestamp}-${randomString}.${extension}`

    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file: ' + error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
