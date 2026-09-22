import { jest as jestTimers } from '@jest/globals';
import { getPangramEvaluationForText } from '@/server/collections/automatedContentEvaluations/helpers';
import { PANGRAM_MAX_CHARS } from '@/lib/collections/automatedContentEvaluations/constants';

jest.mock('@/server/postPageCache/invalidatePostPageCache', () => ({}));
jest.mock('@/server/editor/conversionUtils', () => ({}));
jest.mock('@/server/collections/automatedContentEvaluations/collection', () => ({}));
jest.mock('@/lib/sentryWrapper', () => ({ captureException: jest.fn() }));
jest.mock('@/server/collections/posts/collection', () => ({}));
jest.mock('@/server/collections/comments/collection', () => ({}));
jest.mock('@/server/collections/moderationTemplates/collection', () => ({}));
jest.mock('@/server/callbacks/postCallbackFunctions', () => ({}));
jest.mock('@/server/collections/comments/mutations', () => ({}));
jest.mock('@/server/utils/adminTeamAccount', () => ({}));
jest.mock('@/server/vulcan-lib/apollo-server/context', () => ({}));
jest.mock('@/server/collections/automatedContentEvaluations/preprocessing', () => ({}));

const result = {
  stage: 'STAGE_SUCCESS',
  version: '4.0',
  text: 'Human prose. Assisted prose.',
  fraction_human: 0.5,
  fraction_ai: 0.2,
  fraction_ai_assisted: 0.3,
  prediction_short: 'Mixed',
  windows: [{
    text: 'Assisted prose.', ai_assistance_score: 0.8,
    start_index: 13, end_index: 28, label: 'AI-Assisted',
    confidence: 'High', word_count: 2, is_humanized: false, humanizer_score: 0,
  }],
};

// Mock only HTTP; exercise the actual request, polling, and response parsing code.
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const originalKey = process.env.PANGRAM_API_KEY;

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.PANGRAM_API_KEY = 'test-key';
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.PANGRAM_API_KEY;
  else process.env.PANGRAM_API_KEY = originalKey;
});

it('uses v4 by default, polls pending tasks, and preserves score semantics', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: 'task/1' }))
    .mockResolvedValueOnce(jsonResponse({ stage: 'STAGE_PENDING' }))
    .mockResolvedValueOnce(jsonResponse(result));
  const evaluation = getPangramEvaluationForText('Example text');
  await jestTimers.advanceTimersByTimeAsync(2_000);
  expect(await evaluation).toEqual({
    analyzedText: result.text, pangramApiVersion: 'pangram-4', pangramScore: 0.5,
    pangramFractionAi: 0.2, pangramFractionAiAssisted: 0.3, pangramFractionHuman: 0.5,
    pangramMaxScore: 0.8, pangramPrediction: 'Mixed',
    pangramWindowScores: [{ text: 'Assisted prose.', score: 0.8, startIndex: 13,
      endIndex: 28, label: 'AI-Assisted', confidence: 'High', wordCount: 2 }],
  });
  expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://text.external-api.pangram.com/task',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ text: 'Example text', model: 'pangram-4' }) }));
  expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://text.external-api.pangram.com/task/task%2F1',
    expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ 'x-api-key': 'test-key' }) }));
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('caps the submitted text', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: '1' })).mockResolvedValueOnce(jsonResponse(result));
  await getPangramEvaluationForText('a'.repeat(PANGRAM_MAX_CHARS + 1));
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ text: 'a'.repeat(PANGRAM_MAX_CHARS), model: 'pangram-4' }));
});

it('still supports explicit v3 checks', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(result));
  expect((await getPangramEvaluationForText('Example', 'pangram3')).pangramApiVersion).toBe('v3');
  expect(fetchMock).toHaveBeenCalledWith('https://text.api.pangram.com/v3',
    expect.objectContaining({ body: JSON.stringify({ text: 'Example' }) }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('handles responses without optional windows or predictions', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: '1' }))
    .mockResolvedValueOnce(jsonResponse({ ...result, windows: undefined, prediction_short: undefined }));
  expect(await getPangramEvaluationForText('Example')).toMatchObject({
    pangramWindowScores: null, pangramMaxScore: null, pangramPrediction: null,
  });
});

it.each([
  [{ stage: 'STAGE_FAILED', error: 'Unable to analyze' }, 'Unable to analyze'],
  [{ stage: 'STAGE_SUCCESS', text: 'Missing scores' }, 'Invalid Pangram API response'],
  [{ unexpected: true }, 'Invalid Pangram task response'],
])('rejects failed or invalid task responses: %j', async (response, message) => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: '1' })).mockResolvedValueOnce(jsonResponse(response));
  await expect(getPangramEvaluationForText('Example')).rejects.toThrow(message);
});

it('rejects invalid submissions without polling', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: '' }));
  await expect(getPangramEvaluationForText('Example')).rejects.toThrow('Invalid Pangram task submission');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('stops polling after the overall deadline', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ task_id: '1' }))
    .mockResolvedValue(jsonResponse({ stage: 'STAGE_PENDING' }));
  const assertion = expect(getPangramEvaluationForText('Example')).rejects.toThrow('did not finish within 90 seconds');
  await jestTimers.advanceTimersByTimeAsync(90_000);
  await assertion;
  const calls = fetchMock.mock.calls.length;
  await jestTimers.advanceTimersByTimeAsync(10_000);
  expect(fetchMock).toHaveBeenCalledTimes(calls);
});

it('propagates HTTP errors without silently falling back to v3', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => 'Rate limit' });
  await expect(getPangramEvaluationForText('Example')).rejects.toThrow('status 429');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('propagates network failures', async () => {
  fetchMock.mockRejectedValue(new Error('Network failure'));
  await expect(getPangramEvaluationForText('Example')).rejects.toThrow('Network failure');
});

it('requires an API key before submitting', async () => {
  delete process.env.PANGRAM_API_KEY;
  await expect(getPangramEvaluationForText('Example')).rejects.toThrow('PANGRAM_API_KEY is not configured');
  expect(fetchMock).not.toHaveBeenCalled();
});
