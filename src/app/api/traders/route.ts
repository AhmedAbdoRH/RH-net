import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = 'https://ikelmblsikapgbxbpebz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZWxtYmxzaWthcGdieGJwZWJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMzNDg4MiwiZXhwIjoyMDc4OTEwODgyfQ.0zTJzPRsBvYzwNQeP6ZgpwVkzvG11yz1tD6upX35zSQ'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface TraderData {
  userId: string
  productCount: number
  type: 'خامل' | 'مبتدئ' | 'نشط' | 'سوبر'
}

export async function GET() {
  try {
    // جلب جميع المستخدمين
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError || !usersData.users) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'فشل في جلب بيانات المستخدمين' },
        { status: 500 }
      )
    }

    // الطريقة الصحيحة: جلب الكتالوجات والمنتجات المرتبطة بها
    console.log('🔍 Fetching catalogs and menu_items...')
    
    // 1. جلب جميع الكتالوجات مع معلومات المستخدم
    const { data: catalogsData, error: catalogsError } = await supabaseAdmin
      .from('catalogs')
      .select('id, user_id')
    
    if (catalogsError) {
      console.error('❌ Error fetching catalogs:', catalogsError.message)
      return NextResponse.json(
        { error: 'فشل في جلب بيانات الكتالوجات' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Found ${catalogsData?.length || 0} catalogs`)
    
    // 2. جلب جميع المنتجات (menu_items) مع catalog_id
    const { data: menuItemsData, error: menuItemsError } = await supabaseAdmin
      .from('menu_items')
      .select('id, catalog_id')
    
    if (menuItemsError) {
      console.error('❌ Error fetching menu_items:', menuItemsError.message)
      return NextResponse.json(
        { error: 'فشل في جلب بيانات المنتجات' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Found ${menuItemsData?.length || 0} menu items`)
    
    // 3. ربط المنتجات بالمستخدمين عبر الكتالوجات
    // أنشئ map من catalog_id إلى user_id
    const catalogToUser: { [catalogId: string]: string } = {}
    catalogsData?.forEach(catalog => {
      catalogToUser[catalog.id] = catalog.user_id
    })
    
    // عد عدد المنتجات لكل مستخدم
    const productCounts: { [userId: string]: number } = {}
    menuItemsData?.forEach(item => {
      const userId = catalogToUser[item.catalog_id]
      if (userId) {
        productCounts[userId] = (productCounts[userId] || 0) + 1
      }
    })
    
    console.log(`\n📊 Summary: ${catalogsData?.length || 0} catalogs, ${menuItemsData?.length || 0} menu items`)
    console.log(`Users with products: ${Object.keys(productCounts).length}`)
    console.log(`✅ Total products counted: ${menuItemsData?.length || 0}`)

    // تصنيف التجار
    const traders: TraderData[] = []
    
    usersData.users.forEach(user => {
      const count = productCounts[user.id] || 0
      let type: 'خامل' | 'مبتدئ' | 'نشط' | 'سوبر'
      
      if (count === 0) {
        type = 'خامل'
      } else if (count >= 30) {
        type = 'سوبر'
      } else if (count > 3) {
        type = 'نشط'
      } else {
        type = 'مبتدئ'
      }

      traders.push({
        userId: user.id,
        productCount: count,
        type
      })
    })

    // حساب الإحصائيات
    const stats = {
      خامل: 0,
      مبتدئ: 0,
      نشط: 0,
      سوبر: 0
    }

    traders.forEach(trader => {
      stats[trader.type]++
    })

    const total = traders.length
    const percentages = {
      خامل: total > 0 ? Math.round((stats.خامل / total) * 100) : 0,
      مبتدئ: total > 0 ? Math.round((stats.مبتدئ / total) * 100) : 0,
      نشط: total > 0 ? Math.round((stats.نشط / total) * 100) : 0,
      سوبر: total > 0 ? Math.round((stats.سوبر / total) * 100) : 0
    }

    console.log('Traders stats:', { totalTraders: traders.length, stats, percentages })

    return NextResponse.json({ 
      traders,
      stats,
      percentages,
      totalTraders: traders.length,
      totalProducts: menuItemsData?.length || 0
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
