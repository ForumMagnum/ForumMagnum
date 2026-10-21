/** @jest-environment node */
import { isRejectionReplyAppeal } from '@/server/collections/rejectionAppeals/classifyReply';

const mockGenerateText = jest.fn();
jest.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  Output: { object: jest.fn() },
}));

beforeEach(() => mockGenerateText.mockReset());

describe('rejection reply classifier', () => {
  it('accepts only a positive structured verdict', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { isAppeal: true } });
    expect(await isRejectionReplyAppeal('<p>Please reconsider.</p>')).toBe(true);
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: JSON.stringify({ reply: 'Please reconsider.' }),
      maxRetries: 0,
      abortSignal: expect.any(AbortSignal),
    }));
    mockGenerateText.mockResolvedValueOnce({ output: { isAppeal: false } });
    expect(await isRejectionReplyAppeal('<p>Thanks for explaining.</p>')).toBe(false);
    mockGenerateText.mockResolvedValueOnce({ output: null });
    expect(await isRejectionReplyAppeal('<p>Reply</p>')).toBe(false);
  });

  it('does not send empty, image-only, or oversized replies to the model', async () => {
    for (const html of ['', '<p> </p>', '<img src="image.png">', 'x'.repeat(16001)]) {
      expect(await isRejectionReplyAppeal(html)).toBe(false);
    }
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('propagates failures to the message callback error handler without approving a reply', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('Model unavailable'));
    await expect(isRejectionReplyAppeal('<p>Please reconsider.</p>')).rejects.toThrow('Model unavailable');
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });
});
