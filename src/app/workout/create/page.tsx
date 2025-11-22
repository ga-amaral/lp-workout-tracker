"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Dumbbell, CheckCircle, Upload } from "lucide-react"

interface WorkoutData {
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

export default function CreateWorkout() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null)
  const [workoutName, setWorkoutName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form data
  const [gender, setGender] = useState("")
  const [height, setHeight] = useState("")
  const [trainingType, setTrainingType] = useState("")
  const [sessionDuration, setSessionDuration] = useState("")
  const [level, setLevel] = useState("")
  const [frequency, setFrequency] = useState("")
  const [splitsCount, setSplitsCount] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    } else {
      checkUserSettings()
    }
  }, [session, status, router])

  const checkUserSettings = async () => {
    try {
      const response = await fetch("/api/user/settings")
      const data = await response.json()
      setHasOpenAIKey(data.user.hasOpenAIKey)
    } catch (error) {
      console.error("Error checking settings:", error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = JSON.parse(content)

        // Basic validation
        if (!parsedData.splits || !Array.isArray(parsedData.splits)) {
          throw new Error("Formato de arquivo inválido: 'splits' não encontrado ou inválido")
        }

        setWorkoutData(parsedData)
        setStep(3)
      } catch (error) {
        console.error("Error parsing JSON:", error)
        alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido com a estrutura correta.")
      }
    }
    reader.readAsText(file)
  }

  const generateWorkout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/openai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gender,
          height: parseInt(height),
          trainingType,
          sessionDuration,
          level,
          frequency,
          splitsCount: parseInt(splitsCount),
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar treino")
      }

      setWorkoutData(data.workout)
      setStep(3)
    } catch (error) {
      console.error("Error generating workout:", error)
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao gerar o treino")
    } finally {
      setIsLoading(false)
    }
  }

  const saveWorkout = async () => {
    if (!workoutData || !workoutName.trim()) {
      alert("Por favor, dê um nome ao seu treino")
      return
    }

    if (!durationDays || parseInt(durationDays) <= 0) {
      alert("Por favor, especifique por quantos dias você usará este treino")
      return
    }

    setIsLoading(true)
    try {
      // Calculate expiration date
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + parseInt(durationDays))

      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workoutName,
          workoutJson: workoutData,
          durationDays: parseInt(durationDays),
          expirationDate: expirationDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error("Erro ao salvar treino")
      }

      router.push(`/workout/${data.workout.id}`)
    } catch (error) {
      console.error("Error saving workout:", error)
      alert("Ocorreu um erro ao salvar o treino")
    } finally {
      setIsLoading(false)
    }
  }

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

  if (!hasOpenAIKey) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configure a OpenAI Primeiros</CardTitle>
            <CardDescription>
              Você precisa configurar sua chave API da OpenAI para gerar treinos personalizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button>
                Configurar OpenAI
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1 w-full md:w-auto">
            <h1 className="text-3xl font-bold">Criar Novo Treino</h1>
            <p className="text-muted-foreground">
              Passo {step} de 3: {step === 1 ? "Informações Pessoais" : step === 2 ? "Preferências de Treino" : "Revisar e Salvar"}
            </p>
          </div>
          {step === 1 && (
            <div className="w-full md:w-auto">
              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Importar JSON
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Conte-nos sobre você para criarmos o treino perfeito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!gender || !height}
              >
                Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Treino</CardTitle>
              <CardDescription>
                Como você prefere treinar?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingType">Tipo de Treinamento</Label>
                  <Select value={trainingType} onValueChange={setTrainingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perda de peso">Perda de Peso</SelectItem>
                      <SelectItem value="ganho de massa muscular">Ganho de Massa Muscular</SelectItem>
                      <SelectItem value="manutenção">Manutenção</SelectItem>
                      <SelectItem value="força">Força</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration">Duração por Sessão</Label>
                  <Select value={sessionDuration} onValueChange={setSessionDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30min">30 minutos</SelectItem>
                      <SelectItem value="45min">45 minutos</SelectItem>
                      <SelectItem value="60min">60 minutos</SelectItem>
                      <SelectItem value="75min">75 minutos</SelectItem>
                      <SelectItem value="90min+">90+ minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Nível de Treino</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="básico">Básico</SelectItem>
                      <SelectItem value="intermediário">Intermediário</SelectItem>
                      <SelectItem value="avançado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência Semanal</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 dias">3 dias</SelectItem>
                      <SelectItem value="4 dias">4 dias</SelectItem>
                      <SelectItem value="5 dias+">5+ dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="splitsCount">Número de Divisões</Label>
                  <Select value={splitsCount} onValueChange={setSplitsCount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 divisões (A/B)</SelectItem>
                      <SelectItem value="3">3 divisões (A/B/C)</SelectItem>
                      <SelectItem value="4">4 divisões (A/B/C/D)</SelectItem>
                      <SelectItem value="5">5 divisões (A/B/C/D/E)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="model">Modelo GPT</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido e econômico)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Mais avançado)</SelectItem>
                      <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano (Econômico)</SelectItem>
                      <SelectItem value="o1-preview">o1-preview (Raciocínio avançado)</SelectItem>
                      <SelectItem value="o1-mini">o1-mini (Raciocínio rápido)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelos da série o1 são ótimos para raciocínio complexo. GPT-4o é o melhor geral.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 w-full">
                  Voltar
                </Button>
                <Button
                  onClick={generateWorkout}
                  className="flex-1 w-full"
                  disabled={!trainingType || !sessionDuration || !level || !frequency || !splitsCount || !selectedModel || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Treino"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && workoutData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Seu Treino Personalizado
              </CardTitle>
              <CardDescription>
                Revise seu treino gerado pela IA e salve-o
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workoutName">Nome do Treino</Label>
                  <Input
                    id="workoutName"
                    placeholder="Meu treino personalizado"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Duração do Ciclo (dias)</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    placeholder="Ex: 30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Por quantos dias você usará este treino antes de precisar de um novo?
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {workoutData.splits.map((split, splitIndex) => (
                  <div key={splitIndex} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Treino {split.name}</h3>
                    <div className="space-y-3">
                      {split.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="bg-muted/50 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="font-medium">{exercise.main}</span>
                            </div>
                            <div className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              {exercise.sets} x {exercise.reps}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Substitutos:</p>
                            <ul className="list-disc list-inside ml-2">
                              {exercise.substitutions?.map((sub, subIndex) => (
                                <li key={subIndex}>{sub}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 w-full">
                  Gerar Novamente
                </Button>
                <Button
                  onClick={saveWorkout}
                  className="flex-1 w-full"
                  disabled={!workoutName.trim() || !durationDays || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Treino"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}