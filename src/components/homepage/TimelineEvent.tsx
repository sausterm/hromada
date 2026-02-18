export function TimelineEvent({
  date,
  title,
  description,
  isComplete = true
}: {
  date: string
  title: string
  description?: string
  isComplete?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-[var(--cream-300)]'} ring-4 ${isComplete ? 'ring-green-100' : 'ring-[var(--cream-100)]'}`} />
        <div className="w-0.5 h-full bg-[var(--cream-300)] mt-2" />
      </div>
      <div className="pb-8">
        <div className="text-xs text-[var(--navy-400)] font-medium mb-1">{date}</div>
        <div className="font-semibold text-[var(--navy-700)]">{title}</div>
        {description && <p className="text-sm text-[var(--navy-500)] mt-1">{description}</p>}
      </div>
    </div>
  )
}
