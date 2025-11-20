import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Testar conexão básica
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return Response.json({ 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('Supabase connection successful!')
    
    return Response.json({ 
      success: true,
      message: 'Supabase connection working',
      data: data
    })
  } catch (error) {
    console.error('Test error:', error)
    return Response.json({ 
      error: 'Connection failed',
      details: error
    }, { status: 500 })
  }
}