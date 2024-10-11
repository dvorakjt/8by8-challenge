import { createShareLink } from '@/app/share/create-share-link';
import { SearchParams } from '@/constants/search-params';
import { createId } from '@paralleldrive/cuid2';

describe('createShareLink', () => {
  it(`returns a link in the format 
  <location.protocol>//<location.host>/playerwelcome?${SearchParams.InviteCode}=<invitecode>`, () => {
    const currentURL = 'https://challenge.8by8.us/share';
    window.location.assign(currentURL);
    const inviteCode = createId();
    const shareLink = createShareLink(inviteCode);
    expect(shareLink).toBe(
      `${currentURL.slice(0, currentURL.indexOf('/share'))}/playerwelcome?${SearchParams.InviteCode}=${inviteCode}`,
    );
  });
});
