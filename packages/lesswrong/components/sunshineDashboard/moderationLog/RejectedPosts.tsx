import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { usePostsList } from '../../posts/usePostsList';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { htmlToText } from 'html-to-text';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display1,
    ...theme.typography.postStyle,
    marginTop: 5,
    marginBottom: 12
  },
  rejectedPost: {
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    marginBottom: 24
  },
});

export const RejectedPosts = ({classes}: {
  classes: ClassesType,
}) => {
  const {
    children,
    loading,
    loadMore,
    loadMoreProps,
    itemProps,
  }= usePostsList({terms:{view:'rejected'}, enableTotal: true});

  const { SingleColumnSection, SectionFooter, LoadMore, PostsHighlight, RejectedReason, FormatDate, MetaInfo } = Components

  return <SingleColumnSection className={classes.root}>
    {itemProps?.map(({post}) => <div key={post._id} className={classes.rejectedPost}>
      <div className={classes.title}><Link to={postGetPageUrl(post)}>{post.title}</Link></div>
      <p>
        <MetaInfo><FormatDate date={post.postedAt}/></MetaInfo>
        <RejectedReason reason={post.rejectedReason}/>
      </p>
      <PostsHighlight post={post} maxLengthWords={50}/>
    </div>
    )}
    <SectionFooter>
      <LoadMore
        {...loadMoreProps}
        loading={loading}
        loadMore={loadMore}
        sectionFooterStyles
      />
      { children }
    </SectionFooter>
  </SingleColumnSection>;
}

const RejectedPostsComponent = registerComponent('RejectedPosts', RejectedPosts, {styles});

declare global {
  interface ComponentTypes {
    RejectedPosts: typeof RejectedPostsComponent
  }
}

