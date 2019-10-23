import React from 'react';
import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { useTag } from './useTag.jsx';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js';
import { useCurrentUser } from '../common/withUser.js';

const TagPage = () => {
  const { SingleColumnSection, SectionTitle, PostsItem2, Loading, ContentItemBody } = Components;
  const currentUser = useCurrentUser();
  const { params } = useLocation();
  const { tag: tagName } = params;
  const { tag, loading: loadingTag } = useTag(tagName);
  
  const { results, loading: loadingPosts } = useMulti({
    terms: {
      view: "postsWithTag",
      tagName: tagName,
    },
    collection: TagRels,
    queryName: "tagPageQuery",
    fragmentName: "TagRelFragment",
    limit: 20,
    ssr: true,
  });
  
  return <SingleColumnSection>
    <SectionTitle title={`Posts Tagged #${tagName}`}>
      {Users.isAdmin(currentUser) && <Link to={`/tag/${tagName}/edit`}>Edit</Link>}
    </SectionTitle>
    {(loadingTag || loadingPosts) && <Loading/>}
    {tag && <ContentItemBody
      dangerouslySetInnerHTML={{__html: tag.description?.html}}
      description={`tag ${tagName}`}
    />}
    {results && results.length === 0 && <div>
      There are no posts with this tag yet.
    </div>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} />
    )}
  </SingleColumnSection>
}

registerComponent("TagPage", TagPage);
