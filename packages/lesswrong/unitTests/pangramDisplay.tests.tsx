import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LLMScoreDialog from '@/components/sunshineDashboard/LLMScoreDialog';
import LLMScoreBadge from '@/components/sunshineDashboard/supermod/LLMScoreBadge';

jest.mock('@/components/common/LWDialog', () => ({
  __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/widgets/DialogContent', () => ({
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: jest.fn(), useStyles: () => ({}) }));
jest.mock('@/components/common/withMessages', () => ({ useMessages: () => ({ flash: jest.fn() }) }));
jest.mock('@/components/common/withDialog', () => ({ useDialog: () => ({ openDialog: jest.fn() }) }));
jest.mock('@/components/common/HoverOver', () => ({
  __esModule: true,
  default: ({ title, children }: { title: React.ReactNode, children: React.ReactNode }) => <div>{title}{children}</div>,
}));
jest.mock('@/components/sunshineDashboard/helpers', () => ({ highlightHtmlWithPangramWindowScores: () => '<p>Highlighted content</p>' }));
jest.mock('@apollo/client/react', () => ({ useMutation: () => [jest.fn(), { loading: false }] }));
jest.mock('@/lib/generated/gql-codegen', () => ({ gql: jest.fn() }));

function evaluation(pangramApiVersion: string | null): AutomatedContentEvaluationsFragment {
  return {
    __typename: 'AutomatedContentEvaluation', _id: 'evaluation', score: null, sentenceScores: null,
    aiChoice: null, aiReasoning: null, aiCoT: null, pangramApiVersion,
    pangramScore: 0.5, pangramFractionAi: 0.2, pangramFractionAiAssisted: 0.3,
    pangramFractionHuman: 0.5, pangramMaxScore: 0.8, pangramPrediction: 'Mixed', pangramWindowScores: [],
  };
}

it.each(['v3', 'pangram-4'])('shows fractions and model for %s in the dialog and badge', version => {
  const data = evaluation(version);
  const dialog = renderToStaticMarkup(<LLMScoreDialog
    onClose={() => {}} automatedContentEvaluations={data} contentHtml="<p>Content</p>" contentType="Post"
  />);
  const badge = renderToStaticMarkup(<LLMScoreBadge documentId="document"
    automatedContentEvaluations={data} contentHtml="<p>Content</p>" contentType="Post"
  />);
  for (const markup of [dialog, badge]) {
    expect(markup).toContain(`Model: ${version}`);
    expect(markup).toContain('AI-written: 0.20');
    expect(markup).toContain('AI-assisted: 0.30');
    expect(markup).toContain('Max window: 0.80');
    expect(markup).not.toContain('Average:');
  }
  expect(dialog).toContain('human: 0.50');
});

it.each([null, 'v2'])('preserves legacy display for version %s', version => {
  const data = evaluation(version);
  const dialog = renderToStaticMarkup(<LLMScoreDialog
    onClose={() => {}} automatedContentEvaluations={data} contentHtml="<p>Content</p>" contentType="Comment"
  />);
  const badge = renderToStaticMarkup(<LLMScoreBadge documentId="document"
    automatedContentEvaluations={data} contentHtml="<p>Content</p>" contentType="Comment"
  />);
  for (const markup of [dialog, badge]) {
    expect(markup).toContain('Average: 0.50');
    expect(markup).not.toContain('AI-assisted:');
  }
});
