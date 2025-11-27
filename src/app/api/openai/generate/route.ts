/**
 * OpenAI Workout Generation API
 * @author Gabriel Amaral (https://www.instagram.com/sougabrielamaral/) - 2025-11-27
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import OpenAI from 'openai'

interface WorkoutFormData {
  gender: string
  height: number
  trainingType: string
  sessionDuration: string
  level: string
  frequency: string
  splitsCount: number
  currentWorkout?: any
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData: WorkoutFormData = await request.json()

    // Verificar se a chave OpenAI está configurada no servidor
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não configurada no servidor")
      return NextResponse.json(
        { error: "Serviço de IA temporariamente indisponível" },
        { status: 503 }
      )
    }

    // Calculate recommended number of exercises based on duration
    const durationMap: { [key: string]: number } = {
      '30min': 3,
      '45min': 5,
      '60min': 7,
      '75min': 8,
      '90min+': 10
    }
    const recommendedExercises = durationMap[formData.sessionDuration] || 5

    // Create OpenAI prompt
    const basePrompt = `Crie um plano de treino personalizado e COMPLETO baseado nas seguintes informações:
- Sexo: ${formData.gender}
- Altura: ${formData.height}cm
- Tipo de treinamento: ${formData.trainingType}
- Duração por sessão: ${formData.sessionDuration}
- Nível: ${formData.level}
- Frequência semanal: ${formData.frequency}
- Número de divisões/treinos: ${formData.splitsCount}

${formData.currentWorkout ? `Baseado no treino atual: ${JSON.stringify(formData.currentWorkout)}, gere uma versão atualizada com as novas preferências.` : ''}

Retorne APENAS um JSON no seguinte formato:
{
  "splits": [
    {
      "name": "A",
      "exercises": [
        {
          "main": "Nome do exercício principal",
          "sets": "3",
          "reps": "12",
          "substitutions": ["Substituto 1", "Substituto 2", "Substituto 3"]
        }
      ]
    }
  ]
}

REGRAS IMPORTANTES:
1. QUANTIDADE DE EXERCÍCIOS: Para ${formData.sessionDuration}, gere EXATAMENTE ${recommendedExercises} exercícios por divisão (aproximadamente 9 minutos por exercício)
2. VARIEDADE: Inclua diferentes grupos musculares e tipos de exercícios (compostos e isolados)
3. ORDEM LÓGICA: Comece com exercícios compostos e termine com isolados
4. PROGRESSÃO: Organize do mais pesado/complexo para o mais leve/simples
5. SÉRIES E REPETIÇÕES: Ajuste para o objetivo:
   - Hipertrofia: 3-4 séries de 8-12 repetições
   - Força: 4-5 séries de 3-6 repetições
   - Resistência: 2-3 séries de 15-20 repetições
   - Perda de peso: 3 séries de 12-15 repetições
6. SUBSTITUIÇÕES: Forneça SEMPRE 3 substituições realistas e equivalentes para cada exercício
7. EQUILÍBRIO: Distribua igualmente entre muscle groups principais (peito, costas, pernas, ombros, braços)
8. SEGURANÇA: Respeite o nível do praticante (básico = exercícios mais simples, avançado = exercícios mais técnicos)
9. AQUECIMENTO: O primeiro exercício de cada divisão deve ser mais leve/preparatório
10. COMPLETUDE: Cada divisão deve ser um treino completo e balanceado
11. NOMENCLATURA: Nos nomes dos treinos coloque apenas o nome do treino, como Treino A, Treino B, etc. **Não coloque nada além disso**

IMPORTANTE: NÃO seja minimalista! Gere um treino COMPLETO com a quantidade EXATA de exercícios especificada (${recommendedExercises} exercícios por divisão).`

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em educação física e musculação. Crie planos de treino seguros e eficazes.'
        },
        {
          role: 'user',
          content: basePrompt
        }
      ],
      model: "gpt-4.1-nano", // Modelo fixo - GPT-4.1 nano
      response_format: { type: "json_object" }
    })

    const messageContent = completion.choices[0]?.message?.content

    if (!messageContent) {
      return NextResponse.json(
        { error: "Failed to generate workout" },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let workoutData
    try {
      workoutData = JSON.parse(messageContent)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      return NextResponse.json(
        { error: "Failed to parse workout data" },
        { status: 500 }
      )
    }

    return NextResponse.json({ workout: workoutData })
  } catch (error: any) {
    console.error("Error generating workout:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}