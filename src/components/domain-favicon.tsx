import { getDirectDomainFaviconUrl, getDomainFaviconUrl, getGoogleDomainFaviconUrl } from '@/lib/domain-favicon';

export function DomainFavicon({
  domainName,
  faviconUrl,
  onLoad,
  onUnavailable,
}: {
  domainName: string;
  faviconUrl?: string;
  onLoad?: () => void;
  onUnavailable?: () => void;
}) {
  const isLegacyGoogleUrl = faviconUrl?.includes('google.com/s2/favicons');
  const primaryUrl = faviconUrl && !isLegacyGoogleUrl ? faviconUrl : getDomainFaviconUrl(domainName);

  return (
    <img
      key={`${domainName}:${primaryUrl}`}
      src={primaryUrl}
      alt=""
      aria-hidden="true"
      className="h-5 w-5 rounded-sm"
      onLoad={onLoad}
      onError={event => {
        const image = event.currentTarget;
        const fallbackStep = Number(image.dataset.fallbackStep || 0);
        const fallbackUrl = fallbackStep === 0
          ? getGoogleDomainFaviconUrl(domainName)
          : getDirectDomainFaviconUrl(domainName);
        if (fallbackUrl && fallbackUrl !== image.src) {
          image.dataset.fallbackStep = String(fallbackStep + 1);
          image.src = fallbackUrl;
          return;
        }
        image.style.display = 'none';
        onUnavailable?.();
      }}
    />
  );
}
