import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { SunshineListCount } from "./SunshineListCount";
import { SunshineNewCommentsItem } from "./SunshineNewCommentsItem";
import { SunshineListTitle } from "./SunshineListTitle";

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewComments,
  }
})

const SunshineNewCommentsListInner = ({ terms, classes }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const { results, totalCount } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: true,
  });
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Comments <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(comment =>
          <div key={comment._id} >
            <SunshineNewCommentsItem comment={comment}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

export const SunshineNewCommentsList = registerComponent('SunshineNewCommentsList', SunshineNewCommentsListInner, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewCommentsList: typeof SunshineNewCommentsList
  }
}

