import sanitize from 'sanitize-html';
import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { URL } from 'url';
import cheerio from 'cheerio';
import { WebsiteData } from '../../components/thinkPage/ThinkSideColumn';

import Posts from '../../lib/collections/posts/collection';
import { createMutator, updateMutator } from '../vulcan-lib';
import { fetchFragment, fetchFragmentSingle } from '../fetchFragment';
import { htmlToMarkdown } from '../editor/conversionUtils';

// Function to clean text by removing newlines and excessive whitespace
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Export the utility function
export async function fetchWebsiteHtmlContent(url: string, context: ResolverContext): Promise<WebsiteData> {
  try {
    const parsedUrl = new URL(url);
    if (!context.currentUser) {
      throw new Error('You must be logged in to fetch website HTML.');
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
    }

    const existingPost = await fetchFragmentSingle({
      collectionName: 'Posts',
      fragmentName: 'PostsEditQueryFragment',
      currentUser: context.currentUser,
      selector: { url, userId: context.currentUser._id, draft: true, deletedDraft: false },
      context,
    });

    if (existingPost) {
      return { postId: existingPost._id, postSlug: existingPost.slug };
    }

    const response = await fetch(url);
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.log("Failed to fetch HTML from URL: ", url, response.status);
      throw new Error(`Failed to fetch HTML from URL: ${url}, status: ${response.status}`);
    }
    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    const sanitizedHtml = sanitize(html);
    const cheerioTool = cheerio.load(sanitizedHtml);
    const tables = cheerioTool('table').map((_, table) => cheerioTool(table).prop('outerHTML')).get();
    const tableHtml = tables.join('\n') ?? '';
    const bodyHtml = cheerioTool('body').html() ?? '';

    const combinedHtml = `
      <details class="detailsBlock">
        <summary class="detailsBlockTitle">Table Content</summary>
        <div class="detailsBlockContent">
          ${tableHtml}
        </div>
      </details>
      <details class="detailsBlock">
        <summary class="detailsBlockTitle">Body Content</summary>
        <div class="detailsBlockContent">
          ${bodyHtml}
        </div>
      </details>
    `;
    const { data: post } = await createMutator({
      collection: Posts,
      document: {
        userId: context.currentUser._id,
        title: title,
        url: url,
        contents: { originalContents: { data: combinedHtml, type: 'ckEditorMarkup' } },
        draft: true,
      } as Partial<DbPost>,
      currentUser: context.currentUser,
      validate: false,
    });

    return { postId: post._id, postSlug: post.slug };
  } catch (error: any) {
    throw new Error(`Error fetching URL ${url}: ${error.message}`);
  }
}

const fetchWebsiteHtmlResolvers = {
  Query: {
    fetchWebsiteHtml: async (
      root: void,
      { url }: { url: string },
      context: ResolverContext
    ): Promise<WebsiteData> => {
      return fetchWebsiteHtmlContent(url, context);
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
