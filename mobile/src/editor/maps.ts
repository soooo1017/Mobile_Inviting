import { Linking } from 'react-native';
import type { Venue } from '../types/project';

export type MapApp = 'naver' | 'kakao';

/** What the map apps search for: the address, or the place name when no separate address was given. */
export function venueQuery(venue: Venue | undefined): string {
  if (!venue) return '';
  const address = venue.address.trim();
  return address && address !== venue.name.trim() ? address : venue.name.trim();
}

/** Only shows the address line when it says something the name doesn't. */
export function venueAddressLine(venue: Venue | undefined): string {
  if (!venue) return '';
  const address = venue.address.trim();
  return address === venue.name.trim() ? '' : address;
}

function withScheme(url: string): string {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/**
 * Opens the place in the map app: a pasted place link if there is one, otherwise an
 * address search — the app itself when installed, the mobile web map when it isn't.
 */
export async function openMap(app: MapApp, query: string, customUrl: string): Promise<void> {
  if (customUrl.trim()) {
    await Linking.openURL(withScheme(customUrl));
    return;
  }
  const q = encodeURIComponent(query);
  const appUrl = app === 'naver' ? `nmap://search?query=${q}&appname=com.mobileinvitation` : `kakaomap://search?q=${q}`;
  const webUrl = app === 'naver' ? `https://m.map.naver.com/search2/search.naver?query=${q}` : `https://m.map.kakao.com/actions/searchView?q=${q}`;
  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}

/** Loose check for a pasted place link (naver.me/…, map.naver.com/…, place.map.kakao.com/…). */
export function looksLikeLink(url: string): boolean {
  return /^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(url.trim());
}
