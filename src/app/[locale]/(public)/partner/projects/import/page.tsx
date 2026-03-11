'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CATEGORY_CONFIG } from '@/types'
import Papa from 'papaparse'
import { buildHeaderMap, validateAndMapRow, type CsvRowValidation } from '@/lib/csv-mapping'

type UploadState = 'idle' | 'parsed' | 'uploading' | 'done'

interface BulkResult {
  total: number
  succeeded: number
  failed: number
  results: { row: number; success: boolean; id?: string; facilityName: string; error?: string }[]
}

export default function CsvImportPage() {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, isLoading, isPartner, user, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<UploadState>('idle')
  const [rows, setRows] = useState<CsvRowValidation[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [uploadResult, setUploadResult] = useState<BulkResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && !isPartner()) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, isPartner, router])

  const handleFile = useCallback((file: File) => {
    setParseError('')
    setUploadResult(null)

    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a .csv file')
      return
    }

    setFileName(file.name)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV parse error: ${results.errors[0].message}`)
          return
        }

        if (results.data.length === 0) {
          setParseError('CSV file is empty')
          return
        }

        if (results.data.length > 50) {
          setParseError('Maximum 50 projects per upload')
          return
        }

        const headers = results.meta.fields || []
        const headerMap = buildHeaderMap(headers)
        const unmappedHeaders = headers.filter(h => headerMap[h] === null)

        if (unmappedHeaders.length > 0 && Object.values(headerMap).filter(v => v !== null).length === 0) {
          setParseError('No recognized columns found. Please use the Hromada project template CSV.')
          return
        }

        const validated = results.data.map((row, i) => validateAndMapRow(row, i + 1, headerMap))
        setRows(validated)
        setState('parsed')
      },
      error: (error) => {
        setParseError(`Failed to parse CSV: ${error.message}`)
      },
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.errors.length === 0)
    if (validRows.length === 0) return

    setState('uploading')
    try {
      const response = await fetch('/api/partner/projects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: validRows.map(r => r.mapped),
        }),
      })

      const result: BulkResult = await response.json()
      setUploadResult(result)
      setState('done')
    } catch {
      setParseError('Upload failed. Please try again.')
      setState('parsed')
    }
  }

  const handleReset = () => {
    setState('idle')
    setRows([])
    setFileName('')
    setParseError('')
    setUploadResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (isLoading || !isAuthenticated || !isPartner()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const validCount = rows.filter(r => r.errors.length === 0).length
  const errorCount = rows.filter(r => r.errors.length > 0).length

  return (
    <div className="min-h-screen bg-[var(--cream-100)]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-[var(--ukraine-600)]">
              hromada
            </Link>
            <Badge variant="info">{t('partner.title')}</Badge>
          </div>
          <div className="flex items-center gap-4">
            {user?.name && (
              <span className="text-sm text-gray-500">
                {t('admin.loggedInAs')}: <span className="font-medium text-gray-700">{user.name}</span>
              </span>
            )}
            <Button variant="ghost" onClick={logout}>
              {t('admin.nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/partner" className="text-[var(--ukraine-600)] hover:underline text-sm">
            &larr; {t('partner.import.backToDashboard')}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('partner.import.title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('partner.import.description')}
        </p>

        {/* Step 1: Download template */}
        {state === 'idle' && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('partner.import.step1Title')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('partner.import.step1Description')}
                </p>
                <a
                  href="/Partner_Project_Template.csv"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ukraine-600)] text-white rounded-lg hover:bg-[var(--ukraine-700)] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  {t('partner.import.downloadTemplate')}
                </a>
              </CardContent>
            </Card>

            {/* Step 2: Upload */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('partner.import.step2Title')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('partner.import.step2Description')}
                </p>

                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-[var(--ukraine-600)] bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                  role="button"
                  tabIndex={0}
                  aria-label={t('partner.import.dropzoneLabel')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    {t('partner.import.dropzoneTitle')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('partner.import.dropzoneSubtitle')}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>

                {parseError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                    {parseError}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Preview & validate */}
        {state === 'parsed' && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('partner.import.previewTitle')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {fileName} — {rows.length} {rows.length === 1 ? 'project' : 'projects'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="success">{validCount} {t('partner.import.valid')}</Badge>
                    {errorCount > 0 && (
                      <Badge variant="danger">{errorCount} {t('partner.import.withErrors')}</Badge>
                    )}
                  </div>
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th scope="col" className="text-left p-3 font-medium text-gray-500">#</th>
                        <th scope="col" className="text-left p-3 font-medium text-gray-500">{t('partner.projects.table.facility')}</th>
                        <th scope="col" className="text-left p-3 font-medium text-gray-500">{t('partner.projects.table.municipality')}</th>
                        <th scope="col" className="text-center p-3 font-medium text-gray-500">{t('partner.projects.table.category')}</th>
                        <th scope="col" className="text-right p-3 font-medium text-gray-500">{t('partner.import.cost')}</th>
                        <th scope="col" className="text-center p-3 font-medium text-gray-500">{t('partner.projects.table.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((row) => {
                        const hasErrors = row.errors.length > 0
                        const catKey = String(row.mapped.category || '') as keyof typeof CATEGORY_CONFIG
                        const categoryConfig = CATEGORY_CONFIG[catKey]

                        return (
                          <tr key={row.row} className={hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="p-3 text-gray-400">{row.row}</td>
                            <td className="p-3">
                              <p className="font-medium text-gray-900">
                                {String(row.mapped.facilityName || '—')}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {String(row.mapped.briefDescription || '')}
                              </p>
                            </td>
                            <td className="p-3 text-gray-600">
                              {String(row.mapped.municipalityName || '—')}
                            </td>
                            <td className="p-3 text-center">
                              {categoryConfig ? (
                                <Badge dot dotColor={categoryConfig.color} size="sm">
                                  {categoryConfig.label}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right text-gray-600">
                              {row.mapped.estimatedCostUsd
                                ? `$${Number(row.mapped.estimatedCostUsd).toLocaleString()}`
                                : '—'}
                            </td>
                            <td className="p-3 text-center">
                              {hasErrors ? (
                                <div>
                                  <Badge variant="danger" size="sm">{t('partner.import.invalid')}</Badge>
                                  <div className="mt-1">
                                    {row.errors.map((err, i) => (
                                      <p key={i} className="text-xs text-red-600">{err}</p>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="success" size="sm">{t('partner.import.ready')}</Badge>
                              )}
                              {row.warnings.length > 0 && (
                                <div className="mt-1">
                                  {row.warnings.map((warn, i) => (
                                    <p key={i} className="text-xs text-amber-600">{warn}</p>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleReset}>
                {t('partner.import.startOver')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={validCount === 0}
              >
                {t('partner.import.submitProjects', { count: validCount })}
              </Button>
            </div>

            {errorCount > 0 && validCount > 0 && (
              <p className="text-sm text-gray-500 mt-3 text-right">
                {t('partner.import.errorRowsSkipped', { count: errorCount })}
              </p>
            )}
          </>
        )}

        {/* Uploading state */}
        {state === 'uploading' && (
          <Card>
            <CardContent className="p-12 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">{t('partner.import.uploading')}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {state === 'done' && uploadResult && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                {uploadResult.succeeded > 0 ? (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {t('partner.import.successTitle', { count: uploadResult.succeeded })}
                    </h2>
                    <p className="text-gray-600">
                      {t('partner.import.successDescription')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                        <line x1="18" x2="6" y1="6" y2="18" />
                        <line x1="6" x2="18" y1="6" y2="18" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {t('partner.import.failTitle')}
                    </h2>
                  </>
                )}
              </div>

              {/* Per-row results */}
              {uploadResult.failed > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('partner.import.failedRows')}</h3>
                  <div className="space-y-2">
                    {uploadResult.results.filter(r => !r.success).map((r) => (
                      <div key={r.row} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                        <span className="text-gray-700">{r.facilityName}</span>
                        <span className="text-red-600">{r.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleReset}>
                  {t('partner.import.uploadMore')}
                </Button>
                <Link href="/partner">
                  <Button>{t('partner.import.backToDashboard')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
