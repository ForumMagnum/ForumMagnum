/** @jest-environment jsdom */
import React, { Suspense } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectContentPanel from '@/components/sunshineDashboard/supermod/RejectContentPanel';
import { standardRejectionIntroPlaintext } from '@/lib/collections/moderationTemplates/rejectionIntro';

let mockEditorReady;
let mockEditorLoading;

function MockEditor({ data }) {
  if (!mockEditorReady) throw mockEditorLoading;
  return <textarea aria-label="Rejection editor" defaultValue={data} />;
}

jest.mock('next/dynamic', () => ({ __esModule: true, default: () => MockEditor }));
jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: jest.fn(), useStyles: () => ({}) }));
jest.mock('@/components/common/ContentStyles', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/editor/focusLexicalEditor', () => ({ focusLexicalEditorAtEnd: jest.fn() }));
jest.mock('@/components/common/withGlobalKeydown', () => ({ useGlobalKeydown: jest.fn() }));
jest.mock('@/components/hooks/useRejectContent', () => ({ useRejectContent: () => ({ rejectContent: jest.fn() }) }));
jest.mock('@/components/sunshineDashboard/supermod/helpers', () => ({ isPost: () => true }));
jest.mock('@/components/sunshineDashboard/GroupedModerationTemplateList', () => ({
  __esModule: true,
  default: ({ onFocusComposer }) => <button onClick={onFocusComposer}>Focus composer</button>,
}));
jest.mock('@/lib/vendor/@material-ui/core/src/Button', () => ({ __esModule: true, default: props => <button {...props} /> }));
jest.mock('@/components/sunshineDashboard/supermod/ComposerSubmitButton', () => ({
  __esModule: true,
  default: ({ label, ...props }) => <button {...props}>{label}</button>,
}));

describe('rejection editor loading', () => {
  it.each(['preview', 'template list'])('keeps the page visible when opened from the %s', async (source) => {
    mockEditorReady = false;
    let resolveEditor;
    mockEditorLoading = new Promise(resolve => { resolveEditor = resolve; });
    render(<Suspense fallback={<div>Page loading</div>}>
      <div>Moderation page</div>
      <RejectContentPanel user={{ displayName: 'Test author' }} focusedContent={{ _id: 'post' }} active onEscape={jest.fn()} />
    </Suspense>);

    fireEvent.click(screen.getByText(source === 'preview' ? standardRejectionIntroPlaintext : 'Focus composer'));

    expect(screen.queryByText('Page loading')).not.toBeInTheDocument();
    expect(screen.getByText('Moderation page')).toBeVisible();
    expect(screen.getByText('Focus composer')).toBeVisible();

    await act(async () => {
      mockEditorReady = true;
      resolveEditor();
      await mockEditorLoading;
    });
    expect(screen.getByRole('textbox', { name: 'Rejection editor' })).toBeVisible();
    expect(screen.getByRole('textbox').value).toContain('[content]');
  });
});
