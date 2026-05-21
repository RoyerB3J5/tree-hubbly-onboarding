import { Metadata } from "next"
import LoginForm from "@/components/LoginForm"

export const metadata: Metadata = {
  title: "Iniciar sesión Treehubly — Portal del cliente",
}

export default function LoginPage() {
  return <LoginForm />
}
