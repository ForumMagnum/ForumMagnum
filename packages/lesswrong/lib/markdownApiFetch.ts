/**
 * Fetches a markdown API route (e.g. `/api/post/...`) and resolves to its
 * response body. Same-origin cookies are sent by default, so permission-gated
 * content works for authorized users. Non-2xx responses reject rather than
 * resolving to an error page body.
 */
export const fetchMarkdownApiText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch markdown from ${url} (${response.status})`);
  }
  return await response.text();
};
