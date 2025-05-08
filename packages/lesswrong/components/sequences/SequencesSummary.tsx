import React, { FC, ReactNode } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Card } from "@/components/widgets/Paper";
import { Link } from '../../lib/reactRouterWrapper';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';
import { FRIENDLY_HOVER_OVER_WIDTH } from '../common/FriendlyHoverOver';
import { UsersName } from "../users/UsersName";
import { SequencesSmallPostLink } from "./SequencesSmallPostLink";
import { ChapterTitle } from "./ChapterTitle";
import { Loading } from "../vulcan-core/Loading";
import { ContentStyles } from "../common/ContentStyles";
import { ContentItemTruncated } from "../common/ContentItemTruncated";
import { LWTooltip } from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    width: isFriendlyUI ? FRIENDLY_HOVER_OVER_WIDTH : 450,
  },
  title: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: "1.3rem",
      fontWeight: 700,
      lineHeight: "130%",
    }),
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    paddingTop: 8,
    paddingBottom: 8,
  },
  author: {
    color: theme.palette.text.dim,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 13,
      fontWeight: 500,
      marginTop: 10,
      marginBottom: 14,
    }),
  },
  wordcount: isFriendlyUI
    ? {}
    : {
      ...theme.typography.commentStyle,
      color: theme.palette.grey[500],
      marginTop: 12,
      fontSize: "1rem"
    },
  morePosts: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    size: 14,
  },
});

const SequenceMeta: FC<{
  user?: UsersMinimumInfo,
  postCount: number,
  wordCountNode: ReactNode,
  classes: ClassesType<typeof styles>,
}> = ({user, postCount, wordCountNode, classes}) => {
  return isFriendlyUI
    ? (
      <div className={classes.author}>
        <UsersName user={user} />
        {" · "}
        {postCount} post{postCount === 1 ? "" : "s"}
        {" · "}
        {wordCountNode}
      </div>
    )
    : (
      <div className={classes.author}>
        by <UsersName user={user} />
      </div>
    );
}

const SequencePosts = ({sequence, chapters, maxPosts, totalPosts, classes}: {
  sequence: SequencesPageFragment,
  chapters: ChaptersFragment[],
  maxPosts: number,
  totalPosts: number,
  classes: ClassesType<typeof styles>,
}) => {
  let postsRendered = 0;
  const nodes: ReactNode[] = [];
  for (let i = 0; i < chapters.length && postsRendered < maxPosts; i++) {
    const chapter = chapters[i];
    const posts = chapter.posts.slice(0, maxPosts - postsRendered);
    nodes.push(
      <div key={chapter._id}>
        {chapter.title && <ChapterTitle title={chapter.title}/>}
        {posts.map(post => (
          <SequencesSmallPostLink
            key={sequence._id + post._id}
            post={post}
            sequenceId={sequence._id}
          />
        ))}
      </div>
    );
  }
  if (maxPosts < totalPosts) {
    nodes.push(
      <div className={classes.morePosts}>
        +{totalPosts - maxPosts} more
      </div>
    );
  }
  return <>{nodes}</>;
}

export const SequencesSummaryInner = ({classes, sequence, showAuthor=true, maxPosts}: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageFragment|null,
  showAuthor?: boolean
  maxPosts?: number,
}) => {
  const { results: chapters, loading: chaptersLoading } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: sequence?._id,
      limit: 100
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false,
  });
  const posts = chapters?.flatMap(chapter => chapter.posts ?? []) ?? []
  const totalWordcount = posts.reduce((prev, curr) => prev + (curr?.contents?.wordCount || 0), 0)

  const wordCountNode = (
    <LWTooltip title={<div> ({totalWordcount.toLocaleString("en-US")} words)</div>}>
      <div className={classes.wordcount}>{Math.round(totalWordcount / 300)} min read</div>
    </LWTooltip>
  );

  if (typeof maxPosts !== "number") {
    maxPosts = posts.length;
  }

  return <Card className={classes.root}>
    {sequence && <Link to={getCollectionOrSequenceUrl(sequence)}>
      <div className={classes.title}>{sequence.title}</div>
    </Link>}
    {showAuthor && sequence?.user &&
      <SequenceMeta
        user={sequence?.user}
        postCount={sequence?.postsCount ?? 0}
        wordCountNode={wordCountNode}
        classes={classes}
      />
    }
    {!isFriendlyUI &&
      <ContentStyles contentType="postHighlight" className={classes.description}>
        <ContentItemTruncated
          maxLengthWords={100}
          graceWords={20}
          rawWordCount={sequence?.contents?.wordCount || 0}
          expanded={false}
          getTruncatedSuffix={() => null}
          dangerouslySetInnerHTML={{__html: sequence?.contents?.htmlHighlight || ""}}
          description={`sequence ${sequence?._id}`}
        />
      </ContentStyles>
    }
    {/* show a loading spinner if either sequences hasn't loaded or chapters haven't loaded */}
    {(!sequence || (!chapters && chaptersLoading)) && <Loading/>}
    {sequence && chapters &&
      <SequencePosts
        sequence={sequence}
        chapters={chapters}
        maxPosts={maxPosts}
        totalPosts={posts.length}
        classes={classes}
      />
    }
    {!isFriendlyUI && wordCountNode}
  </Card>;
}

export const SequencesSummary = registerComponent('SequencesSummary', SequencesSummaryInner, {styles});

declare global {
  interface ComponentTypes {
    SequencesSummary: typeof SequencesSummary
  }
}
