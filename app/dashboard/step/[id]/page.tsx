import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { getStep } from "@/lib/steps"
import StepClient from "@/components/StepClient"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const step = getStep(Number(id))
  return {
    title: step ? `Paso ${step.id}: ${step.title}` : "Paso no encontrado",
  }
}

export default async function StepPage({ params }: Props) {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params
  const stepId = Number(id)
  const step = getStep(stepId)

  if (!step) {
    notFound()
  }

  return <StepClient step={step} user={user} />
}
