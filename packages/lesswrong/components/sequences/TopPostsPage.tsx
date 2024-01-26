import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragmentText, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/dropdownOptions';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { makeSortableListComponent } from '../form-components/sortableList';
import { useMulti } from '../../lib/crud/withMulti';

import { gql, useMutation, useQuery } from '@apollo/client';
import keyBy from 'lodash/keyBy';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
// import Autosuggest, { OnSuggestionSelected } from 'react-autosuggest';
import { LWReviewWinnerSortOrder, getCurrentTopPostDisplaySettings } from './TopPostsDisplaySettings';
import { usePostBySlug } from '../posts/usePost';

export interface ReviewWinnerWithPostTitle {
  reviewWinner: DbReviewWinner;
  postTitle: string;
}

const styles = (theme: ThemeType): JssStyles => ({
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
});

// TODO: update the description to be appropriate for this page
const description = `All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`;

const formatSort = (sorting: PostSortingMode) => {
  const sort = SORT_ORDER_OPTIONS[sorting].label
  return isFriendlyUI ? sort : `Sorted by ${sort}`;
}

const getReviewWinnerResolverName = (sortOrder: LWReviewWinnerSortOrder) => {
  switch (sortOrder) {
    case 'curated':
      return 'ReviewWinnersCuratedOrder';
    case 'ranking':
      return 'ReviewWinnersRankingOrder';
    case 'year':
      return 'ReviewWinnersYearOrder';
  }
};

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => <li className={classNames(classes.item, classes.form)}>
    <Components.WrappedSmartForm
      collectionName='ReviewWinners'
      documentId={contents}
      queryFragmentName='ReviewWinnersDefaultFragment'
      mutationFragmentName='ReviewWinnersDefaultFragment'
      fields={['postId', 'curatedOrder']}
    />
  </li>
});

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

const TopPostsPage = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const { query } = location;
  
  const {
    currentSortOrder,
    currentAIVisibility
  } = getCurrentTopPostDisplaySettings(query);

  // const [sortOrder, setSortOrder] = useState<LWReviewWinnerSortOrder>('curated');

  const { SingleColumnSection, SectionTitle, HeadTags, PostsList2, TopPostsDisplaySettings, ContentStyles, ContentItemBody } = Components;

  const { post: reviewDescriptionPost } = usePostBySlug({ slug: 'top-posts-review-description' });

  const { data } = useQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        reviewWinner {
          ...ReviewWinnerEditDisplay
        }
        postTitle
      }
    }
    ${fragmentTextForQuery('ReviewWinnerEditDisplay')}
  `);

  const reviewWinnersWithPostTitles: ReviewWinnerWithPostTitle[] | undefined = data?.GetAllReviewWinners;
  const sortedReviewWinners = [...reviewWinnersWithPostTitles ?? []].sort((a, b) => a.reviewWinner.curatedOrder - b.reviewWinner.curatedOrder);
  const reviewWinnerIdMap = sortedReviewWinners ? keyBy(sortedReviewWinners, ({ reviewWinner }) => reviewWinner._id) : undefined;

  const [updateReviewWinnerOrder] = useMutation(gql`
    mutation UpdateReviewWinnerOrder($reviewWinnerId: String!, $newCuratedOrder: Int!) {
      UpdateReviewWinnerOrder(reviewWinnerId: $reviewWinnerId, newCuratedOrder: $newCuratedOrder) {
        ...ReviewWinnerEditDisplay
      }
    }
    ${fragmentTextForQuery('ReviewWinnerEditDisplay')}
  `);

  const setNewReviewWinnerOrder = async (updatedReviewWinnerIds: string[]) => {
    if (!sortedReviewWinners || !reviewWinnerIdMap) return;

    const originalOrderMap = Object.fromEntries(sortedReviewWinners.map(({ reviewWinner }, idx) => [reviewWinner._id, idx] as const));
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

  const resolverName = getReviewWinnerResolverName(currentSortOrder);

  return (
    <>
      <HeadTags description={description} />
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        <SingleColumnSection>
          <SectionTitle title={preferredHeadingCase("Best of LessWrong")} />
          <ContentStyles contentType="post" className={classes.description}>
            {reviewDescriptionPost && <ContentItemBody dangerouslySetInnerHTML={{__html: reviewDescriptionPost.contents?.html ?? ''}} description={`A description of the top posts page`}/>}
          </ContentStyles>
          <TopPostsDisplaySettings />
          {/* <Autosuggest
            suggestions={hits}
            onSuggestionSelected={onSuggestionSelected}
            onSuggestionsFetchRequested={({ value }) => refine(value)}
            onSuggestionsClearRequested={() => refine('')}
            getSuggestionValue={hit => hit.title}
            renderInputComponent={renderInputComponent}
            renderSuggestion={renderSuggestion}
            inputProps={{
              placeholder: placeholder,
              value: currentRefinement,
              onChange: () => {},
            }}
            highlightFirstSuggestion
          /> */}
          {/* <SortableList classes={classes} value={sortedReviewWinners.map(r => r._id)} setValue={setNewReviewWinnerOrder} /> */}
          <PostsList2
            terms={{ limit: 20 }}
            resolverName={resolverName}
            topLoading
            dimWhenLoading
            showPostedAt={false}
            showKarma={false}
            showReviewRanking
            showCommentCount={false}
          />
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
