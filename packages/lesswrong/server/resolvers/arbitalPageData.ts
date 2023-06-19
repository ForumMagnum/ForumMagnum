import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import markdownIt from 'markdown-it'
import markdownItMathjax from '../editor/markdown-mathjax'
import { mjPagePromise } from '../editor/conversionUtils';
import { trimLatexAndAddCSS } from '../editor/utils';

const ArbitalPageData = `type ArbitalPageData {
  html: String
  title: String
}`

const mdi = markdownIt({linkify: true})
mdi.use(markdownItMathjax())


addGraphQLSchema(ArbitalPageData);

async function getArbitalPageData(pageAlias = "hyperexistential_separation") {
  const requestOptions: any = {
    body: JSON.stringify({pageAlias}),
    method: "POST",
  }
  const response = await fetch("https://arbital.com/json/intrasitePopover/", requestOptions);
  return await response.text()
}

// Make a string safe for use in the text part of a link, by backslash-escaping brackets.
// (This is not particularly well tested. However, it's a text transform over markdown not
// over HTML, so even if it's totally wrong it can only break links, not cause XSS.)
function markdownEscapeLinkText(text: string) {
  return text.replace(/[[\]]/g, match=>'\\'+match);
}

const arbitalPageResolvers = {
  Query: {
    async ArbitalPageData(root: void, { pageAlias }: { pageAlias:string }, context: ResolverContext) {
      const rawRoomData:any = await getArbitalPageData(pageAlias)
      if (!rawRoomData) return null
      let processedData: AnyBecauseTodo;
      try {
        processedData = JSON.parse(rawRoomData)
      } catch(e) {
        throw new Error(`Received invalid JSON for Arbital hover preview for page "${pageAlias}"`);
      }
      if (!processedData?.pages) return null;
      const page:any = Object.values(processedData.pages).find((page:any) => page?.alias === pageAlias)
      if (!page) return null
      const textField = page.summaries?.Summary || page.clickbait
      const fixedMarkdown = textField.replace(
        /\[([^\]]+)\]/g,
        (fullMatch: string, insideBrackets: string) => {
          if (insideBrackets.startsWith("-")) {
            // Formatted like [-id]
            const linkedPageId = insideBrackets.substr(1);
            const linkedPageAlias = processedData.pages[linkedPageId]?.alias;
            if (linkedPageAlias) {
              const linkedPageTitle = processedData.pages[linkedPageId]?.title;
              const destinationLink = `http://arbital.com/p/${encodeURIComponent(linkedPageAlias)}`;
              return `[${markdownEscapeLinkText(linkedPageTitle)}](${destinationLink})`;
            } else {
              return `[New Page](https://arbital.com/edit/)`
            }
          } else {
            // Formatted like [id title]
            // Split on the first space
            const spaceIndex = insideBrackets.indexOf(' ');
            const linkedPageId = insideBrackets.substr(0, spaceIndex);
            const linkedText = insideBrackets.substr(spaceIndex+1);
            const linkedPageAlias = processedData.pages[linkedPageId]?.alias;
            if (linkedPageAlias) {
              const destinationLink = `http://arbital.com/p/${encodeURIComponent(linkedPageAlias)}`;
              return `[${markdownEscapeLinkText(linkedText)}](destinationLink)`;
            } else {
              return `[${markdownEscapeLinkText(linkedText)}](https://arbital.com/edit/)`;
            }
          }
        }
      )
      let htmlWithLaTeX: string;
      try {
        const htmlNoLaTeX = mdi.render(fixedMarkdown)
        htmlWithLaTeX = await mjPagePromise(htmlNoLaTeX, trimLatexAndAddCSS)
      } catch(e) {
        throw new Error(`Error during Arbital hover-preview markdown/LaTeX conversion for "${pageAlias}"`);
      }
      return {
        html: htmlWithLaTeX,
        title: page.title
      }
    }
  },
};

addGraphQLResolvers(arbitalPageResolvers);

addGraphQLQuery('ArbitalPageData(pageAlias: String): ArbitalPageData');
