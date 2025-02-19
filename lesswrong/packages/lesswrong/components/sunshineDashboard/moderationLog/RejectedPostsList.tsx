import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { usePostsList } from '../../posts/usePostsList';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';

const styles = (theme: ThemeType) => ({
  title: {
    ...theme.typography.display1,
    ...theme.typography.postStyle,
    marginTop: 5,
    marginBottom: 16
  },
  rejectedPost: {
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    marginBottom: 24
  },
  reason: {
    marginLeft: "auto"
  }
});

export const RejectedPostsList = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    children,
    loading,
    loadMore,
    loadMoreProps,
    itemProps,
  } = usePostsList({terms:{view:'rejected'}, enableTotal: true});

  const { SingleColumnSection, SectionFooter, LoadMore, PostsHighlight, RejectedReasonDisplay, FormatDate, MetaInfo, Row } = Components

  return <SingleColumnSection>
    {itemProps?.map(({post}) => <div key={post._id} className={classes.rejectedPost}>
      <Row justifyContent="space-between">
        <MetaInfo><FormatDate date={post.postedAt}/></MetaInfo>
        <span className={classes.reason}>
          <RejectedReasonDisplay reason={post.rejectedReason}/>
        </span>
      </Row>
      <div className={classes.title}>
        <Link rel="nofollow" to={postGetPageUrl(post)}>{post.title}</Link>
      </div>
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

const RejectedPostsListComponent = registerComponent('RejectedPostsList', RejectedPostsList, {styles});

declare global {
  interface ComponentTypes {
    RejectedPostsList: typeof RejectedPostsListComponent
  }
}

