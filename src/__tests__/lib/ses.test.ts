/**
 * @jest-environment node
 */

// Mock the AWS SDK before importing ses module
const mockSend = jest.fn()
jest.mock('@aws-sdk/client-sesv2', () => {
  return {
    SESv2Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    SendEmailCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'SendEmailCommand' })),
    SendBulkEmailCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'SendBulkEmailCommand' })),
  }
})

import { sendEmail, sendBulkEmail } from '@/lib/ses'
import { SESv2Client } from '@aws-sdk/client-sesv2'

describe('ses module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('sends email with correct command params', async () => {
      mockSend.mockResolvedValue({ MessageId: 'msg-123' })

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      })

      expect(result).toEqual({ success: true, messageId: 'msg-123' })
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          FromEmailAddress: 'Hromada <noreply@hromadaproject.org>',
          Destination: { ToAddresses: ['test@example.com'] },
          Content: {
            Simple: {
              Subject: { Data: 'Test Subject', Charset: 'UTF-8' },
              Body: { Html: { Data: '<p>Hello</p>', Charset: 'UTF-8' } },
            },
          },
        })
      )
    })

    it('handles array of to addresses', async () => {
      mockSend.mockResolvedValue({ MessageId: 'msg-456' })

      const result = await sendEmail({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Multi',
        html: '<p>Hi</p>',
      })

      expect(result).toEqual({ success: true, messageId: 'msg-456' })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Destination: { ToAddresses: ['a@example.com', 'b@example.com'] },
        })
      )
    })

    it('uses custom from and replyTo when provided', async () => {
      mockSend.mockResolvedValue({ MessageId: 'msg-789' })

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
        from: 'Custom Sender <custom@example.com>',
        replyTo: ['reply@example.com'],
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          FromEmailAddress: 'Custom Sender <custom@example.com>',
          ReplyToAddresses: ['reply@example.com'],
        })
      )
    })

    it('returns success false on SES send failure', async () => {
      mockSend.mockRejectedValue(new Error('SES throttled'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result).toEqual({ success: false, error: 'SES throttled' })
      consoleSpy.mockRestore()
    })

    it('handles non-Error exceptions in send failure', async () => {
      mockSend.mockRejectedValue('string error')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result).toEqual({ success: false, error: 'Failed to send email' })
      consoleSpy.mockRestore()
    })

    it('returns success true when SES client unavailable', async () => {
      // Make SESv2Client constructor throw to simulate unavailable client
      ;(SESv2Client as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('No credentials')
      })
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // We need a fresh module to reset the cached client
      jest.resetModules()
      jest.mock('@aws-sdk/client-sesv2', () => ({
        SESv2Client: jest.fn().mockImplementation(() => {
          throw new Error('No credentials')
        }),
        SendEmailCommand: jest.fn(),
        SendBulkEmailCommand: jest.fn(),
      }))

      const { sendEmail: freshSendEmail } = require('@/lib/ses')

      const result = await freshSendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })
  })

  describe('sendBulkEmail', () => {
    it('sends batch with correct command structure', async () => {
      mockSend.mockResolvedValue({
        BulkEmailEntryResults: [
          { Status: 'SUCCESS' },
          { Status: 'SUCCESS' },
        ],
      })

      const result = await sendBulkEmail({
        recipients: [
          { to: 'a@example.com' },
          { to: 'b@example.com' },
        ],
        subject: 'Bulk Test',
        html: '<p>Bulk</p>',
      })

      expect(result).toEqual({ total: 2, sent: 2, failed: 0, errors: [] })
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('returns correct sent/failed counts from mixed results', async () => {
      mockSend.mockResolvedValue({
        BulkEmailEntryResults: [
          { Status: 'SUCCESS' },
          { Status: 'FAILED', Error: 'Bounce' },
          { Status: 'SUCCESS' },
        ],
      })

      const result = await sendBulkEmail({
        recipients: [
          { to: 'a@example.com' },
          { to: 'b@example.com' },
          { to: 'c@example.com' },
        ],
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result.sent).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toEqual([{ to: 'b@example.com', error: 'Bounce' }])
    })

    it('processes recipients in batches of 50', async () => {
      // Create 75 recipients to trigger 2 batches
      const recipients = Array.from({ length: 75 }, (_, i) => ({
        to: `user${i}@example.com`,
      }))

      mockSend
        .mockResolvedValueOnce({
          BulkEmailEntryResults: Array(50).fill({ Status: 'SUCCESS' }),
        })
        .mockResolvedValueOnce({
          BulkEmailEntryResults: Array(25).fill({ Status: 'SUCCESS' }),
        })

      const result = await sendBulkEmail({
        recipients,
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ total: 75, sent: 75, failed: 0, errors: [] })
    })

    it('handles full batch failure (catch block)', async () => {
      mockSend.mockRejectedValue(new Error('Network down'))

      const result = await sendBulkEmail({
        recipients: [
          { to: 'a@example.com' },
          { to: 'b@example.com' },
        ],
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result.sent).toBe(0)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toEqual({ to: 'a@example.com', error: 'Network down' })
    })

    it('returns gracefully when SES client unavailable', async () => {
      jest.resetModules()
      jest.mock('@aws-sdk/client-sesv2', () => ({
        SESv2Client: jest.fn().mockImplementation(() => {
          throw new Error('No credentials')
        }),
        SendEmailCommand: jest.fn(),
        SendBulkEmailCommand: jest.fn(),
      }))
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { sendBulkEmail: freshSendBulkEmail } = require('@/lib/ses')

      const result = await freshSendBulkEmail({
        recipients: [{ to: 'a@example.com' }],
        subject: 'Test',
        html: '<p>Hi</p>',
      })

      expect(result).toEqual({ total: 1, sent: 0, failed: 0, errors: [] })
      consoleSpy.mockRestore()
    })
  })
})
