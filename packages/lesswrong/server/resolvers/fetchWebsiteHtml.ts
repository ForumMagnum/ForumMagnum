import sanitize from 'sanitize-html';
import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { URL } from 'url';
import cheerio from 'cheerio';
import { WebsiteData } from '../../components/thinkPage/ThinkSideColumn';

import Posts from '../../lib/collections/posts/collection';
import { createMutator, updateMutator } from '../vulcan-lib';
import { fetchFragment, fetchFragmentSingle } from '../fetchFragment';

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
        if (!context.currentUser) {
          throw new Error('You must be logged in to fetch website HTML.');
        }

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
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        const sanitizedHtml = sanitize(html);

        const cheerioTool = cheerio.load(sanitizedHtml);
        const bodyHtml = cheerioTool('body').html() ?? '';
        const links = cheerioTool('a')
          .map((_, a) => `<li><a href="${cheerioTool(a).attr('href')}">${cheerioTool(a).html()}</a></li>`)
          .get()
          .join('');

        const paragraphHtml = cheerioTool('p')
          .map((_, p) => `<p>${cheerioTool(p).html()}</p>`)
          .get()
          .join('');

        const trimmedParagraphHtml = paragraphHtml
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '')
          .replace(/<p><\/p>/g, '')
          .replace(/<p> /g, '<p>')
          .replace(/<p>&nbsp;<\/p>/g, '')
          .trim();

        // Fetch the existing post using fetchFragmentSingle
        const existingPost = await fetchFragmentSingle({
          collectionName: 'Posts',
          fragmentName: 'PostsEditQueryFragment',
          currentUser: context.currentUser,
          selector: { url, userId: context.currentUser._id, draft: true },
          context,
        });

        const currentDateSection = `
          <h1>${new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}</h1>
          <details>
            <summary>Links</summary>
            <ul>
              ${links}
            </ul>
          </details>
          <details>
            <summary>Paragraphs</summary>
            ${trimmedParagraphHtml}
          </details>
          <details>
            <summary>Body Content</summary>
            ${bodyHtml}
          </details>
        `;

        if (existingPost?.contents?.originalContents?.data) {
          const existingPostHtml = existingPost.contents.originalContents.data;
          const existingCheerio = cheerio.load(existingPostHtml);

          // Find the most recent date section
          const dateHeaders = existingCheerio('h1');
          const latestDateHeader = dateHeaders.first();
          const nextElements = latestDateHeader.nextUntil('h1');

          // Extract existing sections
          const existingLinksSection = existingCheerio(nextElements)
            .filter((_, el) => existingCheerio(el).find('summary').text() === 'Links')
            .html() || '';
          const existingParagraphsSection = existingCheerio(nextElements)
            .filter((_, el) => existingCheerio(el).find('summary').text() === 'Paragraphs')
            .html() || '';
          const existingBodySection = existingCheerio(nextElements)
            .filter((_, el) => existingCheerio(el).find('summary').text() === 'Body Content')
            .html() || '';

          // Compare sections
          const linksChanged = existingLinksSection !== `<details><summary>Links</summary><ul>${links}</ul></details>`;
          const paragraphsChanged = existingParagraphsSection !== `<details><summary>Paragraphs</summary>${trimmedParagraphHtml}</details>`;
          const bodyChanged = existingBodySection !== `<details><summary>Body Content</summary>${bodyHtml}</details>`;

          if (linksChanged || paragraphsChanged || bodyChanged) {
            // Insert new sections below the <hr/> tag but above the previous date
            const hrIndex = existingPostHtml.indexOf('<hr/>');
            const beforeHr = existingPostHtml.substring(0, hrIndex + 5); // Include '<hr/>'
            const afterHr = existingPostHtml.substring(hrIndex + 5);

            const updatedPostHtml = `
              ${beforeHr}
              ${currentDateSection}
              ${afterHr}
            `;

            await updateMutator({
              collection: Posts,
              selector: { _id: existingPost._id },
              data: {
                contents: { originalContents: { data: updatedPostHtml, type: 'ckEditorMarkup' } },
              } as Partial<DbPost>,
              currentUser: context.currentUser,
              validate: false,
            });

            return { postId: existingPost._id, postSlug: existingPost.slug };
          } else {
            // No changes detected
            return { postId: existingPost._id, postSlug: existingPost.slug };
          }
        } else {
            // Create new post if none exists
          const postHtml = `
            <h1>Notes</h1>
            <hr/>
            ${currentDateSection}
          `;

          const { data: post } = await createMutator({
            collection: Posts,
            document: {
              userId: context.currentUser._id,
              title: title,
              url: url,
              contents: { originalContents: { data: postHtml, type: 'ckEditorMarkup' } },
              draft: true,
            } as Partial<DbPost>,
            currentUser: context.currentUser,
            validate: false,
          });

          return { postId: post._id, postSlug: post.slug };
        }
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
