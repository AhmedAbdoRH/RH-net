import type { SupabaseClient, User } from '@supabase/supabase-js'

const USERS_PER_PAGE = 1000

export async function listAllAuthUsers(supabaseAdmin: SupabaseClient): Promise<User[]> {
  const users: User[] = []
  let page = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE
    })

    if (error) throw error

    const pageUsers = data.users || []
    users.push(...pageUsers)

    if (pageUsers.length < USERS_PER_PAGE) break
    page += 1
  }

  return users.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}

export async function listAllAuthUsersResponse(supabaseAdmin: SupabaseClient) {
  try {
    const users = await listAllAuthUsers(supabaseAdmin)
    return { data: { users }, error: null }
  } catch (error) {
    return { data: { users: [] as User[] }, error }
  }
}
