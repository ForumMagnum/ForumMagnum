import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { Link } from '../../lib/reactRouterWrapper';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16,
    width: 450
  },
  title: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
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
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  wordcount: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    marginTop: 12,
    fontSize: "1rem"
  }
});

export const SequencesHoverOver = ({classes, sequence, showAuthor=true}: {
  classes: ClassesType,
  sequence: SequencesPageFragment|null,
  showAuthor?: boolean
}) => {
  const { SequencesSmallPostLink, Loading, ContentStyles, ContentItemTruncated, UsersName, LWTooltip, ChapterTitle } = Components

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
  
  return <Card className={classes.root}>
    {sequence && <Link to={getCollectionOrSequenceUrl(sequence)}>
      <div className={classes.title}>{sequence.title}</div>
    </Link>}
    { showAuthor && sequence?.user &&
      <div className={classes.author}>
        by <UsersName user={sequence?.user} />
      </div>}
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
    {/* show a loading spinner if either sequences hasn't loaded or chapters haven't loaded */}
    {(!sequence || (!chapters && chaptersLoading)) && <Loading/>}
    {sequence && chapters?.flatMap(chapter => {
      return <div>
        {chapter.title && <ChapterTitle title={chapter.title}/>}
        {chapter.posts.map(post => <SequencesSmallPostLink 
          key={sequence._id + post._id} 
          post={post}
          sequenceId={sequence._id}
        />)}
      </div>
    })}
    <LWTooltip title={<div> ({totalWordcount.toLocaleString("en-US")} words)</div>}>
      <div className={classes.wordcount}>{Math.round(totalWordcount / 300)} min read</div>
    </LWTooltip>
  </Card>;
}

const SequencesHoverOverComponent = registerComponent('SequencesHoverOver', SequencesHoverOver, {styles});

declare global {
  interface ComponentTypes {
    SequencesHoverOver: typeof SequencesHoverOverComponent
  }
}

