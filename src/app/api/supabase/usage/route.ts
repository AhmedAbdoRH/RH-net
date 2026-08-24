import { supabaseUsageResponse } from '@/lib/supabase-usage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return supabaseUsageResponse();
}
