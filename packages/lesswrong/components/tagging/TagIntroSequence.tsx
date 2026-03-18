import React, { useState } from 'react'
import { AnalyticsContext } from '../../lib/analyticsEvents'
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import PostsItemIntroSequence from "../posts/PostsItemIntroSequence";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const ChaptersFragmentMultiQuery = gql(`
  query multiChapterTagIntroSequenceQuery($selector: ChapterSelector, $limit: Int, $enableTotal: Boolean) {
    chapters(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ChaptersFragment
      }
      totalCount
    }
  }
`);

const PREVIEW_N = 3

const styles = defineStyles("TagIntroSequence", (theme: ThemeType) => ({
  root: {
    marginBottom: 16,
  },
}))

const TagIntroSequence = ({tag}: {
  tag: TagPageFragment,
}) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(ChaptersFragmentMultiQuery, {
    variables: {
      selector: { SequenceChapters: { sequenceId: tag.sequence?._id } },
      limit: 100,
      enableTotal: false,
    },
    skip: !tag.sequence,
    notifyOnNetworkStatusChange: true,
  });

  const seqChapters = data?.chapters?.results;
  const [loadedMore, setLoadedMore] = useState(false)

  const sequence = tag.sequence
  if (!sequence) return null

  // Get all the posts together, we're ignoring chapters here
  let posts = seqChapters?.flatMap(chapter => chapter.posts) || []
  const totalCount = posts.length
  if (!loadedMore) {
    posts = posts.slice(0, PREVIEW_N)
  }

  return <div className={classes.root}>
    <SectionTitle title={`Introduction to ${tag.name}`} />
    <AnalyticsContext listContext={'tagIntroSequnce'}>
      {loading && <Loading />}
      {posts.map((post, i) =>
        <PostsItemIntroSequence
          key={post._id}
          post={post}
          sequence={sequence}
          withImage={i === 0}
        />)}
      {totalCount > PREVIEW_N && !loadedMore && <LoadMore
        loadMore={() => setLoadedMore(true)}
        count={PREVIEW_N}
        totalCount={totalCount}
        afterPostsListMarginTop
      />}
    </AnalyticsContext>
  </div>
}

export default TagIntroSequence


