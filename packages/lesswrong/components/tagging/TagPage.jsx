import React from 'react';
import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { useTagBySlug } from './useTag.jsx';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js';
import { useCurrentUser } from '../common/withUser.js';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  description: {
    ...postBodyStyles(theme),
  },
});

const TagPage = ({classes}) => {
  const { SingleColumnSection, SectionTitle, PostsItem2, Loading, ContentItemBody } = Components;
  const currentUser = useCurrentUser();
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading: loadingTag } = useTagBySlug(slug);
  
  const { results, loading: loadingPosts } = useMulti({
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
    return <Components.Loading/>
  if (!tag)
    return <Components.Error404/>
  
  return <SingleColumnSection>
    <SectionTitle title={`Posts Tagged #${tag.name}`}>
      {Users.isAdmin(currentUser) && <Link to={`/tag/${tag.slug}/edit`}>Edit</Link>}
    </SectionTitle>
    {(loadingTag || loadingPosts) && <Loading/>}
    {tag && <ContentItemBody
      dangerouslySetInnerHTML={{__html: tag.description?.html}}
      description={`tag ${tag.name}`}
      className={classes.description}
    />}
    {results && results.length === 0 && <div>
      There are no posts with this tag yet.
    </div>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} tagRel={result} post={result.post} index={i} />
    )}
  </SingleColumnSection>
}

registerComponent("TagPage", TagPage,
  withStyles(styles, {name: "TagPage"}));
