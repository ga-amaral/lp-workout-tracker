"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PlusCircle, Play, Settings, Dumbbell, LogOut, Trash2 } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
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
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Workout Tracker</h1>
              <p className="text-muted-foreground">
                Bem-vindo(a), {session.user?.name || session.user?.email}!
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Criar Novo Treino
            </CardTitle>
            <CardDescription>
              Gere um plano de treino personalizado com IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/workout/create">
              <Button className="w-full">
                Começar Agora
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Meu Treino Atual
            </CardTitle>
            <CardDescription>
              Continue ou inicie seu treino salvo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/workout/current">
              <Button className="w-full" variant="secondary">
                Entrar no Treino
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações da IA
            </CardTitle>
            <CardDescription>
              Configure sua chave da OpenAI e preferências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button className="w-full" variant="outline">
                Configurar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Meus Treinos Recentes</CardTitle>
            <CardDescription>
              Visualize e gerencie seus planos de treino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkoutList />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function WorkoutList() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const response = await fetch("/api/workouts")
      const data = await response.json()
      setWorkouts(data.workouts || [])
    } catch (error) {
      console.error("Error fetching workouts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!workoutToDelete) return

    try {
      const response = await fetch(`/api/workouts/${workoutToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWorkouts(workouts.filter(w => w.id !== workoutToDelete))
      } else {
        alert("Erro ao excluir treino")
      }
    } catch (error) {
      console.error("Error deleting workout:", error)
      alert("Erro ao excluir treino")
    } finally {
      setWorkoutToDelete(null)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Carregando treinos...</div>
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Você ainda não tem nenhum treino salvo.</p>
        <p className="text-sm">Crie seu primeiro treino personalizado!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-medium">{workout.name}</h3>
            <p className="text-sm text-muted-foreground">
              Criado em {new Date(workout.createdAt).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${workout.completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {Math.round(workout.completionPercentage)}% completo
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {workout.isActive && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                Ativo
              </span>
            )}
            <Link href={`/workout/${workout.id}`}>
              <Button variant="outline" size="sm">
                Ver
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setWorkoutToDelete(workout.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <AlertDialog open={!!workoutToDelete} onOpenChange={(open) => !open && setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o treino e todo o seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}