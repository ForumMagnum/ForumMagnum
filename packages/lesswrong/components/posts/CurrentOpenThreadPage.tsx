import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';

const CurrentOpenThreadPage = () => {
  const {PermanentRedirect, SingleColumnSection, Loading} = Components;
  
  const {results, loading} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "currentOpenThread",
      limit: 1
    },
    fragmentName: "PostsMinimumInfo",
  });

  if (loading) {
    return <Loading />
  }

  const post = results?.[0];
  if (!post) {
    return <SingleColumnSection>No open thread found</SingleColumnSection>;
  }

  return <PermanentRedirect status={302} url={postGetPageUrl(post)} />
}

const CurrentOpenThreadPageComponent = registerComponent('CurrentOpenThreadPage', CurrentOpenThreadPage);

declare global {
  interface ComponentTypes {
    CurrentOpenThreadPage: typeof CurrentOpenThreadPageComponent
  }
}
