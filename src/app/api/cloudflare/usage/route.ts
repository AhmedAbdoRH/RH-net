import { cloudflareUsageResponse } from '@/lib/cloudflare-usage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return cloudflareUsageResponse();
}
