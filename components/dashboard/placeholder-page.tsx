import { Construction } from "lucide-react"

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>

      <div className="bg-surface flex items-center gap-4 rounded-xl border border-border p-8">
        <span className="bg-primary-tint flex size-10 shrink-0 items-center justify-center rounded-lg text-primary">
          <Construction className="size-5" />
        </span>
        <div>
          <p className="font-medium text-text-primary">
            Section under construction
          </p>
          <p className="text-sm text-text-secondary">
            This screen will be wired to the Nexus API in a later build step.
          </p>
        </div>
      </div>
    </div>
  )
}