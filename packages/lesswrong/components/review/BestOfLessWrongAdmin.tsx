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
    // display: "flex",
    // flexWrap: "wrap",
  },
  post: {
    display: "block",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    padding: 3
  },
  postOuterWrapper: {
    borderRight: "2px solid black",
    borderBottom: "2px solid black",
    overflow: "scroll",
    position: "relative",
    width: "50%",
    height: "500px",
    boxSizing: "border-box",
  },
  postInnerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  },
  postWrapper2: {
    overflow: "hidden",
    height: "80vh",
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
  
  return <div className={classes.root}>
    {/* {postsWithArt.slice(0, 2).map((post: any) => {
      return <div className={classes.postWrapper2}>
        <PostsPage key={post._id} fullPost={post} postPreload={post} refetch={() => {}} />
      </div>
    })}   */}
    {postsWithArt.map((post: any) => {
      return <div key={post._id} className={classes.post}><Link to={postGetPageUrl(post)}>{post.title}</Link></div>
    })}
    <hr/>
    {postsWithoutArt.map((post: any) => {
      return <div key={post._id} className={classes.post}><Link to={postGetPageUrl(post)}>{post.title}</Link></div>
    })}
  </div>;
}

const BestOfLessWrongAdminComponent = registerComponent('BestOfLessWrongAdmin', BestOfLessWrongAdmin, {styles});

declare global {
  interface ComponentTypes {
    BestOfLessWrongAdmin: typeof BestOfLessWrongAdminComponent
  }
}
