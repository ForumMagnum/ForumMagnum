import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewComments,
  }
})

const SunshineNewCommentsList = ({ terms, classes }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const { results, totalCount } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: true,
  });
  const { SunshineListCount, SunshineNewCommentsItem, SunshineListTitle } = Components
  
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

const SunshineNewCommentsListComponent = registerComponent('SunshineNewCommentsList', SunshineNewCommentsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewCommentsList: typeof SunshineNewCommentsListComponent
  }
}

