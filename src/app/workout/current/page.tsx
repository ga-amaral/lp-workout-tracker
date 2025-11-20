"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Dumbbell, CheckCircle, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
        completed?: boolean
      }>
    }>
  }
  completionPercentage: number
  isActive: boolean
  createdAt: string
  cyclesCompleted: number
}

interface ExerciseState {
  [key: string]: boolean
}

export default function CurrentWorkout() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [exerciseState, setExerciseState] = useState<ExerciseState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFinishingCycle, setIsFinishingCycle] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    } else {
      fetchCurrentWorkout()
    }
  }, [session, status, router])

  const fetchCurrentWorkout = async () => {
    try {
      const response = await fetch("/api/workouts")
      const data = await response.json()

      const activeWorkout = data.workouts?.find((w: Workout) => w.isActive)

      if (activeWorkout) {
        setCurrentWorkout(activeWorkout)

        // Initialize exercise state
        const initialState: ExerciseState = {}
        activeWorkout.workoutJson?.splits?.forEach((split: any) => {
          split.exercises?.forEach((exercise: any) => {
            initialState[exercise.main] = exercise.completed || false
          })
        })
        setExerciseState(initialState)
      }
    } catch (error) {
      console.error("Error fetching current workout:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExercise = (exerciseName: string) => {
    setExerciseState(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }))
  }

  const saveProgress = async () => {
    if (!currentWorkout) return

    setIsSaving(true)
    try {
      const totalExercises = Object.keys(exerciseState).length
      const completedExercises = Object.values(exerciseState).filter(Boolean).length
      const percentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

      // Update workoutJson with current state
      const updatedWorkoutJson = { ...currentWorkout.workoutJson }
      updatedWorkoutJson.splits.forEach(split => {
        split.exercises.forEach(exercise => {
          exercise.completed = exerciseState[exercise.main] || false
        })
      })

      const response = await fetch(`/api/workouts/${currentWorkout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completionPercentage: percentage,
          workoutJson: updatedWorkoutJson
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar progresso")
      }

      setCurrentWorkout(prev => prev ? {
        ...prev,
        completionPercentage: percentage,
        workoutJson: updatedWorkoutJson
      } : null)

      toast({
        title: "Progresso salvo",
        description: "Seu progresso foi salvo com sucesso.",
      })
    } catch (error) {
      console.error("Error saving progress:", error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o progresso.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const finishCycle = async () => {
    if (!currentWorkout) return

    setIsFinishingCycle(true)
    try {
      const newCycleCount = (currentWorkout.cyclesCompleted || 0) + 1

      // Prepare reset workout JSON
      const resetWorkoutJson = { ...currentWorkout.workoutJson }
      resetWorkoutJson.splits.forEach((split: any) => {
        split.exercises?.forEach((exercise: any) => {
          exercise.completed = false
        })
      })

      const response = await fetch(`/api/workouts/${currentWorkout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completionPercentage: 0,
          cyclesCompleted: newCycleCount,
          workoutJson: resetWorkoutJson
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao concluir ciclo")
      }

      // Reset local state
      const initialState: ExerciseState = {}
      resetWorkoutJson.splits.forEach((split: any) => {
        split.exercises?.forEach((exercise: any) => {
          initialState[exercise.main] = false
        })
      })
      setExerciseState(initialState)

      setCurrentWorkout(prev => prev ? {
        ...prev,
        completionPercentage: 0,
        cyclesCompleted: newCycleCount,
        workoutJson: resetWorkoutJson
      } : null)

      toast({
        title: "Ciclo concluído!",
        description: `Ciclo ${newCycleCount} iniciado! Bom treino!`,
        className: "bg-green-500 text-white border-none",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao concluir o ciclo.",
        variant: "destructive",
      })
    } finally {
      setIsFinishingCycle(false)
    }
  }

  const calculateProgress = () => {
    const totalExercises = Object.keys(exerciseState).length
    const completedExercises = Object.values(exerciseState).filter(Boolean).length
    return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
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

  if (!currentWorkout) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Nenhum Treino Ativo</CardTitle>
            <CardDescription>
              Você não tem um treino ativo no momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/workout/create">
              <Button>
                Criar Novo Treino
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = calculateProgress()
  const splits = currentWorkout.workoutJson?.splits || []

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{currentWorkout.name}</h1>
            <p className="text-muted-foreground">
              Treino ativo • Ciclo {(currentWorkout.cyclesCompleted || 0) + 1} • {Math.round(progress)}% completo
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso Total</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {Object.values(exerciseState).filter(Boolean).length} de {Object.keys(exerciseState).length} exercícios concluídos
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveProgress} disabled={isSaving || isFinishingCycle} className="flex-1">
                {isSaving ? (
                  "Salvando..."
                ) : (
                  "Salvar Progresso"
                )}
              </Button>

              {progress === 100 && (
                <Button
                  onClick={finishCycle}
                  disabled={isFinishingCycle}
                  variant="secondary"
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                >
                  {isFinishingCycle ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reiniciando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Concluir Ciclo
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={splits[0]?.name} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
            {splits.map((split, index) => (
              <TabsTrigger
                key={index}
                value={split.name}
                className="flex-1 min-w-[80px]"
              >
                Treino {split.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {splits.map((split, splitIndex) => (
            <TabsContent key={splitIndex} value={split.name}>
              <Card>
                <CardHeader>
                  <CardTitle>Treino {split.name}</CardTitle>
                  <CardDescription>
                    {split.exercises?.length || 0} exercícios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {split.exercises?.map((exercise, exerciseIndex) => (
                      <div
                        key={exerciseIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${exerciseState[exercise.main]
                          ? 'bg-green-50 border-green-200'
                          : 'bg-muted/50'
                          }`}
                      >
                        <Checkbox
                          id={`${split.name}-${exercise.main}`}
                          checked={exerciseState[exercise.main] || false}
                          onCheckedChange={() => toggleExercise(exercise.main)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between w-full">
                            <label
                              htmlFor={`${split.name}-${exercise.main}`}
                              className={`font-medium cursor-pointer flex items-center gap-2 ${exerciseState[exercise.main] ? 'text-green-700 line-through' : ''
                                }`}
                            >
                              {exerciseState[exercise.main] && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              {exercise.main}
                            </label>
                            <div className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded border ml-2 whitespace-nowrap">
                              {exercise.sets} x {exercise.reps}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Alternativas:</p>
                            <ul className="list-disc list-inside ml-2">
                              {exercise.substitutions?.map((sub, subIndex) => (
                                <li key={subIndex}>{sub}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}