import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const DATABASE_LIMIT_BYTES = 500 * 1024 * 1024;
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

type UsageMetrics = {
  database_bytes: number | string | null;
  storage_bytes: number | string | null;
  storage_files: number | string | null;
  total_users: number | string | null;
};

const asNumber = (value: number | string | null | undefined) => Number(value ?? 0);

export async function getSupabaseUsage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('get_usage_metrics');

  if (error) throw new Error(error.message);

  const metrics = (data?.[0] ?? {}) as UsageMetrics;
  return {
    plan: 'free',
    databaseBytes: asNumber(metrics.database_bytes),
    databaseLimitBytes: DATABASE_LIMIT_BYTES,
    storageBytes: asNumber(metrics.storage_bytes),
    storageLimitBytes: STORAGE_LIMIT_BYTES,
    storageFiles: asNumber(metrics.storage_files),
    totalUsers: asNumber(metrics.total_users),
    updatedAt: new Date().toISOString(),
  };
}

export async function supabaseUsageResponse() {
  try {
    return NextResponse.json(await getSupabaseUsage(), {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load Supabase usage' },
      { status: 503 },
    );
  }
}
