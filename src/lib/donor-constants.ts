// Shared constants and utilities for donor pages

export const DONATION_STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  PENDING_CONFIRMATION: {
    label: 'Awaiting Confirmation',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'We are confirming receipt of your payment',
  },
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800',
    description: 'Your donation has been received and will be transferred soon',
  },
  ALLOCATED: {
    label: 'Allocated',
    color: 'bg-purple-100 text-purple-800',
    description: 'Your donation has been allocated for transfer',
  },
  FORWARDED: {
    label: 'Sent to Ukraine',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Funds have been sent to the municipality',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    description: 'Municipality has confirmed receipt',
  },
  FAILED: {
    label: 'Issue',
    color: 'bg-red-100 text-red-800',
    description: 'There was an issue with your donation',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800',
    description: 'Your donation has been refunded',
  },
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WIRE: 'Wire Transfer',
  DAF: 'DAF Grant',
  CHECK: 'Check',
  ACH: 'Bank Transfer',
  OTHER: 'Other',
}

export const UPDATE_TYPE_CONFIG: Record<string, { label: string; badgeClass: string; icon: 'checkmark' | 'camera' | 'dot' }> = {
  PROZORRO_STATUS: {
    label: 'Procurement',
    badgeClass: 'bg-blue-50 text-blue-700',
    icon: 'checkmark',
  },
  PHOTO_ADDED: {
    label: 'Photo Update',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    icon: 'camera',
  },
  MANUAL: {
    label: 'Update',
    badgeClass: 'bg-[var(--cream-200)] text-[var(--navy-600)]',
    icon: 'dot',
  },
}

export interface JourneyStep {
  number: number
  title: string
  description: string
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    number: 1,
    title: 'Payment Received',
    description: 'Your contribution was received by POCACITO Network.',
  },
  {
    number: 2,
    title: 'Funds Forwarded to Ukraine',
    description: 'Your donation has been wired to the implementing NGO partner.',
  },
  {
    number: 3,
    title: 'Public Procurement',
    description: 'The municipality begins the formal procurement process through Prozorro.',
  },
  {
    number: 4,
    title: 'Construction & Updates',
    description: 'You\u2019ll receive progress photos as the community rebuilds.',
  },
  {
    number: 5,
    title: 'Project Complete',
    description: 'Final documentation and photos delivered to your donor dashboard.',
  },
]

/**
 * Maps a donation status (+ optional update signals) to the number of completed journey steps.
 * Returns -1 for FAILED/REFUNDED to signal the stepper should be hidden.
 */
export function getCompletedStepCount(
  status: string,
  opts?: { hasProzorro?: boolean; hasPhotos?: boolean }
): number {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 0
    case 'RECEIVED':
    case 'ALLOCATED':
      return 1
    case 'FORWARDED':
      if (opts?.hasPhotos) return 4
      if (opts?.hasProzorro) return 3
      return 2
    case 'COMPLETED':
      return 5
    case 'FAILED':
    case 'REFUNDED':
      return -1
    default:
      return 0
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
