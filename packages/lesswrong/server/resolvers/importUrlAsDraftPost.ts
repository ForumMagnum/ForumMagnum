const { extractFromHtml } = require('@extractus/article-extractor')
import { ArxivExtractor } from '../extractors/arxivExtractor'
import { getLatestContentsRevision } from '@/server/collections/revisions/helpers';
import { fetchFragmentSingle } from '../fetchFragment'
import Users from '@/server/collections/users/collection'
import { ExternalPostImportData } from '@/components/posts/ExternalPostImporter'
import { eligibleToNominate } from '@/lib/reviewUtils';
import { sanitize } from "@/lib/utils/sanitize";
import { getUserDefaultRichTextEditor } from "@/lib/editor/defaultRichTextEditor";
import gql from 'graphql-tag';
import { createPost } from "../collections/posts/mutations";
import { PostsEditQueryFragment } from '@/lib/collections/posts/fragments';
import { fetchPublicUrl, parsePublicHttpUrl } from '@/server/utils/fetchPublicUrl';

const IMPORT_FETCH_TIMEOUT_MS = 15000

async function fetchArticleHtml(url: string): Promise<string> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), IMPORT_FETCH_TIMEOUT_MS)
  try {
    const response = await fetchPublicUrl(url, {
      signal: abortController.signal,
      headers: {
        // Same user-agent that article-extractor uses when it fetches pages itself
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
      },
    })
    if (response.status >= 400) {
      throw new Error(`Request failed with error code ${response.status}`)
    }
    return (await response.text()).trim()
  } finally {
    clearTimeout(timeout)
  }
}

interface ExternalPostImportDataWithDates extends Omit<ExternalPostImportData, 'post'> {
  post: Omit<ExternalPostImportData['post'], 'postedAt' | 'createdAt' | 'modifiedAt'> & {
    postedAt: Date | null;
    createdAt: Date | null;
    modifiedAt: Date | null;
  }
}

// todo various url validation
// mostly client side, but also mb avoid links to lw, eaf, etc
export async function importUrlAsDraftPost(url: string, context: ResolverContext): Promise<ExternalPostImportDataWithDates> {
  if (!context.currentUser) {
    throw new Error('You must be logged in to fetch website HTML.')
  }

  // Throws if the URL doesn't look like a public web page
  parsePublicHttpUrl(url)

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
    const { _id, slug, title, url, postedAt, createdAt, userId, coauthorUserIds, draft, modifiedAt } = existingPost;

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
        coauthorUserIds,
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
    const html = await fetchArticleHtml(url)
    extractedData = html ? await extractFromHtml(html, url) : null
    if (!extractedData) {
      throw new Error('Failed to extract data from URL')
    }
  }

  const post = await createPost({
    data: {
      userId: reviewUser._id,
      title: extractedData.title,
      url: url,
      contents: {originalContents: {data: sanitize(extractedData.content ?? ''), type: getUserDefaultRichTextEditor(context.currentUser)}},
      postedAt: extractedData.published ? new Date(extractedData.published) : undefined,
      coauthorUserIds: [context.currentUser._id],
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
      coauthorUserIds: post.coauthorUserIds ?? null,
    }
  }
}

export const importUrlAsDraftPostTypeDefs = gql`
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
    coauthorUserIds: [String!]
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
  async importUrlAsDraftPost (_root: void, {url}: { url: string }, context: ResolverContext): Promise<ExternalPostImportDataWithDates> {
    if (!context.currentUser || !eligibleToNominate(context.currentUser)) {
      throw new Error('You are not eligible to import external posts');
    }
    return importUrlAsDraftPost(url, context)
  }
}
