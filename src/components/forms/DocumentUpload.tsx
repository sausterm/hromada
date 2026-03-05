'use client'

import { useState, useRef } from 'react'

interface DocumentFile {
  key: string
  filename: string
  size: number
}

interface DocumentUploadProps {
  documents: DocumentFile[]
  onChange: (documents: DocumentFile[]) => void
  partnerOrg: string
  projectName: string
  maxDocuments?: number
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload({
  documents,
  onChange,
  partnerOrg,
  projectName,
  maxDocuments = 10,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUpload = documents.length < maxDocuments

  const uploadFile = async (file: File): Promise<DocumentFile | null> => {
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.')
      return null
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 20MB.')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('partnerOrg', partnerOrg)
    formData.append('projectName', projectName)

    try {
      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      return await response.json()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      return null
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (!canUpload) return

    setUploadError(null)
    setIsUploading(true)

    const fileArray = Array.from(files)
    const remainingSlots = maxDocuments - documents.length
    const filesToUpload = fileArray.slice(0, remainingSlots)

    const uploaded: DocumentFile[] = []
    for (const file of filesToUpload) {
      const doc = await uploadFile(file)
      if (doc) uploaded.push(doc)
    }

    if (uploaded.length > 0) {
      onChange([...documents, ...uploaded])
    }

    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!canUpload) return
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeDocument = (index: number) => {
    onChange(documents.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-[var(--navy-700)]">
          Documents
        </label>
        <span className={`text-sm ${documents.length >= maxDocuments ? 'text-orange-600' : 'text-[var(--navy-500)]'}`}>
          {documents.length}/{maxDocuments} documents
        </span>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div
              key={doc.key}
              className="flex items-center gap-3 p-3 bg-white border border-[var(--cream-300)] rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--navy-800)] truncate">{doc.filename}</p>
                <p className="text-xs text-[var(--navy-500)]">{formatFileSize(doc.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="p-1.5 text-[var(--navy-400)] hover:text-red-500 transition-colors"
                title="Remove document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-[var(--navy-500)] bg-[var(--navy-50)]'
              : 'border-[var(--cream-400)] hover:border-[var(--navy-300)]'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="space-y-2">
            <div className="text-[var(--navy-400)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--navy-600)]">
              {isUploading ? (
                'Uploading...'
              ) : (
                <>
                  <span className="text-[var(--navy-700)] font-medium">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-[var(--navy-400)]">
              PDF only, up to 20MB per file
            </p>
          </div>
        </div>
      )}

      {!canUpload && (
        <p className="text-sm text-orange-600 text-center py-2">
          Maximum {maxDocuments} documents reached.
        </p>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {uploadError}
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
