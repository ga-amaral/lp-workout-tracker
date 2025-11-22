"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Dumbbell, Calendar, Target, Play, CheckCircle2 } from "lucide-react"

interface Workout {
  id: string
  name: string
  workoutJson: {
    splits: Array<{
      name: string
      exercises: Array<{
        main: string
        sets: string
        reps: string
        substitutions: string[]
      }>
    }>
  }
  completionPercentage: number
  isActive: boolean
  createdAt: string
  cyclesCompleted: number
  durationDays: number
}

export default function WorkoutView() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActivating, setIsActivating] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    } else if (params.id) {
      fetchWorkout(params.id as string)
    }
  }, [session, status, router, params.id])

  const fetchWorkout = async (id: string) => {
    try {
      const response = await fetch(`/api/workouts/${id}`)
      const data = await response.json()

      if (response.ok) {
        setWorkout(data.workout)
      } else {
        console.error("Error fetching workout:", data.error)
      }
    } catch (error) {
      console.error("Error fetching workout:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const makeActive = async () => {
    if (!workout) return

    setIsActivating(true)
    try {
      // First, deactivate all workouts
      const deactivateResponse = await fetch("/api/workouts/deactivate-all", {
        method: "POST",
      })

      if (!deactivateResponse.ok) {
        throw new Error("Erro ao desativar treinos anteriores")
      }

      // Then set this workout as active
      const response = await fetch(`/api/workouts/${workout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: true
        }),
      })

      if (response.ok) {
        setWorkout({ ...workout, isActive: true })
        router.push("/workout/current")
      }
    } catch (error) {
      console.error("Error setting workout as active:", error)
      alert("Ocorreu um erro ao ativar o treino")
    } finally {
      setIsActivating(false)
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

  if (!workout) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Treino Não Encontrado</CardTitle>
            <CardDescription>
              O treino solicitado não foi encontrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const splits = workout.workoutJson?.splits || []
  const totalExercises = splits.reduce((total, split) => total + (split.exercises?.length || 0), 0)
  const workoutsDone = (workout.cyclesCompleted || 0) * splits.length
  const totalWorkoutsTarget = workout.durationDays || 0

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          {workout.isActive && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Treino Ativo
            </Badge>
          )}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{workout.name}</h1>
          <p className="text-muted-foreground">
            {splits.length} divisões • {totalExercises} exercícios • {Math.round(workout.completionPercentage)}% completo
          </p>
        </div>
      </header>

      <main className="space-y-6">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                  <p className="text-lg font-semibold">
                    {new Date(workout.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ciclos Completados</p>
                  <p className="text-lg font-semibold">{workout.cyclesCompleted || 0}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Treinos Realizados</p>
                  <p className="text-lg font-semibold">
                    {workoutsDone} / {totalWorkoutsTarget}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-muted-foreground">{Math.round(workout.completionPercentage)}%</span>
              </div>
              <Progress value={workout.completionPercentage} className="h-2" />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {!workout.isActive && (
                <Button onClick={makeActive} className="flex-1 w-full" disabled={isActivating}>
                  {isActivating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Tornar este Treino Ativo
                    </>
                  )}
                </Button>
              )}
              {workout.isActive && (
                <Link href="/workout/current" className="flex-1 w-full">
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Continuar Treino
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workout Splits with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Divisões do Treino</CardTitle>
            <CardDescription>
              Veja os exercícios organizados por divisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={splits[0]?.name} className="w-full">
              <TabsList className="flex flex-col w-full h-auto gap-2 bg-muted/50 p-3 mb-4 sm:flex-row sm:flex-wrap justify-start">
                {splits.map((split, index) => (
                  <TabsTrigger
                    key={index}
                    value={split.name}
                    className="justify-start sm:flex-1 sm:min-w-[120px]"
                  >
                    <Dumbbell className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Treino {split.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {splits.map((split, splitIndex) => (
                <TabsContent key={splitIndex} value={split.name} className="space-y-3">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Treino {split.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {split.exercises?.length || 0} exercícios nesta divisão
                    </p>
                  </div>

                  <div className="space-y-3">
                    {split.exercises?.map((exercise, exerciseIndex) => (
                      <div
                        key={exerciseIndex}
                        className="p-4 rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-full bg-primary/10 mt-0.5">
                              <Dumbbell className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{exercise.main}</h4>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                            {exercise.sets} × {exercise.reps}
                          </Badge>
                        </div>

                        {exercise.substitutions && exercise.substitutions.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Exercícios Alternativos:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {exercise.substitutions.map((sub, subIndex) => (
                                <li key={subIndex} className="flex items-center gap-2 text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                  {sub}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}