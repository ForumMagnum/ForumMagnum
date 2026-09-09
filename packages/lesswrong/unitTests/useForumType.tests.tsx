/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ForumTypeProvider, useForumType } from '../components/hooks/useForumType';
import { forumTypeSetting } from '../lib/forumTypeUtils';

function ForumTypeDisplay() {
  const { isLW, isAF, forumType } = useForumType();
  return <span>{`${forumType}: LW=${isLW}, AF=${isAF}`}</span>;
}

describe('useForumType', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the provider value for every consumer, including during server rendering', () => {
    jest.spyOn(forumTypeSetting, 'get')
      .mockReturnValueOnce('AlignmentForum')
      .mockReturnValue('LessWrong');

    const html = renderToString(<ForumTypeProvider>
      <ForumTypeDisplay />
      <ForumTypeDisplay />
    </ForumTypeProvider>);

    expect(html).toBe('<span>AlignmentForum: LW=false, AF=true</span><span>AlignmentForum: LW=false, AF=true</span>');
  });

  it('keeps separate provider trees isolated', () => {
    jest.spyOn(forumTypeSetting, 'get')
      .mockReturnValueOnce('LessWrong')
      .mockReturnValueOnce('AlignmentForum');

    render(<>
      <ForumTypeProvider><ForumTypeDisplay /></ForumTypeProvider>
      <ForumTypeProvider><ForumTypeDisplay /></ForumTypeProvider>
    </>);

    expect(screen.getByText('LessWrong: LW=true, AF=false')).toBeTruthy();
    expect(screen.getByText('AlignmentForum: LW=false, AF=true')).toBeTruthy();
  });

  it('updates consumers when the provider forum changes', () => {
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    const { result, rerender } = renderHook(useForumType, { wrapper: ForumTypeProvider });
    expect(result.current).toEqual({ isLW: true, isAF: false, forumType: 'LessWrong' });

    getForumType.mockReturnValue('AlignmentForum');
    rerender();
    expect(result.current).toEqual({ isLW: false, isAF: true, forumType: 'AlignmentForum' });
  });
});
