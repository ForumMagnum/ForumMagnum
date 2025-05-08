import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { PermanentRedirect } from "../common/PermanentRedirect";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { Loading } from "../vulcan-core/Loading";

const CurrentOpenThreadPageInner = () => {
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

export const CurrentOpenThreadPage = registerComponent('CurrentOpenThreadPage', CurrentOpenThreadPageInner);

declare global {
  interface ComponentTypes {
    CurrentOpenThreadPage: typeof CurrentOpenThreadPage
  }
}
