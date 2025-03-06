import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import OmegaIcon from "@/components/icons/OmegaIcon";
import AFSuggestCommentsItem from "@/components/sunshineDashboard/AFSuggestCommentsItem";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestCommentsList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loadMoreProps } = useMulti({
    terms: {view:"alignmentSuggestedComments"},
    enableTotal: true, itemsPerPage: 30,
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
    fetchPolicy: 'cache-and-network',
  });
  if (results && results.length) {
    return <div>
      <SunshineListTitle>
        <div><OmegaIcon className={classes.icon}/> Suggested Comments</div>
      </SunshineListTitle>
      {results.map(comment =>
        <div key={comment._id} >
          <AFSuggestCommentsItem comment={comment}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  } else {
    return null
  }
}

const AFSuggestCommentsListComponent = registerComponent('AFSuggestCommentsList', AFSuggestCommentsList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestCommentsList: typeof AFSuggestCommentsListComponent
  }
}

export default AFSuggestCommentsListComponent;

