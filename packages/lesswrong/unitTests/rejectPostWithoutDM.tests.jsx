/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectContentPanel from '@/components/sunshineDashboard/supermod/RejectContentPanel';

const mockRejectContent = jest.fn();
const template = { _id: 'reason', contents: { html: '<p>Test rejection reason</p>' } };

jest.mock('next/dynamic', () => ({ __esModule: true, default: () => () => null }));
jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: jest.fn(), useStyles: () => ({}) }));
jest.mock('@/components/common/ContentStyles', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/editor/focusLexicalEditor', () => ({ focusLexicalEditorAtEnd: jest.fn() }));
jest.mock('@/components/common/withGlobalKeydown', () => ({ useGlobalKeydown: jest.fn() }));
jest.mock('@/components/hooks/useRejectContent', () => ({ useRejectContent: () => ({ rejectContent: mockRejectContent }) }));
jest.mock('@/components/sunshineDashboard/supermod/helpers', () => ({ isPost: content => content.__typename === 'Post' }));
jest.mock('@/components/sunshineDashboard/GroupedModerationTemplateList', () => ({
  __esModule: true,
  default: ({ onTemplateClick }) => <button onClick={() => onTemplateClick(template)}>Add reason</button>,
}));
jest.mock('@/lib/vendor/@material-ui/core/src/Button', () => ({ __esModule: true, default: props => <button {...props} /> }));
jest.mock('@/components/sunshineDashboard/supermod/ComposerSubmitButton', () => ({
  __esModule: true,
  default: ({ label, ...props }) => <button {...props}>{label}</button>,
}));

function renderPanel(content = { _id: 'post', __typename: 'Post', rejected: false }) {
  return render(<RejectContentPanel user={{ displayName: 'Test author' }} focusedContent={content} active onEscape={jest.fn()} />);
}

describe('reject post without DM', () => {
  beforeEach(() => mockRejectContent.mockClear());

  it('rejects without a reason or DM', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Reject', exact: true })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reject without DM' }));
    expect(mockRejectContent).toHaveBeenCalledWith(expect.objectContaining({ collectionName: 'Posts', reason: '', skipRejectionPM: true }));
  });

  it('preserves the selected reason when suppressing the DM', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Add reason'));
    fireEvent.click(screen.getByText('Reject without DM'));
    expect(mockRejectContent).toHaveBeenCalledWith(expect.objectContaining({ reason: template.contents.html, skipRejectionPM: true }));
  });

  it('still sends the DM when using the normal reject button', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Add reason'));
    fireEvent.click(screen.getByRole('button', { name: 'Reject', exact: true }));
    expect(mockRejectContent).toHaveBeenCalledWith(expect.objectContaining({ reason: template.contents.html, skipRejectionPM: false }));
  });

  it('does not offer the post-only action for comments', () => {
    renderPanel({ _id: 'comment', __typename: 'Comment', rejected: false });
    expect(screen.queryByText('Reject without DM')).not.toBeInTheDocument();
  });

  it('disables rejection for an already rejected post', () => {
    renderPanel({ _id: 'post', __typename: 'Post', rejected: true });
    expect(screen.getByText('Reject without DM')).toBeDisabled();
    fireEvent.click(screen.getByText('Reject without DM'));
    expect(mockRejectContent).not.toHaveBeenCalled();
  });
});
