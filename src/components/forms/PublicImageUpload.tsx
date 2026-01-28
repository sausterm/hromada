'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

interface PublicImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function PublicImageUpload({
  images,
  onChange,
  maxImages = 5,
}: PublicImageUploadProps) {
  const t = useTranslations()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUpload = images.length < maxImages

  const uploadFile = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(t('submitProject.photos.invalidType'))
      return null
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(t('submitProject.photos.tooLarge'))
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload/public', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('submitProject.photos.uploadFailed'))
      return null
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (!canUpload) return

    setUploadError(null)
    setIsUploading(true)

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length
    const filesToUpload = fileArray.slice(0, remainingSlots)

    const uploadedUrls: string[] = []
    for (const file of filesToUpload) {
      const url = await uploadFile(file)
      if (url) {
        uploadedUrls.push(url)
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls])
    }

    setIsUploading(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (!canUpload) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [canUpload, images, maxImages, onChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (canUpload) {
      setIsDragOver(true)
    }
  }, [canUpload])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  // Drag and drop reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[dragIndex]
    newImages.splice(dragIndex, 1)
    newImages.splice(index, 0, draggedImage)
    onChange(newImages)
    setDragIndex(index)
  }

  const handleImageDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-[var(--navy-700)]">
          {t('submitProject.photos.label')}
        </label>
        <span className={`text-sm ${images.length >= maxImages ? 'text-orange-600' : 'text-[var(--navy-500)]'}`}>
          {images.length}/{maxImages} {t('submitProject.photos.images')}
        </span>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={`relative aspect-video bg-[var(--cream-200)] rounded-lg overflow-hidden group cursor-move border-2 ${
                dragIndex === index ? 'border-[var(--navy-500)] opacity-50' : 'border-transparent'
              }`}
            >
              <img
                src={url}
                alt={`${t('submitProject.photos.imageAlt')} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title={t('submitProject.photos.remove')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--navy-600)] text-white text-xs rounded">
                  {t('submitProject.photos.main')}
                </span>
              )}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-[var(--navy-500)] bg-[var(--navy-50)]'
              : 'border-[var(--cream-400)] hover:border-[var(--navy-300)]'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="space-y-2">
            <div className="text-[var(--navy-400)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--navy-600)]">
              {isUploading ? (
                t('submitProject.photos.uploading')
              ) : (
                <>
                  <span className="text-[var(--navy-700)] font-medium">{t('submitProject.photos.clickToUpload')}</span> {t('submitProject.photos.orDragDrop')}
                </>
              )}
            </p>
            <p className="text-xs text-[var(--navy-400)]">
              {t('submitProject.photos.fileTypes')}
            </p>
          </div>
        </div>
      )}

      {!canUpload && (
        <p className="text-sm text-orange-600 text-center py-2">
          {t('submitProject.photos.maxReached', { max: maxImages })}
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
            {t('submitProject.photos.dismiss')}
          </button>
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-[var(--navy-500)]">
          {t('submitProject.photos.dragToReorder')}
        </p>
      )}
    </div>
  )
}
