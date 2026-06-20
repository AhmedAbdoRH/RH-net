import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin
      .from('user_notes')
      .select('id, note, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user notes:', error)
      return NextResponse.json(
        { error: 'فشل في جلب الملاحظات' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: data || [] })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId, note } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    if (!note || note.trim() === '') {
      return NextResponse.json(
        { error: 'النote مطلوب且不能为空' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin
      .from('user_notes')
      .insert([
        {
          user_id: userId,
          note: note.trim(),
        }
      ])
      .select()

    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json(
        { error: 'فشل في إنشاء الملاحظة' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم إنشاء الملاحظة بنجاح',
      note: data[0]
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}