import sanitize from 'sanitize-html';
import { addGraphQLResolvers, addGraphQLQuery } from '@/lib/vulcan-lib/graphql';
import { URL } from 'url';
import cheerio from 'cheerio';
import { ResolverContext } from '@/lib/vulcan-lib';

type WebsiteHtml = {
  title: string;
  body: string;
  url: string;
  length: number;
};

declare module 'graphql-type-json' {
  export interface JsonScalar {
    WebsiteHtml: WebsiteHtml;
  }
}

const fetchWebsiteHtmlResolvers = {
  Query: {
    fetchWebsiteHtml: async (
      root: void,
      { url }: { url: string },
      context: ResolverContext
    ): Promise<WebsiteHtml> => {
      try {
        const parsedUrl = new URL(url);

        // Basic URL validation
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch HTML from URL: ${url}, status: ${response.status}`);
        }

        const html = await response.text();

        const sanitizedHtml = sanitize(html);
        const cheerioTool = cheerio.load(sanitizedHtml);
        const getTitle = cheerioTool('title').text();
        const bodyText = cheerioTool('body').text();
        const title = getTitle ?? '';

        return {
          title,
          body: bodyText,
          url,
          length: bodyText.length,
        };
      } catch (error: any) {
        throw new Error(`Error fetching URL ${url}: ${error.message}`);
      }
    },
  },
};

addGraphQLResolvers(fetchWebsiteHtmlResolvers);
addGraphQLQuery('fetchWebsiteHtml(url: String!): WebsiteHtml!'); 