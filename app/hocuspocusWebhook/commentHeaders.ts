export function readUtf8WebhookHeader(
  headersList: Headers,
  plainHeaderName: string,
): string | null {
  const encodedValue = headersList.get(`${plainHeaderName}-base64`);
  if (encodedValue) {
    return Buffer.from(encodedValue, 'base64').toString('utf8');
  }
  return headersList.get(plainHeaderName);
}
