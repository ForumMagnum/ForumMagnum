/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpandedSequencesSearchHit from '../components/search/ExpandedSequencesSearchHit';

jest.mock('@/components/hooks/useStyles', () => ({useStyles: () => ({})}));
jest.mock('@/components/hooks/defineStyles', () => ({defineStyles: () => ({})}));
jest.mock('@/lib/instanceSettings', () => ({cloudinaryCloudName: 'test'}));
jest.mock('../components/search/SearchResultLink', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/SearchHighlight', () => ({__esModule: true, default: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('react-instantsearch-dom', () => ({Snippet: () => null}));
jest.mock('../components/common/FormatDate', () => ({__esModule: true, default: () => null}));
jest.mock('../components/users/UserNameDeleted', () => ({__esModule: true, default: () => null}));

it('keeps search scores and average post karma out of sequence metadata', () => {
  render(<ExpandedSequencesSearchHit hit={{objectID: 'sequence', _score: 7.12345, baseScore: 0}} />);
  expect(screen.queryByText(/relevance/)).toBeNull();
  expect(screen.queryByText(/average post karma/)).toBeNull();
});
