"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Key, Loader2, Check, AlertCircle, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Settings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [openaiKey, setOpenaiKey] = useState("")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    } else {
      fetchUserSettings()
    }
  }, [session, status, router])

  const fetchUserSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/settings")
      const data = await response.json()

      if (response.ok) {
        setHasApiKey(data.user.hasOpenAIKey || false)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!openaiKey.trim()) {
      setMessage("Por favor, insira uma API Key válida")
      setMessageType("error")
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openaiKey: openaiKey.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || "Ocorreu um erro ao salvar a API Key")
        setMessageType("error")
      } else {
        setMessage("API Key salva com sucesso!")
        setMessageType("success")
        setOpenaiKey("")
        setHasApiKey(true)
      }
    } catch (error) {
      setMessage("Ocorreu um erro ao salvar a API Key")
      setMessageType("error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover sua API Key da OpenAI?")) {
      return
    }

    setIsDeleting(true)
    setMessage("")

    try {
      const response = await fetch("/api/user/settings", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || "Ocorreu um erro ao deletar a API Key")
        setMessageType("error")
      } else {
        setMessage("API Key removida com sucesso!")
        setMessageType("success")
        setHasApiKey(false)
      }
    } catch (error) {
      setMessage("Ocorreu um erro ao deletar a API Key")
      setMessageType("error")
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Preencha todos os campos de senha")
      setMessageType("error")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("A nova senha e a confirmação não coincidem")
      setMessageType("error")
      return
    }

    if (newPassword.length < 6) {
      setMessage("A nova senha deve ter pelo menos 6 caracteres")
      setMessageType("error")
      return
    }

    setIsChangingPassword(true)
    setMessage("")

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || "Ocorreu um erro ao alterar a senha")
        setMessageType("error")
      } else {
        setMessage("Senha alterada com sucesso!")
        setMessageType("success")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      setMessage("Ocorreu um erro ao alterar a senha")
      setMessageType("error")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <ThemeToggle />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências de conta
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="w-full"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div >
  )
}