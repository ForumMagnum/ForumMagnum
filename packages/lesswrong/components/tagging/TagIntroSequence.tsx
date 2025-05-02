import React, { useState } from 'react'
import { AnalyticsContext } from '../../lib/analyticsEvents'
import { useMulti } from '../../lib/crud/withMulti'
import { Components, registerComponent } from '../../lib/vulcan-lib/components'

const PREVIEW_N = 3

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 16,
  },
})

const TagIntroSequence = ({tag, classes}: {
  tag: TagPageFragment,
  classes: ClassesType<typeof styles>
}) => {
  const { SectionTitle, Loading, PostsItemIntroSequence, LoadMore } = Components
  const { results: seqChapters, loading } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: tag.sequence?._id,
      limit: 100,
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false,
    skip: !tag.sequence,
  });
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

const TagIntroSequenceComponent = registerComponent("TagIntroSequence", TagIntroSequence, {styles})

declare global {
  interface ComponentTypes {
    TagIntroSequence: typeof TagIntroSequenceComponent
  }
}
