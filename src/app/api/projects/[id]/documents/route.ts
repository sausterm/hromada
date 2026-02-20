import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { supabase, isSupabaseConfigured, STORAGE_BUCKET } from '@/lib/supabase'
import { extractAndTranslateDocument } from '@/lib/pdf-extract'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for PDFs

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/documents - List documents for a project (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const documents = await prisma.projectDocument.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    })

    const response = NextResponse.json({ documents })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/projects/[id]/documents - Upload a document (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params

    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Supabase storage not configured' }, { status: 500 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('documentType') as string) || 'OTHER'
    const label = formData.get('label') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Upload to Supabase storage
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const storagePath = `documents/${projectId}/${timestamp}-${randomString}.pdf`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    // Create database record
    const document = await prisma.projectDocument.create({
      data: {
        projectId,
        url: urlData.publicUrl,
        filename: file.name,
        documentType: documentType as any,
        label: label || null,
        fileSize: file.size,
        extractionStatus: 'pending',
      },
    })

    // Fire-and-forget: extract text and translate
    extractAndTranslateDocument(document.id).catch(err => {
      console.error('[documents] Extraction failed:', err)
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/documents?documentId=... - Delete a document (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await params // ensure params resolved

    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'No documentId provided' }, { status: 400 })
    }

    const doc = await prisma.projectDocument.findUnique({ where: { id: documentId } })
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Extract storage path from URL
    const urlParts = doc.url.split(`/${STORAGE_BUCKET}/`)
    if (urlParts[1]) {
      await supabase.storage.from(STORAGE_BUCKET).remove([urlParts[1]])
    }

    await prisma.projectDocument.delete({ where: { id: documentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
