import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { usePostsList } from '../../posts/usePostsList';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { SingleColumnSection } from "../../common/SingleColumnSection";
import { SectionFooter } from "../../common/SectionFooter";
import { LoadMore } from "../../common/LoadMore";
import { PostsHighlight } from "../../posts/PostsHighlight";
import { RejectedReasonDisplay } from "../RejectedReasonDisplay";
import { FormatDate } from "../../common/FormatDate";
import { MetaInfo } from "../../common/MetaInfo";
import { Row } from "../../common/Row";

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

export const RejectedPostsListInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    children,
    loading,
    loadMore,
    loadMoreProps,
    itemProps,
  } = usePostsList({terms:{view:'rejected'}, enableTotal: true});
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

export const RejectedPostsList = registerComponent('RejectedPostsList', RejectedPostsListInner, {styles});

declare global {
  interface ComponentTypes {
    RejectedPostsList: typeof RejectedPostsList
  }
}

