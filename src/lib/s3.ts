import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const S3_REGION = process.env.S3_REGION || 'us-east-1'
const STAGING_BUCKET = 'hromada-partner-docs-staging'
const PRODUCTION_BUCKET = 'hromada-partner-docs'

let client: S3Client | null = null

function getClient(): S3Client | null {
  if (client) return client

  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    console.warn('S3 credentials not configured, document uploads disabled')
    return null
  }

  try {
    client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    })
    return client
  } catch (error) {
    console.warn('Failed to initialize S3 client:', error)
    return null
  }
}

/**
 * Build a sanitized S3 key for a document.
 * e.g. "ecoaction/lychkove/1709578000-cost-estimate.pdf"
 */
export function buildDocumentKey(
  partnerOrg: string,
  projectName: string,
  filename: string
): string {
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const timestamp = Math.floor(Date.now() / 1000)
  const safeName = sanitize(filename.replace(/\.[^.]+$/, ''))
  const ext = filename.split('.').pop()?.toLowerCase() || 'pdf'

  return `${sanitize(partnerOrg)}/${sanitize(projectName)}/${timestamp}-${safeName}.${ext}`
}

/**
 * Upload a document to the staging bucket.
 * Returns the S3 key on success, null if S3 is unconfigured.
 */
export async function uploadDocumentToStaging(
  key: string,
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<string | null> {
  const s3 = getClient()
  if (!s3) return null

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: STAGING_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: `inline; filename="${filename}"`,
      })
    )
    return key
  } catch (error) {
    console.error('S3 staging upload failed:', error)
    throw error
  }
}

/**
 * Promote documents from staging to production bucket.
 * Returns the number of documents successfully promoted.
 */
export async function promoteDocuments(keys: string[]): Promise<number> {
  const s3 = getClient()
  if (!s3 || keys.length === 0) return 0

  let promoted = 0
  for (const key of keys) {
    try {
      // Copy to production
      await s3.send(
        new CopyObjectCommand({
          Bucket: PRODUCTION_BUCKET,
          Key: key,
          CopySource: `${STAGING_BUCKET}/${key}`,
        })
      )
      // Delete from staging
      await s3.send(
        new DeleteObjectCommand({
          Bucket: STAGING_BUCKET,
          Key: key,
        })
      )
      promoted++
    } catch (error) {
      console.error(`Failed to promote document ${key}:`, error)
    }
  }
  return promoted
}

/**
 * Delete documents from the staging bucket (e.g. on rejection).
 * Returns the number of documents successfully deleted.
 */
export async function deleteFromStaging(keys: string[]): Promise<number> {
  const s3 = getClient()
  if (!s3 || keys.length === 0) return 0

  let deleted = 0
  for (const key of keys) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: STAGING_BUCKET,
          Key: key,
        })
      )
      deleted++
    } catch (error) {
      console.error(`Failed to delete staging document ${key}:`, error)
    }
  }
  return deleted
}

/**
 * Get the public URL for a document in the production bucket.
 */
export function getProductionUrl(key: string): string {
  return `https://${PRODUCTION_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`
}
