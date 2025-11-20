import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    const formattedWorkout = {
      id: workout.id,
      name: workout.name,
      workoutJson: workout.workout_json,
      completionPercentage: workout.completion_percentage,
      isActive: workout.is_active,
      createdAt: workout.created_at,
      cyclesCompleted: workout.cycles_completed || 0,
      durationDays: workout.duration_days,
    }

    return NextResponse.json({ workout: formattedWorkout })
  } catch (error) {
    console.error("Error fetching workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { completionPercentage, isActive, cyclesCompleted, workoutJson } = await request.json()

    const updateData: any = {}
    if (completionPercentage !== undefined) {
      updateData.completion_percentage = completionPercentage
    }
    if (isActive !== undefined) {
      updateData.is_active = isActive
    }
    if (cyclesCompleted !== undefined) {
      updateData.cycles_completed = cyclesCompleted
    }
    if (workoutJson !== undefined) {
      updateData.workout_json = workoutJson
    }

    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { error } = await supabaseAdmin
      .from('workouts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}