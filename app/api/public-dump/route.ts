import { list } from '@vercel/blob';

/**
 * Stable public download URL for the daily public data dump: redirects to the
 * latest gzipped NDJSON dump in the Vercel Blob store. The dump itself is
 * produced by the public-data-dump cron route.
 */
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response('No data dump available', { status: 404 });
  }

  const { blobs } = await list({ prefix: 'public-dumps/lesswrong-public-dump-latest', limit: 1 });
  if (!blobs.length) {
    return new Response('No data dump available', { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': blobs[0].url,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
