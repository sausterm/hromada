import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cancelAllEnrollments } from '@/lib/drip'

// GET - Unsubscribe via token (one-click from email)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (subscriber.unsubscribed) {
      return NextResponse.json({ message: 'Already unsubscribed' })
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { unsubscribed: true },
    })

    // Cancel all active drip enrollments for this email
    await cancelAllEnrollments(subscriber.email)

    // Redirect to unsubscribe confirmation page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/unsubscribe?success=true`)
  } catch (error) {
    console.error('Unsubscribe failed:', error)
    return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 })
  }
}

// POST - Unsubscribe via form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { unsubscribed: true },
    })

    // Cancel all active drip enrollments for this email
    await cancelAllEnrollments(subscriber.email)

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })
  } catch (error) {
    console.error('Unsubscribe failed:', error)
    return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 })
  }
}
