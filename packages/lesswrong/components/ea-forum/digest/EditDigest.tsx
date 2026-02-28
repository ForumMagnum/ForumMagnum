import { InDigestStatusOption } from '../../../lib/collections/digests/helpers';

export type PostWithRating = PostsListWithVotes & {rating: number}
export type DigestPost = {
  _id: string,
  emailDigestStatus: InDigestStatusOption,
  onsiteDigestStatus: InDigestStatusOption
}

