import React, { useState, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useLocation } from '@/lib/routeUtil';
import { sequence } from 'fp-ts/lib/Traversable';
import { getThinkSequencePostUrl } from '../thinkPage/ThinkLink';

const styles = (theme: ThemeType) => ({
  description: {
    marginLeft: 10,
    marginBottom: 24,
    marginTop: 16
  },
  subtitle: {
    fontSize: "1.16em",
    lineHeight: 1.1,
    fontStyle: "italic",
    marginTop: 12,
  },
  posts: {
      paddingLeft: 8,
      paddingRight: 8
  },
  title: {
    display: "flex",
    justifyContent: "space-between"
  }
});

const ChaptersItem = ({ chapter, canEdit, classes }: {
  chapter: ChaptersFragment,
  canEdit: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [edit,setEdit] = useState(false);

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showChapter = useCallback(() => {
    setEdit(false);
  }, []);

  const { pathname } = useLocation();
  const isThink = pathname.includes('/think');

  const { ChaptersEditForm, ChapterTitle, SectionFooter,
    SectionButton, ContentItemBody, ContentStyles, PostsItem } = Components
  const html = chapter.contents?.html || ""

  if (edit) return (
    <ChaptersEditForm
      documentId={chapter._id}
      postIds={chapter.postIds}
      successCallback={showChapter}
      cancelCallback={showChapter}
    />
  )

  const editButton = <SectionButton>
    <a onClick={showEdit}>Add/Remove Posts</a>
  </SectionButton>

  return (
    <div>
      <div className={classes.title}>
        {chapter.title && <ChapterTitle title={chapter.title} large/>}
      </div>
      {html && <ContentStyles contentType="post" className={classes.description}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: html}}
          description={`chapter ${chapter._id}`}
        />
      </ContentStyles>}
      <div className={classes.posts}>
        <AnalyticsContext chapter={chapter._id} capturePostItemOnMount>
          {chapter.posts.map(post => {
            const postLinkProps = isThink ? {postLink: getThinkSequencePostUrl(post, chapter.sequenceId)} : {};
            return <div key={chapter._id + post._id}>
              <PostsItem sequenceId={chapter.sequenceId} post={post} showReadCheckbox {...postLinkProps}/>
            </div>
          })}
        </AnalyticsContext>
      </div>
      {canEdit && <SectionFooter>{editButton}</SectionFooter>}
    </div>
  )
}

const ChaptersItemComponent = registerComponent('ChaptersItem', ChaptersItem, {styles});

declare global {
  interface ComponentTypes {
    ChaptersItem: typeof ChaptersItemComponent
  }
}
