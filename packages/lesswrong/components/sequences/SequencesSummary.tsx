import { Card } from "@/components/widgets/Paper";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { FC, ReactNode } from 'react';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ContentItemTruncated from "../common/ContentItemTruncated";
import ContentStyles from "../common/ContentStyles";
import LWTooltip from "../common/LWTooltip";
import UsersName from "../users/UsersName";
import Loading from "../vulcan-core/Loading";
import ChapterTitle from "./ChapterTitle";
import SequencesSmallPostLink from "./SequencesSmallPostLink";

const ChaptersFragmentMultiQuery = gql(`
  query multiChapterSequencesSummaryQuery($selector: ChapterSelector, $limit: Int, $enableTotal: Boolean) {
    chapters(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ChaptersFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    width: 450,
  },
  title: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    paddingTop: 8,
    paddingBottom: 8,
  },
  author: {
    color: theme.palette.text.dim
  },
  wordcount: {
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
  return (
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

export const SequencesSummary = ({classes, sequence, showAuthor=true, maxPosts}: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageFragment|null,
  showAuthor?: boolean
  maxPosts?: number,
}) => {
  const { data, loading: chaptersLoading } = useQuery(ChaptersFragmentMultiQuery, {
    variables: {
      selector: { SequenceChapters: { sequenceId: sequence?._id } },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const chapters = data?.chapters?.results;
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
    {<ContentStyles contentType="postHighlight" className={classes.description}>
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
    {wordCountNode}
  </Card>;
}

export default registerComponent('SequencesSummary', SequencesSummary, {styles});


