import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import SunshineListCount from "@/components/sunshineDashboard/SunshineListCount";
import SunshineNewCommentsItem from "@/components/sunshineDashboard/SunshineNewCommentsItem";
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";

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

export default SunshineNewCommentsListComponent;

