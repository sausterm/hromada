/**
 * Tests for src/lib/pdf-extract.ts
 */

jest.mock('pdf-parse', () => {
  const mockPdfParse = jest.fn()
  return { __esModule: true, default: mockPdfParse }
})

jest.mock('@/lib/translate', () => ({
  translateText: jest.fn(),
  detectLanguage: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectDocument: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

import { extractAndTranslateDocument } from '@/lib/pdf-extract'
import { prisma } from '@/lib/prisma'
import { translateText, detectLanguage } from '@/lib/translate'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockTranslateText = translateText as jest.MockedFunction<typeof translateText>
const mockDetectLanguage = detectLanguage as jest.MockedFunction<typeof detectLanguage>
const pdfParse = require('pdf-parse').default as jest.Mock

describe('extractAndTranslateDocument', () => {
  const DOC_ID = 'doc-123'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    delete process.env.DEEPL_API_KEY
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns early if document not found', async () => {
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue(null)
    await extractAndTranslateDocument(DOC_ID)
    expect(mockPrisma.projectDocument.findUnique).toHaveBeenCalledWith({ where: { id: DOC_ID } })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('marks failed if PDF download fails', async () => {
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)

    expect(mockPrisma.projectDocument.update).toHaveBeenCalledWith({
      where: { id: DOC_ID },
      data: { extractionStatus: 'failed' },
    })
  })

  it('marks failed if extracted text is too short', async () => {
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    })
    pdfParse.mockResolvedValue({ text: 'short' })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)
    expect(mockPrisma.projectDocument.update).toHaveBeenCalledWith({
      where: { id: DOC_ID }, data: { extractionStatus: 'failed' },
    })
  })

  it('marks failed if PDF text is null', async () => {
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    })
    pdfParse.mockResolvedValue({ text: null })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)
    expect(mockPrisma.projectDocument.update).toHaveBeenCalledWith({
      where: { id: DOC_ID }, data: { extractionStatus: 'failed' },
    })
  })

  it('extracts Ukrainian text without translation when no API key', async () => {
    const text = 'This is a test document with enough text for processing and extraction.'
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('uk')
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)
    expect(mockPrisma.projectDocument.update).toHaveBeenCalledWith({
      where: { id: DOC_ID },
      data: { extractionStatus: 'extracted', originalTextUk: text },
    })
  })

  it('translates Ukrainian text to English when DEEPL_API_KEY is set', async () => {
    process.env.DEEPL_API_KEY = 'test-key'
    const text = 'This is a test document with enough text for processing and extraction.'
    const translated = 'Translated version of the document.'

    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('uk')
    mockTranslateText.mockResolvedValue({ translatedText: translated })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)

    const calls = (mockPrisma.projectDocument.update as jest.Mock).mock.calls
    const lastCall = calls[calls.length - 1][0]
    expect(lastCall.data.translatedTextEn).toBe(translated)
    expect(lastCall.data.extractionStatus).toBe('translated')
  })

  it('stores English text directly as translated', async () => {
    process.env.DEEPL_API_KEY = 'test-key'
    const text = 'This is an English document with enough text for processing purposes here.'

    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('en')
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)

    const calls = (mockPrisma.projectDocument.update as jest.Mock).mock.calls
    const lastCall = calls[calls.length - 1][0]
    expect(lastCall.data.translatedTextEn).toBe(text)
    expect(lastCall.data.extractionStatus).toBe('translated')
  })

  it('handles unknown language like Ukrainian', async () => {
    const text = 'Some mixed text that cannot be confidently detected as one language or another.'
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('unknown')
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)
    expect(mockPrisma.projectDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ originalTextUk: text }),
      })
    )
  })

  it('gracefully handles update failure in catch block', async () => {
    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'))
    ;(mockPrisma.projectDocument.update as jest.Mock).mockRejectedValue(new Error('DB still down'))

    await extractAndTranslateDocument(DOC_ID)
    expect(console.error).toHaveBeenCalled()
  })

  it('chunks long text for translation', async () => {
    process.env.DEEPL_API_KEY = 'test-key'
    const longPara = 'A'.repeat(2000)
    const text = `${longPara}\n\n${longPara}\n\n${longPara}`

    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('uk')
    mockTranslateText.mockResolvedValue({ translatedText: 'translated chunk' })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)
    expect(mockTranslateText.mock.calls.length).toBeGreaterThan(1)
  })

  it('keeps original chunk when translation returns null', async () => {
    process.env.DEEPL_API_KEY = 'test-key'
    const longPara = 'B'.repeat(2000)
    const text = `${longPara}\n\n${longPara}\n\n${longPara}`

    ;(mockPrisma.projectDocument.findUnique as jest.Mock).mockResolvedValue({
      id: DOC_ID, url: 'https://example.com/doc.pdf',
    })
    mockFetch.mockResolvedValue({
      ok: true, arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
    })
    pdfParse.mockResolvedValue({ text })
    mockDetectLanguage.mockReturnValue('uk')
    mockTranslateText
      .mockResolvedValueOnce({ translatedText: 'ok' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ translatedText: 'ok2' })
    ;(mockPrisma.projectDocument.update as jest.Mock).mockResolvedValue({})

    await extractAndTranslateDocument(DOC_ID)

    const calls = (mockPrisma.projectDocument.update as jest.Mock).mock.calls
    const lastCall = calls[calls.length - 1][0]
    expect(lastCall.data.translatedTextEn).toContain(longPara)
    expect(lastCall.data.translatedTextEn).toContain('ok')
  })
})
