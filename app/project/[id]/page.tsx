import { Suspense } from 'react'
import ProjectProofingClient from './ProjectProofingClient'

export default function ProjectProofingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <ProjectProofingClient params={params} />
    </Suspense>
  )
}
