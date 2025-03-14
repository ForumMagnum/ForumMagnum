// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments'; 
import { gql, useQuery } from '@apollo/client';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';

const styles = (theme: ThemeType) => ({
  root: {

  },
  post: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden"
  }
});

export const BestOfLessWrongAdmin = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { data, loading } = useQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);

  const { PostsPage } = Components

  const posts = data?.GetAllReviewWinners?.filter((post: any) => post.reviewWinner.reviewYear === 2023) ?? []

  const postsWithArt = posts?.filter((post: any) => post.reviewWinner.reviewWinnerArt) ?? []
  const postsWithoutArt = posts?.filter((post: any) => !post.reviewWinner.reviewWinnerArt) ?? []
  console.log(posts)
  
  return <div className={classes.root}>
    {postsWithArt.slice(0, 2).map((post: any) => {
      return <div key={post._id} className={classes.post}>
        <PostsPage key={post._id} fullPost={post} postPreload={post} refetch={() => {}} />
      </div>
    })}  
    {/* {postsWithArt[0]} */}
    {/* {postsWithArt.map((post: any) => {
      return <div key={post._id}><Link to={postGetPageUrl(post)}>{post.title} ({post.reviewWinner.reviewWinnerArts?.length})</Link></div>
    })}
    <hr/>
    {postsWithoutArt.map((post: any) => {
      return <div key={post._id}><Link to={postGetPageUrl(post)}>{post.title} ({post.reviewWinner.reviewWinnerArts?.length})</Link></div>
    })} */}
  </div>;
}

const BestOfLessWrongAdminComponent = registerComponent('BestOfLessWrongAdmin', BestOfLessWrongAdmin, {styles});

declare global {
  interface ComponentTypes {
    BestOfLessWrongAdmin: typeof BestOfLessWrongAdminComponent
  }
}
