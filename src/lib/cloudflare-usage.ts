import { NextResponse } from 'next/server';

const CF_API = 'https://api.cloudflare.com/client/v4';
const DAILY_REQUEST_LIMIT = 100_000;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;

type CloudflareResponse<T> = { success: boolean; result: T; errors?: { code: number; message: string }[] };

async function cfRequest<T>(path: string): Promise<T> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) throw new Error('Cloudflare monitoring is not configured');
  const response = await fetch(`${CF_API}${path.replace('{account_id}', accountId)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  });
  const payload = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !payload.success) throw new Error(payload.errors?.[0]?.message || `Cloudflare API ${response.status}`);
  return payload.result;
}

async function queryWorkersUsage(start: string, end: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountTag) throw new Error('Cloudflare monitoring is not configured');
  const query = `query WorkersUsage($accountTag: string!, $start: Time!, $end: Time!) {
    viewer { accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsAdaptive(limit: 10000, filter: { datetime_geq: $start, datetime_leq: $end }) {
        dimensions { datetimeHour scriptName status }
        sum { requests cpuTimeUs subrequests errors }
      }
      pagesFunctionsInvocationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $start, datetime_leq: $end }) {
        dimensions { datetimeHour scriptName }
        sum { requests subrequests }
      }
    }}
  }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { accountTag, start, end } }),
    next: { revalidate: 300 },
  });
  const payload = await response.json() as { data?: any; errors?: { message: string }[] };
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Cloudflare GraphQL ${response.status}`);
  const account = payload.data?.viewer?.accounts?.[0];
  return {
    workers: account?.workersInvocationsAdaptive || [],
    pagesFunctions: account?.pagesFunctionsInvocationsAdaptiveGroups || [],
  };
}

function monthStart(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }

export async function getCloudflareUsage() {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const resetAt = new Date(dayStart.getTime() + UTC_DAY_MS);
  const usageRows = await queryWorkersUsage(dayStart.toISOString(), now.toISOString());
  const monthStartDate = monthStart(now);
  const monthRows = await queryWorkersUsage(monthStartDate.toISOString(), now.toISOString());
  const workerMap = new Map<string, { requests: number; cpuTime: number; subrequests: number; exceededResources: number; errors: number }>();
  for (const row of usageRows.workers) {
    const name = row.dimensions?.scriptName || 'unknown';
    const status = row.dimensions?.status;
    const current = workerMap.get(name) || { requests: 0, cpuTime: 0, subrequests: 0, exceededResources: 0, errors: 0 };
    current.requests += Number(row.sum?.requests || 0);
    current.cpuTime += Number(row.sum?.cpuTimeUs || 0) / 1000;
    current.subrequests += Number(row.sum?.subrequests || 0);
    if (status === 'exceededResources') {
      current.exceededResources += Number(row.sum?.requests || 0);
    }
    current.errors += Number(row.sum?.errors || 0);
    workerMap.set(name, current);
  }
  let pagesFunctionsRequests = 0;
  let workersCpuTimeMs = 0;
  let workersSubrequests = 0;
  for (const row of usageRows.pagesFunctions) {
    pagesFunctionsRequests += Number(row.sum?.requests || 0);
  }
  for (const row of usageRows.workers) {
    workersCpuTimeMs += Number(row.sum?.cpuTimeUs || 0) / 1000;
    workersSubrequests += Number(row.sum?.subrequests || 0);
  }
  const monthlyWorkersRequests = monthRows.workers.reduce((sum: number, row: { sum?: { requests?: number | string } }) => sum + Number(row.sum?.requests || 0), 0);
  const monthlyPagesFunctionsRequests = monthRows.pagesFunctions.reduce((sum: number, row: { sum?: { requests?: number | string } }) => sum + Number(row.sum?.requests || 0), 0);
  const workerBreakdown = [...workerMap.entries()].map(([name, usage]) => ({
    name,
    requests: usage.requests,
    cpuTimeMs: usage.cpuTime,
    cpuAverageMs: usage.requests ? usage.cpuTime / usage.requests : 0,
    subrequests: usage.subrequests,
    exceededResources: usage.exceededResources,
    errors: usage.errors,
    percentage: (usage.requests / DAILY_REQUEST_LIMIT) * 100,
  })).sort((a, b) => b.requests - a.requests);
  const workersRequests = workerBreakdown.reduce((sum, item) => sum + item.requests, 0);
  const totalExceededResources = workerBreakdown.reduce((sum, item) => sum + item.exceededResources, 0);
  const highestCpuWorker = [...workerBreakdown].sort((a, b) => b.cpuAverageMs - a.cpuAverageMs)[0] || null;
  const dailyUsage = workersRequests + pagesFunctionsRequests;
  const elapsedHours = Math.max((now.getTime() - dayStart.getTime()) / 3600000, 1 / 60);
  const hourlyRate = dailyUsage / elapsedHours;
  const projectedLimitTime = hourlyRate > 0 && dailyUsage < DAILY_REQUEST_LIMIT ? new Date(now.getTime() + ((DAILY_REQUEST_LIMIT - dailyUsage) / hourlyRate) * 3600000).toISOString() : null;

  const [workers, pages] = await Promise.all([
    cfRequest<any[]>('/accounts/{account_id}/workers/scripts'),
    cfRequest<any[]>('/accounts/{account_id}/pages/projects'),
  ]);
  const pagesWithBuilds = await Promise.all(pages.map(async (project) => {
    try {
      const deployments = await cfRequest<any[]>(`/accounts/{account_id}/pages/projects/${project.name}/deployments?per_page=100`);
      const start = monthStart(now).getTime();
      return { name: project.name, domains: project.domains || [], buildsThisMonth: deployments.filter(d => new Date(d.created_on).getTime() >= start).length, failedBuilds: deployments.filter(d => new Date(d.created_on).getTime() >= start && d.latest_stage?.status === 'failure').length };
    } catch { return { name: project.name, domains: project.domains || [], buildsThisMonth: null, failedBuilds: null }; }
  }));

  return {
    plan: 'free', dailyUsage, workersRequests, pagesFunctionsRequests, workersCpuTimeMs, cpuAverageMs: workersRequests ? workersCpuTimeMs / workersRequests : 0, highestCpuWorker, workersSubrequests, subrequestsAverage: workersRequests ? workersSubrequests / workersRequests : 0, totalExceededResources, monthlyUsage: monthlyWorkersRequests + monthlyPagesFunctionsRequests, monthlyWorkersRequests, monthlyPagesFunctionsRequests, dailyLimit: DAILY_REQUEST_LIMIT, monthlyLimit: DAILY_REQUEST_LIMIT * 31, percentage: (dailyUsage / DAILY_REQUEST_LIMIT) * 100,
    resetAt: resetAt.toISOString(), projectedLimitTime, updatedAt: now.toISOString(), workerBreakdown,
    workers: workers.map(worker => ({ name: worker.id, routes: (worker.routes || []).map((route: any) => ({ pattern: route.pattern, failOpen: route.request_limit_fail_open !== false })) })),
    pages: pagesWithBuilds,
    limits: { cpuMs: 10, externalSubrequests: 50, internalSubrequests: 1000, outgoingConnections: 6, workerSizeMb: 3, startupSeconds: 1, workers: 100, cronTriggers: 5, staticAssetFiles: 20000, staticAssetFileSizeMiB: 25, requestBodyMb: 100, pagesBuilds: 500, pagesConcurrentBuilds: 1, pagesCustomDomains: 100, pagesFiles: 20000 },
  };
}

export async function cloudflareUsageResponse() {
  try { return NextResponse.json(await getCloudflareUsage(), { headers: { 'Cache-Control': 'private, max-age=300' } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Cloudflare usage' }, { status: 503 }); }
}
