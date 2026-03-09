'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, Calendar, Mail } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: any
}

export default function UserFooter() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // استخدام API endpoint لجلب بيانات المستخدمين
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المستخدمين')
      }
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <footer className="bg-gray-900 text-white py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            معلومات المستخدمين المسجلين
          </h3>
          
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="mt-2">جاري تحميل بيانات المستخدمين...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">إجمالي المستخدمين</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{users.length}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">آخر مستخدم مسجل</span>
                </div>
                <p className="text-sm text-gray-300">
                  {users.length > 0 ? formatDate(users[0].created_at) : 'لا يوجد مستخدمون'}
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">المستخدمين النشطين</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{users.length}</p>
              </div>
            </div>
          )}
        </div>

        {!loading && !error && users.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">آخر المستخدمين المسجلين</h4>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-right">البريد الإلكتروني</th>
                      <th className="px-4 py-3 text-right">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user, index) => (
                      <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length > 5 && (
                <div className="px-4 py-3 bg-gray-700 text-center text-sm text-gray-300">
                  و {users.length - 5} مستخدمين آخرين...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          <p>© 2026 جميع الحقوق محفوظة | تم التحديث: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
    </footer>
  )
}
