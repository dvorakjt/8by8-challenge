import { SearchParams } from '@/constants/search-params';

/**
 * Creates a link that can be sent to friends to invite them to contribute to
 * a user's challenge. Must be called from a client component that is imported
 * dynamically. If not, hydration errors will occur.
 */
export function createShareLink(inviteCode: string): string {
  return `${window.location.protocol}//${window.location.host}/playerwelcome?${SearchParams.InviteCode}=${inviteCode}`;
}
