import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import ChaptersEditForm from "@/components/sequences/ChaptersEditForm";
import ChapterTitle from "@/components/sequences/ChapterTitle";
import SectionFooter from "@/components/common/SectionFooter";
import SectionButton from "@/components/common/SectionButton";
import ContentItemBody from "@/components/common/ContentItemBody";
import { ContentStyles } from "@/components/common/ContentStyles";
import PostsItem from "@/components/posts/PostsItem";

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
            return <div key={chapter._id + post._id}>
              <PostsItem sequenceId={chapter.sequenceId} post={post} showReadCheckbox/>
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

export default ChaptersItemComponent;
