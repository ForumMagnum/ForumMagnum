import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { usePostsList } from '../../posts/usePostsList';

import Card from '@material-ui/core/Card'
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
    marginTop: 24
  },
  reasonTooltip: {
    paddingTop: 4,
    paddingBottom: 2,
    paddingLeft: 0,
    paddingRight: 16,
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

  const { SingleColumnSection, SectionFooter, LoadMore, LWTooltip, ContentItemBody, ContentStyles, PostsHighlight, MetaInfo } = Components

  function getShortReason (reason: string|null) {
    const reasonSnippet = htmlToText(reason || "").split(".")[0]
    const bulletStrippedSnippet = reasonSnippet.includes(" * ") ? reasonSnippet.split(" * ")[1] : reasonSnippet
    if (bulletStrippedSnippet) return `Rejected for "${bulletStrippedSnippet}"`
    return "Rejected"
  }

  return <SingleColumnSection className={classes.root}>
    {itemProps?.map(({post}) => 
      <div className={classes.rejectedPost} key={post._id}>
        <div>
          <LWTooltip placement="bottom-start" tooltip={false} clickable title={<Card>
            <ContentStyles contentType='comment'>
              <ContentItemBody className={classes.reasonTooltip}
                dangerouslySetInnerHTML={{__html: post.rejectedReason || '<ul><li>No specific reason given</li></ul>' }}
              />
            </ContentStyles>
          </Card>}>
            <MetaInfo>
              {getShortReason(post.rejectedReason)}
            </MetaInfo>
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

