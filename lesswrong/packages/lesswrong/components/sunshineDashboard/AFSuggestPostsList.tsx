import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import OmegaIcon from "@/components/icons/OmegaIcon";
import AFSuggestPostsItem from "@/components/sunshineDashboard/AFSuggestPostsItem";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestPostsList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loadMoreProps } = useMulti({
    terms: {view:"alignmentSuggestedPosts"},
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
    fetchPolicy: 'cache-and-network',
  });
  if (results && results.length) {
    return <div>
      <SunshineListTitle>
        <div><OmegaIcon className={classes.icon}/> Suggested Posts</div>
      </SunshineListTitle>
      {results.map(post =>
        <div key={post._id} >
          <AFSuggestPostsItem post={post}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  } else {
    return null
  }
}

const AFSuggestPostsListComponent = registerComponent('AFSuggestPostsList', AFSuggestPostsList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestPostsList: typeof AFSuggestPostsListComponent
  }
}

export default AFSuggestPostsListComponent;

