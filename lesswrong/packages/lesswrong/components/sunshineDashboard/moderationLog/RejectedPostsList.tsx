import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { usePostsList } from '../../posts/usePostsList';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionFooter from "@/components/common/SectionFooter";
import LoadMore from "@/components/common/LoadMore";
import PostsHighlight from "@/components/posts/PostsHighlight";
import RejectedReasonDisplay from "@/components/sunshineDashboard/RejectedReasonDisplay";
import FormatDate from "@/components/common/FormatDate";
import MetaInfo from "@/components/common/MetaInfo";
import Row from "@/components/common/Row";

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

export default RejectedPostsListComponent;

