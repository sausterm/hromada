import pdfParse from 'pdf-parse'
import { translateText, detectLanguage } from '@/lib/translate'
import { prisma } from '@/lib/prisma'

const MAX_CHUNK_SIZE = 4500 // Google Translate API limit per request

/**
 * Extract text from a PDF and translate it.
 * Called fire-and-forget after document upload.
 */
export async function extractAndTranslateDocument(documentId: string): Promise<void> {
  try {
    const doc = await prisma.projectDocument.findUnique({ where: { id: documentId } })
    if (!doc) {
      console.error(`[pdf-extract] Document ${documentId} not found`)
      return
    }

    // Download PDF from Supabase URL
    const response = await fetch(doc.url)
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text
    const pdfData = await pdfParse(buffer)
    const extractedText = pdfData.text?.trim()

    if (!extractedText || extractedText.length < 10) {
      // PDF is likely scanned/image-based — no extractable text
      await prisma.projectDocument.update({
        where: { id: documentId },
        data: { extractionStatus: 'failed' },
      })
      console.log(`[pdf-extract] No text found in document ${documentId} (likely scanned PDF)`)
      return
    }

    // Detect language
    const language = detectLanguage(extractedText)

    // Store extracted text
    const updateData: Record<string, string> = { extractionStatus: 'extracted' }

    if (language === 'uk' || language === 'unknown') {
      updateData.originalTextUk = extractedText
    }

    await prisma.projectDocument.update({
      where: { id: documentId },
      data: updateData,
    })

    // Translate if we have text and an API key
    if (!process.env.DEEPL_API_KEY) {
      console.log(`[pdf-extract] No API key, skipping translation for document ${documentId}`)
      return
    }

    if (language === 'uk' || language === 'unknown') {
      // Translate Ukrainian → English
      const translatedText = await translateLongText(extractedText, 'en', 'uk')
      if (translatedText) {
        await prisma.projectDocument.update({
          where: { id: documentId },
          data: {
            originalTextUk: extractedText,
            translatedTextEn: translatedText,
            extractionStatus: 'translated',
          },
        })
        console.log(`[pdf-extract] Translated document ${documentId} (${extractedText.length} chars)`)
      }
    } else if (language === 'en') {
      // Already English — store as translated text
      await prisma.projectDocument.update({
        where: { id: documentId },
        data: {
          translatedTextEn: extractedText,
          extractionStatus: 'translated',
        },
      })
      console.log(`[pdf-extract] Document ${documentId} is already in English`)
    }
  } catch (error) {
    console.error(`[pdf-extract] Failed for document ${documentId}:`, error)
    await prisma.projectDocument.update({
      where: { id: documentId },
      data: { extractionStatus: 'failed' },
    }).catch(() => {}) // Don't throw if update fails too
  }
}

/**
 * Translate long text by chunking at paragraph boundaries.
 */
async function translateLongText(
  text: string,
  targetLanguage: 'uk' | 'en',
  sourceLanguage: 'uk' | 'en'
): Promise<string | null> {
  if (text.length <= MAX_CHUNK_SIZE) {
    const result = await translateText(text, targetLanguage, sourceLanguage)
    return result?.translatedText ?? null
  }

  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > MAX_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk)
      // If a single paragraph exceeds the limit, split it further
      if (para.length > MAX_CHUNK_SIZE) {
        const sentences = para.split(/(?<=[.!?])\s+/)
        let sentenceChunk = ''
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 > MAX_CHUNK_SIZE) {
            if (sentenceChunk) chunks.push(sentenceChunk)
            sentenceChunk = sentence
          } else {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk
        else currentChunk = ''
      } else {
        currentChunk = para
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }
  if (currentChunk) chunks.push(currentChunk)

  // Translate each chunk
  const translatedChunks: string[] = []
  for (const chunk of chunks) {
    const result = await translateText(chunk, targetLanguage, sourceLanguage)
    if (result?.translatedText) {
      translatedChunks.push(result.translatedText)
    } else {
      translatedChunks.push(chunk) // Keep original on failure
    }
    // Rate limit between chunks
    await new Promise((r) => setTimeout(r, 50))
  }

  return translatedChunks.join('\n\n')
}
