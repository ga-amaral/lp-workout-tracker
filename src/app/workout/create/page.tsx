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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Loader2, Dumbbell, CheckCircle, Upload, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null)
  const [workoutName, setWorkoutName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form data
  const [gender, setGender] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [splitType, setSplitType] = useState("")
  const [sessionDuration, setSessionDuration] = useState("")
  const [level, setLevel] = useState("")
  const [frequency, setFrequency] = useState("")

  // Mapa de splits para número de divisões
  const splitMap: { [key: string]: number } = {
    "Full Body": 1,
    "Upper/Lower": 2,
    "Push/Pull/Legs": 3,
    "Push/Pull/Legs/Upper/Lower": 5,
    "ABC Split": 3,
    "ABCD Split": 4,
    "ABCDE Split": 5
  }

  // Determinar automaticamente o número de divisões baseado no split
  const splitsCount = splitType ? splitMap[splitType] : 0
  const [durationDays, setDurationDays] = useState("")
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

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
          weight: parseInt(weight),
          splitType,
          sessionDuration,
          level,
          frequency,
          splitsCount
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



  return (
    <>
      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer && !disclaimerAccepted} onOpenChange={() => { }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              DISCLAIMER IMPORTANTE
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-4 text-sm">
            <p>
              Os treinos gerados nesta plataforma foram desenvolvidos através de inteligência artificial com base em parâmetros e dados fornecidos por você. Embora os programas sejam fundamentados em princípios científicos de treinamento, <strong>não substituem a orientação personalizada de um profissional qualificado</strong>.
            </p>

            <div className="space-y-2">
              <p className="font-semibold">Recomendamos fortemente que:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Você consulte um educador físico, personal trainer ou fisiologista do exercício antes de iniciar qualquer programa de treinamento</li>
                <li>Um profissional avalie sua forma de execução dos movimentos para evitar lesões</li>
                <li>Você tenha acompanhamento regular para ajustes conforme sua evolução</li>
                <li>Em caso de dor, desconforto ou lesão, procure um médico ou fisioterapeuta imediatamente</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Responsabilidade:</p>
              <p>
                A plataforma <strong>não se responsabiliza</strong> por lesões, mal-estar ou qualquer consequência decorrente do uso inadequado dos treinos. O uso desta ferramenta é <strong>por sua conta e risco</strong>, sob total responsabilidade do usuário.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Condições médicas:</p>
              <p>
                Se você possui histórico de lesões, cirurgias, doenças crônicas ou qualquer condição médica, <strong>consulte um médico antes de iniciar o treinamento</strong>.
              </p>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={() => {
                setDisclaimerAccepted(true)
                setShowDisclaimer(false)
              }}
              className="w-full"
            >
              Li e Aceito os Termos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto p-4 max-w-4xl">
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
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!gender || !height || !weight}
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
                    <Label htmlFor="splitType">Tipo de Split</Label>
                    <Select value={splitType} onValueChange={setSplitType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Body">Full Body (1 treino)</SelectItem>
                        <SelectItem value="Upper/Lower">Upper/Lower (2 treinos)</SelectItem>
                        <SelectItem value="Push/Pull/Legs">Push/Pull/Legs (3 treinos)</SelectItem>
                        <SelectItem value="Push/Pull/Legs/Upper/Lower">Push/Pull/Legs/Upper/Lower (5 treinos)</SelectItem>
                        <SelectItem value="ABC Split">ABC Split (3 treinos)</SelectItem>
                        <SelectItem value="ABCD Split">ABCD Split (4 treinos)</SelectItem>
                        <SelectItem value="ABCDE Split">ABCDE Split (5 treinos)</SelectItem>
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
                        <SelectItem value="90min">90 minutos</SelectItem>
                        <SelectItem value="120min">120 minutos</SelectItem>
                        <SelectItem value="150min">150 minutos</SelectItem>
                        <SelectItem value="180min">180 minutos</SelectItem>
                        <SelectItem value="210min">210 minutos</SelectItem>
                        <SelectItem value="240min">240 minutos</SelectItem>
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
                        <SelectItem value="Básico (0-6 meses)">Básico (0-6 meses)</SelectItem>
                        <SelectItem value="Intermediário (6-24 meses)">Intermediário (6-24 meses)</SelectItem>
                        <SelectItem value="Avançado (2+ anos)">Avançado (2+ anos)</SelectItem>
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
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 w-full">
                    Voltar
                  </Button>
                  <Button
                    onClick={generateWorkout}
                    className="flex-1 w-full"
                    disabled={!splitType || !sessionDuration || !level || !frequency || isLoading}
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
    </>
  )
}