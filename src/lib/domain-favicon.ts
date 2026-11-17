function getDomainUrl(domainName: string): URL | null {
  try {
    const url = new URL(domainName.includes('://') ? domainName : `https://${domainName}`);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname ? url : null;
  } catch {
    return null;
  }
}

export function getDomainFaviconUrl(domainName: string, refreshToken?: number): string {
  const domainUrl = getDomainUrl(domainName);
  if (!domainUrl) return '';

  const refresh = refreshToken ? `?refresh=${refreshToken}` : '';
  return `https://icon.horse/icon/${encodeURIComponent(domainUrl.hostname)}${refresh}`;
}

export function getGoogleDomainFaviconUrl(domainName: string): string {
  const domainUrl = getDomainUrl(domainName);
  if (!domainUrl) return '';

  const params = new URLSearchParams({ domain_url: domainUrl.origin, alt: '404', sz: '64' });
  return `https://www.google.com/s2/favicons?${params.toString()}`;
}

export function getDirectDomainFaviconUrl(domainName: string): string {
  const domainUrl = getDomainUrl(domainName);
  return domainUrl ? new URL('/favicon.ico', domainUrl.origin).toString() : '';
}
