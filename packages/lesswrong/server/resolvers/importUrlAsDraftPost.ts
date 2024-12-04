import {extract} from '@extractus/article-extractor'
import { ArxivExtractor } from '../extractors/arxivExtractor'
import { getLatestContentsRevision } from '@/lib/collections/revisions/helpers';

import Posts from '../../lib/collections/posts/collection'
import {addGraphQLSchema, createMutator, sanitize} from '../vulcan-lib'
import {fetchFragmentSingle} from '../fetchFragment'
import {defineQuery} from '@/server/utils/serverGraphqlUtil.ts'
import Users from '@/lib/collections/users/collection'
import { ForeignSiteImportData } from '@/components/posts/ImportExternalPost'

// Define CoauthorStatus type
addGraphQLSchema(`
  type CoauthorStatus {
    userId: String
    confirmed: Boolean
    requested: Boolean
  }
`);

// Define WebsiteData GraphQL type
addGraphQLSchema(`
  type ForeignSiteImportData {
    _id: String!
    slug: String
    title: String
    url: String
    postedAt: Date
    createdAt: Date
    userId: String
    modifiedAt: Date
    draft: Boolean
    content: String
    coauthorStatuses: [CoauthorStatus]
  }
`);

// todo various url validation
// mostly client side, but also mb avoid links to lw, eaf, etc
export async function importUrlAsDraftPost(url: string, context: ResolverContext): Promise<ForeignSiteImportData> {
  if (!context.currentUser) {
    throw new Error('You must be logged in to fetch website HTML.')
  }

  const reviewUser = await Users.findOne({slug: 'review-bot'})
  if (!reviewUser) {
    throw new Error('Misconfiguration: Failed to find review user')
  }

    // todo what if I want to delete failed attempts and try again
  // mb deletedDraft - false?
  const existingPost = await fetchFragmentSingle({
    collectionName: 'Posts',
    fragmentName: 'PostsEditQueryFragment',
    currentUser: context.currentUser,
    selector: {url, userId: reviewUser._id},
    context,
  })

  if (existingPost) {
    const latestRevision = await getLatestContentsRevision(existingPost, context);
    return { _id: existingPost._id, slug: existingPost.slug, title: existingPost.title, url: existingPost.url, postedAt: existingPost.postedAt, createdAt: existingPost.createdAt, userId: existingPost.userId, coauthorStatuses: existingPost.coauthorStatuses, draft: existingPost.draft, modifiedAt: existingPost.modifiedAt, content: sanitize(latestRevision?.html ?? '')} 
  }

  let extractedData
  
  if (url.toLowerCase().includes('arxiv.org')) {
    const arxivData = await ArxivExtractor.extract(url)

    // take the abstract and prepend the authors list and append a hyperlink to the original with the text "Read the full paper"
    const annotatedContents = `<p><strong>By ${arxivData.authors.join(", ")}</strong></p>
<h2>Abstract</h2>
<blockquote>${arxivData.abstract}</blockquote>
<p><a href="${arxivData.pdfUrl}">Read the full paper</a></p>`

    extractedData = {
      title: arxivData.title,
      content: annotatedContents,
      published: arxivData.published,
    }
  } else {
    extractedData = await extract(url)
    if (!extractedData) {
      throw new Error('Failed to extract data from URL')
    }
  }

  const {data } = await createMutator({
    collection: Posts,
    document: {
      userId: reviewUser._id,
      title: extractedData.title,
      url: url,
      contents: {originalContents: {data: extractedData.content, type: 'ckEditorMarkup'}},
      postedAt: extractedData.published ? new Date(extractedData.published) : undefined,
      modifiedAt: new Date(),
      coauthorStatuses: [{userId: context.currentUser._id, confirmed: true, requested: true}],
      hasCoauthorPermission: true,
      draft: true,
      contents_latest: sanitize(extractedData.content ?? ''),
    } as Partial<DbPost>,
    currentUser: context.currentUser,
    validate: false,
  })

  if (!data) {
    throw new Error('Failed to create post');
  }

  const latestRevision = await getLatestContentsRevision(data, context);

  return {
    _id: data._id,
    slug: data.slug ?? null,
    title: data.title ?? null,
    url: data.url ?? null,
    postedAt: data.postedAt ?? null,
    createdAt: data.createdAt ?? null,
    userId: data.userId ?? null,
    modifiedAt: data.modifiedAt ?? null,
    draft: data.draft ?? false,
    content: latestRevision?.html ?? '',
    coauthorStatuses: data.coauthorStatuses ?? null,
  }
}

defineQuery({
  name: 'importUrlAsDraftPost',
  argTypes: '(url: String!)',
  resultType: 'ForeignSiteImportData!',
  fn: async (_root: void, {url}: { url: string }, context: ResolverContext): Promise<ForeignSiteImportData> => 
    importUrlAsDraftPost(url, context)
})
