import { supabase } from '@/lib/supabase'

export interface UserProduct {
  userId: string
  productCount: number
  type: 'خامل' | 'مبتدئ' | 'نشط' | 'قوي' | 'سوبر'
}

export const getProductCounts = async (): Promise<UserProduct[]> => {
  try {
    // جلب جميع المستخدمين
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')

    if (usersError) throw usersError

    // جلب جميع المنتجات
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('user_id')

    if (productsError) throw productsError

    // عد عدد المنتجات لكل مستخدم
    const productCounts: { [key: string]: number } = {}
    
    if (products) {
      products.forEach(product => {
        const userId = product.user_id
        productCounts[userId] = (productCounts[userId] || 0) + 1
      })
    }

    // تصنيف التجار - شامل جميع المستخدمين
    const traders: UserProduct[] = []
    
    if (users) {
      users.forEach(user => {
        const count = productCounts[user.id] || 0
        let type: 'خامل' | 'مبتدئ' | 'نشط' | 'قوي' | 'سوبر'
        
        if (count === 0) {
          type = 'خامل'
        } else if (count >= 48) {
          type = 'سوبر'
        } else if (count > 20) {
          type = 'قوي'
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
    }

    return traders
  } catch (error) {
    console.error('Error fetching product counts:', error)
    return []
  }
}

export const getTraderStats = async (products: UserProduct[]) => {
  const stats = {
    خامل: 0,
    مبتدئ: 0,
    نشط: 0,
    قوي: 0,
    سوبر: 0
  }

  products.forEach(p => {
    stats[p.type]++
  })

  const total = products.length
  return {
    stats,
    percentages: {
      خامل: total > 0 ? Math.round((stats.خامل / total) * 100) : 0,
      مبتدئ: total > 0 ? Math.round((stats.مبتدئ / total) * 100) : 0,
      نشط: total > 0 ? Math.round((stats.نشط / total) * 100) : 0,
      قوي: total > 0 ? Math.round((stats.قوي / total) * 100) : 0,
      سوبر: total > 0 ? Math.round((stats.سوبر / total) * 100) : 0
    }
  }
}
