const { extract } = require('@extractus/article-extractor')
import { ArxivExtractor } from '../extractors/arxivExtractor'
import { getLatestContentsRevision } from '@/server/collections/revisions/helpers';

import { fetchFragmentSingle } from '../fetchFragment'
import Users from '@/server/collections/users/collection'
import { ExternalPostImportData } from '@/components/posts/ExternalPostImporter'
import { eligibleToNominate } from '@/lib/reviewUtils';
import { sanitize } from "../../lib/vulcan-lib/utils";
import gql from 'graphql-tag';
import { createPost } from "../collections/posts/mutations";
import { PostsEditQueryFragment } from '@/lib/collections/posts/fragments';

// todo various url validation
// mostly client side, but also mb avoid links to lw, eaf, etc
export async function importUrlAsDraftPost(url: string, context: ResolverContext): Promise<ExternalPostImportData> {
  if (!context.currentUser) {
    throw new Error('You must be logged in to fetch website HTML.')
  }

  const reviewUser = await Users.findOne({slug: 'review-bot'})
  if (!reviewUser) {
    throw new Error('Misconfiguration: Failed to find review user')
  }

  const existingPost = await fetchFragmentSingle({
    collectionName: 'Posts',
    fragmentDoc: PostsEditQueryFragment,
    currentUser: context.currentUser,
    selector: {url, userId: reviewUser._id, deletedDraft: false},
    context,
  })

  if (existingPost) {
    const latestRevision = await getLatestContentsRevision(existingPost, context);
    const { _id, slug, title, url, postedAt, createdAt, userId, coauthorStatuses, draft, modifiedAt } = existingPost;

    return { 
      alreadyExists: true,
      post: {
        _id,
        slug,
        title,
        url,
        postedAt,
        createdAt,
        userId,
        coauthorStatuses,
        draft,
        modifiedAt,
        content: sanitize(latestRevision?.html ?? '')
      }
    }
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

  const post = await createPost({
    data: {
      userId: reviewUser._id,
      title: extractedData.title,
      url: url,
      contents: {originalContents: {data: sanitize(extractedData.content ?? ''), type: 'ckEditorMarkup'}},
      postedAt: extractedData.published ? new Date(extractedData.published) : undefined,
      coauthorStatuses: [{userId: context.currentUser._id, confirmed: true, requested: true}],
      hasCoauthorPermission: true,
      draft: true,
    }
  }, context);

  if (!post) {
    throw new Error('Failed to create post');
  }

  const latestRevision = await getLatestContentsRevision(post, context);

  return {
    alreadyExists: false,
    post: {
      _id: post._id,
      slug: post.slug ?? null,
      title: post.title ?? null,
      url: post.url ?? null,
      postedAt: post.postedAt ?? null,
      createdAt: post.createdAt ?? null,
      userId: post.userId ?? null,
      modifiedAt: post.modifiedAt ?? null,
      draft: post.draft ?? false,
      content: latestRevision?.html ?? '',
      coauthorStatuses: post.coauthorStatuses ?? null,
    }
  }
}

export const importUrlAsDraftPostTypeDefs = gql`
  type CoauthorStatus {
    userId: String
    confirmed: Boolean
    requested: Boolean
  }
  type ExternalPost {
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
  type ExternalPostImportData {
    alreadyExists: Boolean
    post: ExternalPost
  }
  extend type Mutation {
    importUrlAsDraftPost(url: String!): ExternalPostImportData!
  }
`

export const importUrlAsDraftPostGqlMutation = {
  async importUrlAsDraftPost (_root: void, {url}: { url: string }, context: ResolverContext): Promise<ExternalPostImportData> {
    if (!context.currentUser || !eligibleToNominate(context.currentUser)) {
      throw new Error('You are not eligible to import external posts');
    }
    return importUrlAsDraftPost(url, context)
  }
}
