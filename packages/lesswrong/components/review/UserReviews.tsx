import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { RecentComments } from "../comments/RecentComments";
import { SectionTitle } from "../common/SectionTitle";
import { Loading } from "../vulcan-core/Loading";
import { Error404 } from "../common/Error404";

const UserReviewsInner = () => {
  const { params: { slug, year } } = useLocation();
  const { results, loading } = useMulti({
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
    terms: {view: 'usersProfile', slug}
  });

  const user = results?.length ? results[0] : null
  if (loading) return <Loading />
  if (!user) return <Error404 />
  if (!year) return <Error404 />

  let nominationsView: CommentsViewName | undefined;
  let reviewsView: CommentsViewName | undefined;

  switch (year) {
    case "2018":
      nominationsView = "nominations2018"
      reviewsView = "reviews2018"
      break
    case "2019":
      nominationsView = "nominations2019"
      reviewsView = "reviews2019"
      break
    case "all":
      // TODO: why are these missing??
      // @ts-ignore
      nominationsView = "nominationsAll"
      // @ts-ignore
      reviewsView = "reviewsAll"
      break
  }

  if (!nominationsView || !reviewsView) return <Error404 />

  const nominationTerms: CommentsViewTerms = {
    view: nominationsView,
    userId: user._id,
    limit: 50
  }

  const reviewTerms: CommentsViewTerms = {
    view: reviewsView,
    userId: user._id,
    limit: 50
  }

  return (
    <SingleColumnSection>
      <SectionTitle title={`${user.displayName}'s ${year} Reviews`}/>
      <RecentComments terms={reviewTerms} truncated noResultsMessage="No Reviews Found"/>
      <SectionTitle title={`${user.displayName}'s ${year} Nominations`}/>
      <RecentComments terms={nominationTerms} truncated noResultsMessage="No Nominations Found"/>
    </SingleColumnSection>
  )

};

export const UserReviews = registerComponent('UserReviews', UserReviewsInner);



