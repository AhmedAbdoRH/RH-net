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
      // إذا كان الجدول غير موجود، نرجع مصفوفة فارغة بدلاً من خطأ
      if (error.code === '42P01') { // relation does not exist
        console.warn('Table user_notes does not exist, returning empty array')
        return NextResponse.json({ notes: [] })
      }
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
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 2] // userId is before /notes
    const { note } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    if (!note || note.trim() === '') {
      return NextResponse.json(
        { error: 'الملاحظة مطلوبة ولا يمكن أن تكون فارغة' },
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
      // إذا كان الجدول غير موجود، نحاول إنشاءه
      if (error.code === '42P01') { // relation does not exist
        console.warn('Table user_notes does not exist, attempting to create it')
        // نرجع خطأن واضح للمستخدم
        return NextResponse.json(
          { error: 'جدول الملاحظات غير موجود في قاعدة البيانات. يرجى إنشاء الجدول user_notes أولاً.' },
          { status: 500 }
        )
      }
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

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 2] // userId is before /notes

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
      .from('user_notes')
      .delete()
      .eq('user_id', userId)

    if (error) {
      // إذا كان الجدول غير موجود، نعتبره نجاح (لا شيء لحذفه)
      if (error.code === '42P01') { // relation does not exist
        console.warn('Table user_notes does not exist, nothing to delete')
        return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' })
      }
      console.error('Error deleting notes:', error)
      return NextResponse.json(
        { error: 'فشل في حذف الملاحظات' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الملاحظات بنجاح'
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}