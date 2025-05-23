import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import cheerio from 'cheerio';

const utmParamsSet = new TupleSet([
  // Standard ones (more likely to have support from e.g. Google Analytics, Plausible)
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  // Custom ones
  'utm_user_id'
] as const)

export type UtmParam = UnionOf<typeof utmParamsSet>

export function utmifyForumBacklinks({
  html,
  utmParams,
  siteUrl,
}: {
  html: string;
  utmParams?: Partial<Record<UtmParam, string>>;
  siteUrl: string;
}): string {
  if (!utmParams || Object.keys(utmParams).length === 0) {
    return html;
  }

  const $ = cheerio.load(html);

  $('a').each((i, el) => {
    const element = $(el);
    const href = element.attr('href');

    if (href && href.startsWith(siteUrl)) {
      try {
        const url = new URL(href);
        Object.entries(utmParams).forEach(([key, value]) => {
          if (value !== undefined && !url.searchParams.has(key)) {
            url.searchParams.set(key, value);
          }
        });
        element.attr('href', url.toString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to parse URL or set UTM params for ${href}:`, e);
      }
    }
  });

  return $.html();
}
