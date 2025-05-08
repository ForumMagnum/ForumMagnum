import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { SunshineListTitle } from "./SunshineListTitle";
import { OmegaIcon } from "../icons/OmegaIcon";
import { AFSuggestCommentsItem } from "./AFSuggestCommentsItem";
import { LoadMore } from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestCommentsListInner = ({ classes }: {
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

export const AFSuggestCommentsList = registerComponent('AFSuggestCommentsList', AFSuggestCommentsListInner, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestCommentsList: typeof AFSuggestCommentsList
  }
}

