import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

const LastCuratedDate = ({ terms }) => {
  const { results } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList',
  });
  const { MetaInfo, FormatDate } = Components
  const curatedDate = results && results.length && results[0].curatedDate
  if (curatedDate) {
    return <div>
      <MetaInfo>
        <FormatDate date={results[0].curatedDate}/>
      </MetaInfo>
    </div>
  } else {
    return null
  }
}

const LastCuratedDateComponent = registerComponent('LastCuratedDate', LastCuratedDate);

declare global {
  interface ComponentTypes {
    LastCuratedDate: typeof LastCuratedDateComponent
  }
}

