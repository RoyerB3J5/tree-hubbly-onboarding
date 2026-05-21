import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import DashboardClient from "@/components/DashboardClient"

export const metadata: Metadata = {
  title: "Mi progreso — Portal del cliente",
}

export default async function DashboardPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardClient user={user} />
}
