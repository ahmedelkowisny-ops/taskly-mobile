import { getDeepLinkFallbackRoute, resolveDeepLinkTargetFromUrl } from '@/src/lib/navigation/deepLinks';

export function redirectSystemPath({ path }: { initial: boolean; path: string }) {
  try {
    return String(resolveDeepLinkTargetFromUrl(path)?.href ?? getDeepLinkFallbackRoute());
  } catch {
    return String(getDeepLinkFallbackRoute());
  }
}
