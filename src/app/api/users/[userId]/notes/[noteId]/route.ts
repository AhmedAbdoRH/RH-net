import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export async function DELETE(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const noteId = params.noteId
    
    if (!noteId) {
      return NextResponse.json(
        { error: 'معرف الملاحظة مطلوب' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
      .from('user_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json(
        { error: 'فشل في حذف الملاحظة' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الملاحظة بنجاح' 
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}