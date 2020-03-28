import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'

const CoronavirusFrontpageWidget = ({settings}) => {
  const { SectionSubtitle, PostsItem2, LWTooltip, SectionFooter } = Components

  const { results } = useMulti({
    // skip: !(tag?._id),
    terms: {
      view: "postsWithTag",
      tagId: "tNsqhzTibgGJKPEWB",
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 3,
    ssr: true,
  });

  const currentUser = useCurrentUser();

  // if (settings.hideReview) return null
  if (settings.hideCoronavirus) return null

  return (
    <div>
      <SectionSubtitle>
        <LWTooltip title={"View all posts related to COVID-19"} placement="top-start">
          <Link to="/tag/coronavirus">Coronavirus Tag</Link>
        </LWTooltip>
      </SectionSubtitle>
      <AnalyticsContext listContext={"coronavirusWidget"} capturePostItemOnMount>
        {results && results.map((result,i) =>
          result.post && <PostsItem2 key={result.post._id} post={result.post} index={i} />
        )}
      </AnalyticsContext>
      {!currentUser && <SectionFooter>
        <Link to={"/tag/coronavirus"}>
          View All Coronavirus Posts
        </Link>
        <Link to={"/coronavirus-link-database"}>
          C19 Links Database
        </Link>
      </SectionFooter>}
    </div>
  )
}

const CoronavirusFrontpageWidgetComponent = registerComponent('CoronavirusFrontpageWidget', CoronavirusFrontpageWidget);

declare global {
  interface ComponentTypes {
    CoronavirusFrontpageWidget: typeof CoronavirusFrontpageWidgetComponent
  }
}
