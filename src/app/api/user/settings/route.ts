import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import CryptoJS from 'crypto-js'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, selected_model, openai_key')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Não enviar a chave criptografada para o frontend
    const { openai_key, ...userWithoutKey } = user
    const hasOpenAIKey = !!openai_key

    return NextResponse.json({
      user: { ...userWithoutKey, hasOpenAIKey }
    })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { openaiKey } = await request.json()

    if (!openaiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      )
    }

    // Criptografar a chave API
    const encryptedKey = CryptoJS.AES.encrypt(openaiKey, process.env.ENCRYPTION_KEY!).toString()

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ openai_key: encryptedKey })
      .eq('id', session.user.id)
      .select('id, email, name')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ openai_key: null })
      .eq('id', session.user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}