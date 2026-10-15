/** @jest-environment jsdom */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ModerationSidebarComposers from '@/components/sunshineDashboard/supermod/ModerationSidebarComposers';

const completeModeration = jest.fn();
const flash = jest.fn();

jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: () => ({}), useStyles: () => ({}) }));
jest.mock('@/lib/crud/useQuery', () => ({ useQuery: () => ({}) }));
jest.mock('@/components/common/withMessages', () => ({ useMessages: () => ({ flash }) }));
jest.mock('@/components/sunshineDashboard/supermod/useCompleteUserModeration', () => ({
  useCompleteUserModeration: () => completeModeration,
}));
jest.mock('@/components/editor/LexicalEditor', () => ({
  __esModule: true,
  default: function Editor({ data, onChange }) {
    return <textarea aria-label="Rejection reason" defaultValue={data} onChange={event => onChange(event.target.value)} />;
  },
}));
jest.mock('@/components/common/ContentStyles', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/common/LWTooltip', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/lib/vendor/@material-ui/core/src/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
jest.mock('@/components/sunshineDashboard/supermod/KeystrokeDisplay', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/GroupedModerationTemplateList', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/ModeratorMessageComposer', () => ({ __esModule: true, default: () => null }));

// These UI fixtures only need the fields read by the composer; the network is mocked.
const firstPost = { __typename: 'Post', _id: 'post-a', title: 'First post', rejected: false };
const secondPost = { __typename: 'Post', _id: 'post-b', title: 'Second post', rejected: false };
const baseProps = {
  user: { _id: 'author', displayName: 'Author' },
  currentUser: { _id: 'moderator' },
  posts: [], comments: [],
  focusedContent: firstPost,
  sidebarTab: 'reject',
  rejectComposerFocusToken: 1,
  dispatch: jest.fn(),
};

function Composer(props) {
  return <React.StrictMode><ModerationSidebarComposers {...baseProps} {...props} /></React.StrictMode>;
}

beforeEach(() => {
  completeModeration.mockReset();
  flash.mockReset();
});

it('preserves a draft across tabs but resets its text and options for different content', () => {
  const setSidebarTab = jest.fn();
  const { rerender } = render(<Composer setSidebarTab={setSidebarTab} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '<p>Only for the first post</p>' } });
  fireEvent.click(screen.getByLabelText('Disable permissions'));
  const draft = screen.getByRole('textbox').value;
  expect(draft).toContain('Only for the first post');

  rerender(<Composer setSidebarTab={setSidebarTab} sidebarTab="dm" />);
  rerender(<Composer setSidebarTab={setSidebarTab} />);
  expect(screen.getByRole('textbox').value).toBe(draft);
  expect(screen.getByLabelText('Disable permissions').checked).toBe(true);

  rerender(<Composer setSidebarTab={setSidebarTab} focusedContent={secondPost} />);
  expect(screen.getByRole('textbox').value).not.toContain('Only for the first post');
  expect(screen.getByLabelText('Disable permissions').checked).toBe(false);
});

it('does not close or reset a new composer when the previous content finishes rejecting', async () => {
  let finishRejection;
  const rejection = new Promise(resolve => { finishRejection = resolve; });
  completeModeration.mockReturnValue(rejection);
  const setSidebarTab = jest.fn();
  const { rerender } = render(<Composer setSidebarTab={setSidebarTab} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '<p>Reject the first post</p>' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
  expect(completeModeration).toHaveBeenCalledWith(expect.objectContaining({
    rejection: expect.objectContaining({ documentId: firstPost._id, collectionName: 'Posts', reason: '<p>Reject the first post</p>' }),
  }));

  rerender(<Composer setSidebarTab={setSidebarTab} focusedContent={secondPost} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '<p>Draft for the second post</p>' } });
  await act(async () => { finishRejection(); await rejection; });

  expect(setSidebarTab).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox').value).toBe('<p>Draft for the second post</p>');
  expect(screen.getByRole('button', { name: 'Reject' }).disabled).toBe(false);
  expect(flash).not.toHaveBeenCalled();
});
