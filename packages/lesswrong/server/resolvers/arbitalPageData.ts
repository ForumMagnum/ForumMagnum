import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import fetch from 'node-fetch'
import markdownIt from 'markdown-it'
import markdownItMathjax from '../editor/markdown-mathjax'
import { mjPagePromise } from '../editor/make_editable_callbacks';
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

const arbitalPageResolvers = {
  Query: {
    async ArbitalPageData(root: void, { pageAlias }: { pageAlias:string }, context: ResolverContext) {
      const rawRoomData:any = await getArbitalPageData(pageAlias)
      if (!rawRoomData) return null
      let processedData;
      try {
        processedData = JSON.parse(rawRoomData)
      } catch(e) {
        throw new Error(`Received invalid JSON for Arbital hover preview for page "${pageAlias}"`);
      }
      if (!processedData?.pages) return null;
      const page:any = Object.values(processedData.pages).find((page:any) => page?.alias === pageAlias)
      if (!page) return null
      const textField = page.summaries?.Summary || page.clickbait
      const fixedMarkdown = textField.replace(/\[([a-zA-Z0-9]+)?\s*([^\]]*)\]/g, (fullMatch: string, cg1: string, cg2: string, cg3: string) => {
        const linkedPageAlias = processedData.pages[cg1]?.alias
        if (!cg1 || !linkedPageAlias) {
          return `[${cg2}](https://arbital.com/edit/)`
        }
        return `[${cg2}](https://arbital.com/p/${linkedPageAlias})`
      })
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
