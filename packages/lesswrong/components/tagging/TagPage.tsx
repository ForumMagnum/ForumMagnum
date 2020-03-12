import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useTagBySlug } from './useTag';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { postBodyStyles } from '../../themes/stylePiping'
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = theme => ({
  description: {
    ...postBodyStyles(theme),
    marginBottom: 16,
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left"
  }
});

const TagPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SectionTitle, SectionFooter, SectionButton, PostsItem2, ContentItemBody, Loading, Error404, LoadMore } = Components;
  const currentUser = useCurrentUser();
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading: loadingTag } = useTagBySlug(slug);
  
  const { results, loading: loadingPosts, loadMoreProps } = useMulti({
    skip: !(tag?._id),
    terms: {
      view: "postsWithTag",
      tagId: tag?._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 300,
    itemsPerPage: 100,
    enableTotal: true,
    ssr: true,
  });
  
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  
  const orderByScore = _.sortBy(results, result=>-result.post.baseScore)
  const orderByTagScore = _.sortBy(orderByScore, result=>-result.baseScore)

  return <SingleColumnSection>
    <SectionTitle title={`${tag.name} Tag`}>
      {Users.isAdmin(currentUser) && <SectionButton>
        <Link to={`/tag/${tag.slug}/edit`}>Edit</Link>
      </SectionButton>}
    </SectionTitle>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: tag.description?.html}}
      description={`tag ${tag.name}`}
      className={classes.description}
    />
    {orderByTagScore && orderByTagScore.length === 0 && <div>
      There are no posts with this tag yet.
    </div>}
    {loadingPosts && <Loading/>}
    <AnalyticsContext listContext={`${tag.name} Tag Page`} capturePostItemOnMount>
      {orderByTagScore && orderByTagScore.map((result,i) =>
        result.post && <PostsItem2 key={result.post._id} tagRel={result} post={result.post} index={i} />
      )}
    </AnalyticsContext>
    <SectionFooter>
      <span className={classes.loadMore}>
        <LoadMore {...loadMoreProps}/>
      </span>
    </SectionFooter>
  </SingleColumnSection>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
