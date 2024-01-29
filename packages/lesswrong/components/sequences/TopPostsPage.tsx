import React, { useState } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { useLocation } from '../../lib/routeUtil';
import { Components, fragmentTextForQuery, getFragmentText, registerComponent } from '../../lib/vulcan-lib';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

import { gql, useMutation, useQuery } from '@apollo/client';
import keyBy from 'lodash/keyBy';
import { usePostBySlug } from '../posts/usePost';
import { LWReviewWinnerSortOrder, getCurrentTopPostDisplaySettings } from './TopPostsDisplaySettings';

const styles = (theme: ThemeType) => ({
  title: {
    cursor: "pointer",
    "& .SectionTitle-title": isFriendlyUI
      ? {
        color: theme.palette.grey[1000],
        textTransform: "none",
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0",
        lineHeight: "34px",
      }
      : {},
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  form: {
    borderTop: theme.palette.border.faint,
    background: theme.palette.background.translucentBackground,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8
  },
  widerColumn: {
    maxWidth: 1200
  }
});

// TODO: update the description to be appropriate for this page
const description = `All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`;

type DisplacedReviewWinner = readonly [displacement: number, reviewWinnerId: string];
type ValidatedDisplacedReviewWinner = {
  valid: false;
} | {
  valid: true;
  displacedReviewWinner: DisplacedReviewWinner;
};

function validateDisplacedReviewWinners(displacedReviewWinnerIds: DisplacedReviewWinner[]): ValidatedDisplacedReviewWinner {
  if (displacedReviewWinnerIds.length === 0) {
    return { valid: false };
  }

  const moreThanOneOffset = displacedReviewWinnerIds.filter(([displacement]) => displacement > 1);
  if (moreThanOneOffset.length > 1) {
    return { valid: false };
  }

  // Take the only review winner which moved more than one index, if it exists
  // If not, then this is a case we swapped two review winners right next to each other, resulting in 2 displaced winners with displacements of 1
  // In that case just take the first one of those
  const displacedReviewWinner = moreThanOneOffset[0] ?? displacedReviewWinnerIds[0];

  return { valid: true, displacedReviewWinner };
}

type GetAllReviewWinnersQueryResult = Array<{
  reviewWinner: ReviewWinnerEditDisplay;
  post: PostsTopItemInfo;
}>;

function sortReviewWinners(reviewWinners: GetAllReviewWinnersQueryResult, sortOrder: LWReviewWinnerSortOrder) {
  const sortedReviewWinners = [...reviewWinners];
  switch (sortOrder) {
    case 'curated':
      return sortedReviewWinners.sort((a, b) => a.reviewWinner.curatedOrder - b.reviewWinner.curatedOrder);
    case 'ranking':
      return sortedReviewWinners.sort((a, b) => {
        const rankingDiff = a.reviewWinner.reviewRanking - b.reviewWinner.reviewRanking;
        if (rankingDiff === 0) {
          return a.reviewWinner.reviewYear - b.reviewWinner.reviewYear;
        }
        
        return rankingDiff;
      });
    case 'year':
      return sortedReviewWinners.sort((a, b) => {
        const yearDiff = a.reviewWinner.reviewYear - b.reviewWinner.reviewYear;
        if (yearDiff === 0) {
          return a.reviewWinner.reviewRanking - b.reviewWinner.reviewRanking;
        }
        
        return yearDiff;
      });
  }
}

const TopPostsPage = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const { query } = location;
  // TODO: make an admin-only edit icon somewhere
  const [editOrderEnabled, setEditOrderEnabled] = useState(false);
  
  const {
    currentSortOrder,
    aiPostsHidden
  } = getCurrentTopPostDisplaySettings(query);

  const { SingleColumnSection, SectionTitle, HeadTags, TopPostsDisplaySettings, ContentStyles, ContentItemBody, TopPostItem, TopPostEditOrder } = Components;

  const { post: reviewDescriptionPost } = usePostBySlug({ slug: 'top-posts-review-description' });

  const { data, refetch } = useQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        reviewWinner {
          ...ReviewWinnerEditDisplay
        }
        post {
          ...PostsTopItemInfo
        }
      }
    }
    ${fragmentTextForQuery('ReviewWinnerEditDisplay')}
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);

  const reviewWinnersWithPosts: GetAllReviewWinnersQueryResult = [...data?.GetAllReviewWinners ?? []];
  const reviewWinnerIdMap = keyBy(reviewWinnersWithPosts, ({ reviewWinner }) => reviewWinner._id);

  const sortedReviewWinners = sortReviewWinners(reviewWinnersWithPosts, currentSortOrder);
  // If AI posts are hidden, only show those posts that are not marked as "AI" posts
  const visibleReviewWinners = sortedReviewWinners.filter(({ reviewWinner: { isAI } }) => !aiPostsHidden || !isAI);

  const [updateReviewWinnerOrder] = useMutation(gql`
    mutation UpdateReviewWinnerOrder($reviewWinnerId: String!, $newCuratedOrder: Int!) {
      UpdateReviewWinnerOrder(reviewWinnerId: $reviewWinnerId, newCuratedOrder: $newCuratedOrder) {
        reviewWinner {
          ...ReviewWinnerEditDisplay
        }
        post {
          ...PostsTopItemInfo
        }
      }
    }
    ${fragmentTextForQuery('ReviewWinnerEditDisplay')}
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);

  const updateReviewWinnerOrderAndRefetch = async (displacedReviewWinnerId: string, newOrder: number) => {
    await updateReviewWinnerOrder({
      variables: {
        reviewWinnerId: displacedReviewWinnerId,
        newCuratedOrder: newOrder,
      },
    });

    await refetch();
  }

  const setNewReviewWinnerOrder = async (updatedReviewWinnerIds: string[]) => {
    if (!reviewWinnersWithPosts || !reviewWinnerIdMap) return;

    const originalOrderMap = Object.fromEntries(reviewWinnersWithPosts.map(({ reviewWinner }, idx) => [reviewWinner._id, idx] as const));
    const displacedReviewWinners = updatedReviewWinnerIds.map((updatedReviewWinnerId, newOrder) => {
      const originalOrder = originalOrderMap[updatedReviewWinnerId];
      const displacement = Math.abs(newOrder - originalOrder);
      return [displacement, updatedReviewWinnerId] as const;
    }).filter(([displacement]) => displacement !== 0);

    const maybeDisplacedReviewWinner = validateDisplacedReviewWinners(displacedReviewWinners);

    if (!maybeDisplacedReviewWinner.valid) {
      // TODO
      throw new Error();
    }

    const { displacedReviewWinner: [_, displacedReviewWinnerId] } = maybeDisplacedReviewWinner;
    const newOrder = updatedReviewWinnerIds.indexOf(displacedReviewWinnerId);

    await updateReviewWinnerOrder({
      variables: {
        reviewWinnerId: displacedReviewWinnerId,
        newCuratedOrder: newOrder,
      },
      
      update(cache, { data }) {
        cache.modify({
          fields: {
            reviewWinners(existingReviewWinnersRef) {
              const newRefs = data.UpdateReviewWinnerOrder.map((rw: AnyBecauseHard) => cache.writeFragment({
                data: rw,
                fragment: gql`${getFragmentText('ReviewWinnerEditDisplay')}`,
                fragmentName: 'ReviewWinnerEditDisplay'
              }));

              return {
                ...existingReviewWinnersRef,
                results: newRefs
              };
            }
          }
        })
      },

      optimisticResponse: {
        UpdateReviewWinnerOrder: updatedReviewWinnerIds.map((id, newOrder) => ({
          __typename: 'ReviewWinner',
          ...reviewWinnerIdMap[id],
          curatedOrder: newOrder
        }))
      }
    });
  }

  return (
    <>
      <HeadTags description={description} />
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        <SingleColumnSection className={classes.widerColumn}>
          <SectionTitle title={preferredHeadingCase("Best of LessWrong")} />
          <ContentStyles contentType="post">
            {reviewDescriptionPost && <ContentItemBody dangerouslySetInnerHTML={{__html: reviewDescriptionPost.contents?.html ?? ''}} description={`A description of the top posts page`}/>}
          </ContentStyles>
          <TopPostsDisplaySettings />
          {visibleReviewWinners.map(({ post, reviewWinner }) => {
            return (<div key={reviewWinner._id} >
              <TopPostItem post={post} />
              {editOrderEnabled && (
                <TopPostEditOrder
                  reviewWinner={reviewWinner}
                  updateCuratedOrder={(newOrder) => updateReviewWinnerOrderAndRefetch(reviewWinner._id, newOrder)}
                />
              )}
            </div>);
          })}
        </SingleColumnSection>
      </AnalyticsContext>
    </>
  );
}

const TopPostsPageComponent = registerComponent(
  "TopPostsPage",
  TopPostsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    TopPostsPage: typeof TopPostsPageComponent
  }
}
