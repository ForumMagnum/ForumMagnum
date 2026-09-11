import { areAllContentPermissionsDisabled } from '@/components/sunshineDashboard/supermod/helpers';

describe('areAllContentPermissionsDisabled', () => {
  it('returns false when no permissions are disabled', () => {
    expect(areAllContentPermissionsDisabled({
      postingDisabled: false,
      allCommentingDisabled: false,
      conversationsDisabled: false,
      votingDisabled: false,
    })).toBe(false);
  });

  it('returns false when only some permissions are disabled', () => {
    expect(areAllContentPermissionsDisabled({
      postingDisabled: true,
      allCommentingDisabled: true,
      conversationsDisabled: false,
      votingDisabled: true,
    })).toBe(false);
  });

  it('returns true when posting, commenting, messaging, and voting are all disabled', () => {
    expect(areAllContentPermissionsDisabled({
      postingDisabled: true,
      allCommentingDisabled: true,
      conversationsDisabled: true,
      votingDisabled: true,
    })).toBe(true);
  });

  it('treats null/undefined permission flags as not disabled', () => {
    expect(areAllContentPermissionsDisabled({
      postingDisabled: true,
      allCommentingDisabled: true,
      conversationsDisabled: null,
      votingDisabled: true,
    })).toBe(false);

    expect(areAllContentPermissionsDisabled({})).toBe(false);
  });
});
