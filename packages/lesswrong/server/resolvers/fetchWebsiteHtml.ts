import sanitize from 'sanitize-html';
import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { URL } from 'url';
import cheerio from 'cheerio';
import { WebsiteData } from '../../components/thinkPage/ThinkSideColumn';

// Function to clean text by removing newlines and excessive whitespace
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

const fetchWebsiteHtmlResolvers = {
  Query: {
    fetchWebsiteHtml: async (
      root: void,
      { url }: { url: string },
      context: ResolverContext
    ): Promise<WebsiteData> => {
      try {
        const parsedUrl = new URL(url);

        // Basic URL validation
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
        }

        // Enhanced validation to ensure hostname and pathname are present
        if (!parsedUrl.hostname || !parsedUrl.pathname) {
          throw new Error('Invalid URL. Hostname and pathname are required.');
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch HTML from URL: ${url}, status: ${response.status}`);
        }

        const html = await response.text();

        const sanitizedHtml = sanitize(html);
        const cheerioTool = cheerio.load(sanitizedHtml);
        const getTitle = cheerioTool('title').text().trim();
        const bodyHtml = cheerioTool('body').html() ?? '';
        const body = cleanText(cheerioTool('body').text()) ?? '';
        const paragraph = cleanText(cheerioTool('p').text()) ?? '';
        const paragraphHtml = cheerioTool('p').html() ?? '';
        const title = getTitle ?? '';

        return { title, url, body, paragraph, bodyHtml, paragraphHtml };
      } catch (error: any) {
        throw new Error(`Error fetching URL ${url}: ${error.message}`);
      }
    },
  },
};

addGraphQLResolvers(fetchWebsiteHtmlResolvers);
addGraphQLQuery('fetchWebsiteHtml(url: String!): JSON!');

// Example client-side validation
function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
}

// Usage
const url = 'https://forummagnum.com/pull/9939/un-gate-jargonbot-by-raemon';
if (isValidUrl(url)) {
  // Proceed with the GraphQL request
} else {
  // Inform the user about the invalid URL
}
