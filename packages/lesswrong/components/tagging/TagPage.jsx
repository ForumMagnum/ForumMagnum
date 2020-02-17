import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useTagBySlug } from './useTag';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  description: {
    ...postBodyStyles(theme),
    marginBottom: 16,
  },
});

const TagPage = ({classes}) => {
  const { SingleColumnSection, SectionTitle, SectionFooter, SectionButton, PostsItem2, ContentItemBody, Loading, Error404 } = Components;
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
    queryName: "tagPageQuery",
    fragmentName: "TagRelFragment",
    limit: 20,
    ssr: true,
  });
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  
  return <SingleColumnSection>
    <SectionTitle title={`Posts Tagged #${tag.name}`}>
      {Users.isAdmin(currentUser) && <SectionButton>
        <Link to={`/tag/${tag.slug}/edit`}>Edit</Link>
      </SectionButton>}
    </SectionTitle>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: tag.description?.html}}
      description={`tag ${tag.name}`}
      className={classes.description}
    />
    {results && results.length === 0 && <div>
      There are no posts with this tag yet.
    </div>}
    {loadingPosts && <Loading/>}
    {results && results.map((result,i) =>
      result.post && <PostsItem2 key={result.post._id} tagRel={result} post={result.post} index={i} />
    )}
    <SectionFooter>
      <Components.LoadMore {...loadMoreProps} />
    </SectionFooter>
  </SingleColumnSection>
}

registerComponent("TagPage", TagPage,
  withStyles(styles, {name: "TagPage"}));
