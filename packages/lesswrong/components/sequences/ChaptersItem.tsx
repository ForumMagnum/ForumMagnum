import React, { useState, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useSingle } from '@/lib/crud/withSingle';
import ChaptersEditForm from "./ChaptersEditForm";
import ChapterTitle from "./ChapterTitle";
import SectionFooter from "../common/SectionFooter";
import SectionButton from "../common/SectionButton";
import ContentItemBody from "../common/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import PostsItem from "../posts/PostsItem";

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

  const { document: editableChapter } = useSingle({
    collectionName: 'Chapters',
    fragmentName: 'ChaptersEdit',
    documentId: chapter._id,
    skip: !canEdit,
  });

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showChapter = useCallback(() => {
    setEdit(false);
  }, []);
  const html = chapter.contents?.html || ""

  if (edit && editableChapter) return (
    <ChaptersEditForm
      chapter={editableChapter}
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
              <PostsItem sequenceId={chapter.sequenceId ?? undefined} post={post} showReadCheckbox/>
            </div>
          })}
        </AnalyticsContext>
      </div>
      {canEdit && <SectionFooter>{editButton}</SectionFooter>}
    </div>
  )
}

export default registerComponent('ChaptersItem', ChaptersItem, {styles});


