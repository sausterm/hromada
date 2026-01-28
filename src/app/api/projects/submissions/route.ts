import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hromada.org'

// GET - List all submissions (admin only)
export async function GET(request: NextRequest) {
  // Check for admin authorization (supports both cookie and Bearer token)
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submissions = await prisma.projectSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create new submission (public)
export async function POST(request: NextRequest) {
  // Rate limit: 3 submissions per hour per IP
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.projectSubmission)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = [
      'municipalityName',
      'municipalityEmail',
      'facilityName',
      'category',
      'projectType',
      'briefDescription',
      'fullDescription',
      'cityName',
      'cityLatitude',
      'cityLongitude',
      'contactName',
      'contactEmail',
    ]

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.municipalityEmail)) {
      return NextResponse.json({ error: 'Invalid municipality email format' }, { status: 400 })
    }
    if (!emailRegex.test(data.contactEmail)) {
      return NextResponse.json({ error: 'Invalid contact email format' }, { status: 400 })
    }

    // Validate character limits
    if (data.briefDescription.length > 150) {
      return NextResponse.json({ error: 'Brief description must be 150 characters or less' }, { status: 400 })
    }
    if (data.fullDescription.length > 2000) {
      return NextResponse.json({ error: 'Full description must be 2000 characters or less' }, { status: 400 })
    }

    // Validate coordinates
    const lat = parseFloat(data.cityLatitude)
    const lng = parseFloat(data.cityLongitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
    }

    // Create submission
    const submission = await prisma.projectSubmission.create({
      data: {
        municipalityName: data.municipalityName.trim(),
        municipalityEmail: data.municipalityEmail.trim().toLowerCase(),
        region: data.region?.trim() || null,
        facilityName: data.facilityName.trim(),
        category: data.category,
        projectType: data.projectType,
        briefDescription: data.briefDescription.trim(),
        fullDescription: data.fullDescription.trim(),
        urgency: data.urgency || 'MEDIUM',
        estimatedCostUsd: data.estimatedCostUsd ? parseFloat(data.estimatedCostUsd) : null,
        technicalPowerKw: data.technicalPowerKw ? parseFloat(data.technicalPowerKw) : null,
        numberOfPanels: data.numberOfPanels ? parseInt(data.numberOfPanels) : null,
        cofinancingAvailable: data.cofinancingAvailable || null,
        cofinancingDetails: data.cofinancingDetails?.trim() || null,
        cityName: data.cityName.trim(),
        address: data.address?.trim() || null,
        cityLatitude: lat,
        cityLongitude: lng,
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim().toLowerCase(),
        contactPhone: data.contactPhone?.trim() || null,
        partnerOrganization: data.partnerOrganization?.trim() || null,
        projectSubtype: data.projectSubtype?.trim() || null,
        additionalNotes: data.additionalNotes?.trim() || null,
      },
    })

    // Send email notification to admin
    if (resend && ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Hromada <noreply@hromada.org>',
          to: ADMIN_EMAIL,
          subject: `New Project Submission: ${data.facilityName}`,
          html: `
            <h2>New Project Submission</h2>
            <p>A new project has been submitted for review.</p>

            <h3>Municipality Information</h3>
            <ul>
              <li><strong>Municipality:</strong> ${data.municipalityName}</li>
              <li><strong>Email:</strong> ${data.municipalityEmail}</li>
              ${data.region ? `<li><strong>Region:</strong> ${data.region}</li>` : ''}
            </ul>

            <h3>Project Details</h3>
            <ul>
              <li><strong>Facility:</strong> ${data.facilityName}</li>
              <li><strong>Category:</strong> ${data.category}</li>
              <li><strong>Type:</strong> ${data.projectType}</li>
              <li><strong>Urgency:</strong> ${data.urgency || 'MEDIUM'}</li>
            </ul>

            <h3>Brief Description</h3>
            <p>${data.briefDescription}</p>

            <h3>Contact Information</h3>
            <ul>
              <li><strong>Name:</strong> ${data.contactName}</li>
              <li><strong>Email:</strong> ${data.contactEmail}</li>
              ${data.contactPhone ? `<li><strong>Phone:</strong> ${data.contactPhone}</li>` : ''}
            </ul>

            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin">Review in Admin Dashboard</a></p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Send confirmation email to submitter
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Hromada <noreply@hromada.org>',
          to: data.contactEmail.trim().toLowerCase(),
          subject: 'Project Submission Received - Hromada',
          html: `
            <h2>Thank You for Your Submission</h2>
            <p>Dear ${data.contactName},</p>

            <p>We have received your project submission for <strong>${data.facilityName}</strong>.</p>

            <h3>What Happens Next?</h3>
            <ul>
              <li>Our team will review your submission within 3-5 business days.</li>
              <li>We may contact you if we need additional information.</li>
              <li>Once approved, your project will be visible to potential donors on our platform.</li>
            </ul>

            <p>If you have any questions, please contact us at support@hromada.org</p>

            <p>Thank you for working to rebuild Ukraine's communities.</p>

            <p>Best regards,<br>The Hromada Team</p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Project submitted successfully',
    })
  } catch (error) {
    console.error('Failed to create submission:', error)
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 })
  }
}
