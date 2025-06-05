import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import SingleColumnSection from "../common/SingleColumnSection";
import RecentComments from "../comments/RecentComments";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersProfileMultiQuery = gql(`
  query multiUserUserReviewsQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const UserReviews = () => {
  const { params: { slug, year } } = useLocation();
  const { data, loading } = useQuery(UsersProfileMultiQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;

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

export default registerComponent('UserReviews', UserReviews);



