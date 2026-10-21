/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ForumTypeProvider, useForumType } from '@/components/hooks/useForumType';
import { forumHeaderTitleSetting, forumShortTitleSetting } from '@/lib/instanceSettings';
import { forumTypeSetting } from '@/lib/forumTypeUtils';

function ForumTitle() {
  const { forumType } = useForumType();
  return <span>{forumHeaderTitleSetting.get(forumType)} ({forumShortTitleSetting.get(forumType)})</span>;
}

describe('public instance settings by forum in the browser', () => {
  const originalSettings = window.publicInstanceSettings;

  afterEach(() => {
    window.publicInstanceSettings = originalSettings;
    jest.restoreAllMocks();
  });

  it('selects the provider forum from the injected public settings', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Browser settings must use the provider forum');
    });
    window.publicInstanceSettings = {
      LessWrong: { forumSettings: { headerTitle: 'LESSWRONG', shortForumTitle: 'LW' } },
      AlignmentForum: { forumSettings: { headerTitle: 'AI ALIGNMENT FORUM', shortForumTitle: 'AF' } },
    };

    const { rerender } = render(<ForumTypeProvider forumType="AlignmentForum"><ForumTitle/></ForumTypeProvider>);
    expect(screen.getByText('AI ALIGNMENT FORUM (AF)')).toBeTruthy();
    rerender(<ForumTypeProvider forumType="LessWrong"><ForumTitle/></ForumTypeProvider>);
    expect(screen.getByText('LESSWRONG (LW)')).toBeTruthy();
  });
});
