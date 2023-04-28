import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { usePostsList } from '../../posts/usePostsList';

import Card from '@material-ui/core/Card'
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';

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
    marginTop: 24
  },
  reason: {
    color: theme.palette.grey[500],
    ...theme.typography.body2,
    maxHeight: 20,
    overflow: "hidden",
    marginBottom: 12,
    '&:hover': {
      opacity: .5
    },
    '& *': {
      visibility: "hidden",
      margin: 0,
      padding: 0,
    },
    '& strong': {
      visibility: "visible",
      fontWeight: 500,
      fontSize: '1rem',
      color: theme.palette.grey[500]
    }
  },
  reasonTooltip: {
    padding: 4,
    paddingLeft: 2,
    paddingRight: 12,
    width: 400,
    fontSize: '1rem',
    marginBottom: 12
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

  const { SingleColumnSection, SectionFooter, LoadMore, LWTooltip, ContentItemBody, ContentStyles, PostsHighlight } = Components
  return <SingleColumnSection className={classes.root}>
    {itemProps?.map(({post}) => 
      <div className={classes.rejectedPost} key={post._id}>
        <div>
          <LWTooltip placement="bottom-start" tooltip={false} clickable title={<Card>
            <ContentStyles contentType='comment'>
              <ContentItemBody className={classes.reasonTooltip}
                dangerouslySetInnerHTML={{__html: post.rejectedReason || '' }}
              />
            </ContentStyles>
          </Card>}>
            <div
              className={classes.reason}
              dangerouslySetInnerHTML={{__html: post.rejectedReason || '' }}
            />
          </LWTooltip>
        </div>
        <div className={classes.title}><Link to={postGetPageUrl(post)}>{post.title}</Link></div>
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

