import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: workouts, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const formattedWorkouts = workouts?.map(workout => ({
      id: workout.id,
      name: workout.name,
      workoutJson: workout.workout_json,
      completionPercentage: workout.completion_percentage,
      isActive: workout.is_active,
      createdAt: workout.created_at,
      cyclesCompleted: workout.cycles_completed || 0,
    })) || []

    return NextResponse.json({ workouts: formattedWorkouts })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
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

    const { name, workoutJson, durationDays, expirationDate } = await request.json()

    if (!name || !workoutJson) {
      return NextResponse.json(
        { error: "Name and workout data are required" },
        { status: 400 }
      )
    }

    // Desativar todos os outros treinos do usuário
    await supabaseAdmin
      .from('workouts')
      .update({ is_active: false })
      .eq('user_id', session.user.id)

    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: session.user.id,
        name,
        workout_json: workoutJson,
        is_active: true,
        completion_percentage: 0,
        duration_days: durationDays || null,
        expiration_date: expirationDate || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}