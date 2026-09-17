/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ForumTypeProvider, useForumType } from '../components/hooks/useForumType';

function ForumTypeDisplay() {
  const { isLW, isAF, forumType } = useForumType();
  return <span>{`${forumType}: LW=${isLW}, AF=${isAF}`}</span>;
}

describe('useForumType', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the provider value for every consumer, including during server rendering', () => {
    const html = renderToString(<ForumTypeProvider forumType="AlignmentForum">
      <ForumTypeDisplay />
      <ForumTypeDisplay />
    </ForumTypeProvider>);

    expect(html).toBe('<span>AlignmentForum: LW=false, AF=true</span><span>AlignmentForum: LW=false, AF=true</span>');
  });

  it('keeps separate provider trees isolated', () => {
    render(<>
      <ForumTypeProvider forumType="LessWrong"><ForumTypeDisplay /></ForumTypeProvider>
      <ForumTypeProvider forumType="AlignmentForum"><ForumTypeDisplay /></ForumTypeProvider>
    </>);

    expect(screen.getByText('LessWrong: LW=true, AF=false')).toBeTruthy();
    expect(screen.getByText('AlignmentForum: LW=false, AF=true')).toBeTruthy();
  });

  it('updates consumers when the provider forum changes', () => {
    const { rerender } = render(<ForumTypeProvider forumType="LessWrong"><ForumTypeDisplay /></ForumTypeProvider>);
    expect(screen.getByText('LessWrong: LW=true, AF=false')).toBeTruthy();

    rerender(<ForumTypeProvider forumType="AlignmentForum"><ForumTypeDisplay /></ForumTypeProvider>);
    expect(screen.getByText('AlignmentForum: LW=false, AF=true')).toBeTruthy();
  });
});
