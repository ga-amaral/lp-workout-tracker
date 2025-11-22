import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import OpenAI from 'openai'
import CryptoJS from 'crypto-js'

interface WorkoutFormData {
  gender: string
  height: number
  trainingType: string
  sessionDuration: string
  level: string
  frequency: string
  splitsCount: number
  model: string
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

    if (!formData.model) {
      return NextResponse.json(
        { error: "Model selection is required" },
        { status: 400 }
      )
    }

    // Get user's OpenAI key
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('openai_key')
      .eq('id', session.user.id)
      .single()

    if (error || !user?.openai_key) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 400 }
      )
    }

    if (!process.env.ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Internal Server Error: ENCRYPTION_KEY not configured" },
        { status: 500 }
      )
    }

    // Decrypt the OpenAI key
    let decryptedKey;
    try {
      decryptedKey = CryptoJS.AES.decrypt(user.openai_key, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)
    } catch (e) {
      console.error("Decryption error:", e)
      return NextResponse.json(
        { error: "Erro ao descriptografar chave. Por favor, configure sua API Key novamente nas configurações." },
        { status: 400 }
      )
    }

    if (!decryptedKey) {
      return NextResponse.json(
        { error: "Chave API inválida ou corrompida. Por favor, configure novamente." },
        { status: 400 }
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

IMPORTANTE: NÃO seja minimalista! Gere um treino COMPLETO com a quantidade EXATA de exercícios especificada (${recommendedExercises} exercícios por divisão).`

    const openai = new OpenAI({
      apiKey: decryptedKey,
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
      model: formData.model,
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