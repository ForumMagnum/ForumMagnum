import {extract} from '@extractus/article-extractor'

import Posts from '../../lib/collections/posts/collection'
import {createMutator} from '../vulcan-lib'
import {fetchFragmentSingle} from '../fetchFragment'
import {defineQuery} from '@/server/utils/serverGraphqlUtil.ts'
import Users from '@/lib/collections/users/collection'
import { WebsiteData } from '@/components/posts/ImportExternalPost'

// todo various url validation
// mostly client side, but also mb avoid links to lw, eaf, etc
export async function importUrlAsDraftPost(url: string, context: ResolverContext): Promise<WebsiteData> {
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
    return { _id: existingPost._id, slug: existingPost.slug, title: existingPost.title, url: existingPost.url, postedAt: existingPost.postedAt, createdAt: existingPost.createdAt, userId: existingPost.userId, coauthorStatuses: existingPost.coauthorStatuses, draft: existingPost.draft, modifiedAt: existingPost.modifiedAt} 
  }

  const extractedData = await extract(url)
  if (!extractedData) {
    throw new Error('Failed to extract data from URL')
  }

  const {data} = await createMutator({
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
      draft: true
    } as Partial<DbPost>,
    currentUser: context.currentUser,
    validate: false,
  })
  return {_id: data?._id, slug: data?.slug, title: data?.title, url: data?.url, postedAt: data?.postedAt, createdAt: data?.createdAt, userId: data?.userId, coauthorStatuses: data?.coauthorStatuses, draft: data?.draft, modifiedAt: data?.modifiedAt}
}

defineQuery({
  name: 'importUrlAsDraftPost',
  argTypes: '(url: String!)',
  //todo
  resultType: 'JSON!',
  fn: async (_root: void, {url}: { url: string }, context: ResolverContext): Promise<WebsiteData> => 
    importUrlAsDraftPost(url, context)
})
