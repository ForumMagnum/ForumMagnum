import React, { useState, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { postBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  description: {
    ...postBodyStyles(theme),
    marginLeft: 10,
    marginBottom: 8,
    marginTop: 16
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 1.1,
    fontStyle: "italic",
    marginTop: 20,
  },
  posts: {
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8
    }
  }
});

const ChaptersItem = ({ chapter, canEdit, classes }: {
  chapter: ChaptersFragment,
  canEdit: boolean,
  classes: ClassesType,
}) => {
  const [edit,setEdit] = useState(false);

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showChapter = useCallback(() => {
    setEdit(false);
  }, []);

  const { ChaptersEditForm, SectionTitle, SectionFooter,
    SectionButton, SequencesPostsList, ContentItemBody } = Components
  const html = chapter.contents?.html || ""
  if (edit) return (
    <ChaptersEditForm
      documentId={chapter._id}
      successCallback={showChapter}
      cancelCallback={showChapter}
    />
  )
  const editButton = <SectionButton>
    <a onClick={showEdit}>Add/Remove Posts</a>
  </SectionButton>

  return (
    <div>
      {chapter.title && <SectionTitle title={chapter.title}>
        {canEdit && editButton}
      </SectionTitle>}
      {html && <div className={classes.description}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: html}}
          description={`chapter ${chapter._id}`}
        />
      </div>}
      <div className={classes.posts}>
        <AnalyticsContext chapter={chapter._id} capturePostItemOnMount>
          <SequencesPostsList posts={chapter.posts} chapter={chapter} />
        </AnalyticsContext>
      </div>
      {!chapter.title && canEdit && <SectionFooter>{editButton}</SectionFooter>}
    </div>
  )
}

const ChaptersItemComponent = registerComponent('ChaptersItem', ChaptersItem, {styles});

declare global {
  interface ComponentTypes {
    ChaptersItem: typeof ChaptersItemComponent
  }
}
