'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { ProjectDocument, DocumentType } from '@/types'

interface DocumentUploadProps {
  projectId: string
  onDocumentsChange?: (documents: ProjectDocument[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'COST_ESTIMATE', label: 'Cost Estimate' },
  { value: 'ENGINEERING_ASSESSMENT', label: 'Engineering Assessment' },
  { value: 'ITEMIZED_BUDGET', label: 'Itemized Budget' },
  { value: 'SITE_SURVEY', label: 'Site Survey' },
  { value: 'OTHER', label: 'Other' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Processing...', className: 'bg-amber-100 text-amber-800' },
  extracted: { label: 'Text extracted', className: 'bg-blue-100 text-blue-800' },
  translated: { label: 'Translated', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Translation unavailable', className: 'bg-gray-100 text-gray-600' },
}

export function DocumentUpload({ projectId, onDocumentsChange }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType>('OTHER')
  const [label, setLabel] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch existing documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
        onDocumentsChange?.(data.documents)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }, [projectId, onDocumentsChange])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Poll for extraction status updates
  useEffect(() => {
    const hasPending = documents.some((d) => d.extractionStatus === 'pending')
    if (hasPending) {
      pollRef.current = setInterval(fetchDocuments, 5000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [documents, fetchDocuments])

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 10MB.')
      return
    }

    setUploadError(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', selectedType)
    if (label.trim()) formData.append('label', label.trim())

    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error || 'Upload failed')
        return
      }

      setLabel('')
      setSelectedType('OTHER')
      await fetchDocuments()
    } catch {
      setUploadError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchDocuments()
      }
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [selectedType, label, projectId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Partner Documents
      </h3>

      {/* Upload area */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
        />
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
            e.target.value = ''
          }}
        />
        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-gray-600">
          {isUploading ? 'Uploading...' : 'Drop a PDF here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF only, max 10MB</p>
      </div>

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => {
            const status = STATUS_BADGES[doc.extractionStatus] || STATUS_BADGES.pending
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth={1} />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.label || doc.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {doc.documentType.replace(/_/g, ' ')}
                    </span>
                    {doc.fileSize && (
                      <span className="text-xs text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  onClick={() => deleteDocument(doc.id)}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
