'use server';
/**
 * @fileOverview A server action to check the status of a website.
 *
 * - checkDomainStatus - A function that checks if a domain is online.
 * - CheckDomainStatusInput - The input type for the checkDomainStatus function.
 * - CheckDomainStatusOutput - The return type for the checkDomainStatus function.
 *
 * ملاحظة: كانت هذه الدالة تُعرَّف عبر genkit، لكنها لا تستخدم أي قدرة من قدراته
 * (مجرد fetch). أُزيل الاعتماد على genkit لتقليل حجم الـ bundle وتفادي سحب
 * حزم OpenTelemetry التي تُكسِر بناء Cloudflare Workers.
 */

export interface CheckDomainStatusInput {
  domainName: string;
}

export interface CheckDomainStatusOutput {
  isOnline: boolean;
}

export async function checkDomainStatus(
  input: CheckDomainStatusInput
): Promise<CheckDomainStatusOutput> {
  const { domainName } = input;
  try {
    // Prepend http:// if no protocol is present.
    const url = domainName.startsWith('http') ? domainName : `http://${domainName}`;
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return { isOnline: response.ok };
  } catch (error) {
    console.error(`Error checking domain ${domainName}:`, error);
    return { isOnline: false };
  }
}
