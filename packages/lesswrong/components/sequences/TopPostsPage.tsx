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
import classNames from 'classnames';
import Image from '@material-ui/icons/Image';
import { left } from '@popperjs/core';

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
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 1250,
  },
  description: {
    maxWidth: 700,
    paddingLeft: 17
  },
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  postsImageGrid: {
    position: "relative",
    display: "flex",
    '&:hover $imageGridHeader': {
      background: 'rgb(241 209 150 / 40%)'
    },
    '&:hover $expandIcon': {
      opacity: 1
    }
  },
  expandedImageGrid: {
    '& $imageGrid': {
      gridTemplateColumns: "repeat(3, 120px) repeat(6, 120px)",
    }
  },
  collapsedImageGrid: {
    '& $imageGrid': {
      gridTemplateColumns: "repeat(3, 0px) repeat(6, 0px)",
    }
  },
  imageGridHeader: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: "0px 0px 4px 4px",
    cursor: 'pointer',
    transition: 'background 0.2s ease-in',
    '&&&:hover': {
      background: 'rgb(241 209 150 / 75%)'
    }
  },
  imageGridHeaderTitle: {
    margin: 0,
    fontSize: 32
  },
  expandIcon: {
    marginBottom: 'auto',
    paddingTop: 8,
    fontSize: 24,
    opacity: 0
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 120px) repeat(6, 0px)",
    gridTemplateRows: "repeat(4, 120px)",
    position: "relative",
    overflow: "hidden",
    gridAutoFlow: 'column',
    transition: 'grid-template-columns 0.5s ease-in-out',
    '&:hover $imageGridPostBackground': {
      transitionDelay: '0.2s'
    }
  },
  imageGridBackground: {
    top: 0,
    right: 0,
    height: "120%",
    width: "100%",
    zIndex: -1,
    position: "absolute",
    objectFit: "cover",
    objectPosition: "right",
    transition: "opacity 0.2s ease-in"
  },


  imageGridPost: {
    ...theme.typography.commentStyle,
    color: "white",
    display: "flex",
    textWrap: "balance",
    cursor: "pointer",
    
    '&:hover .hoverBackground': {
      opacity: 1
    },

    '&&&:hover $imageGridPostBackground': {
      opacity: 1,
      transitionDelay: "0s",
      zIndex: 2
    },

    //   .TopPostsPage-imageGridPost:nth-child(3n + 1) .TopPostsPage-imageGridPostBody {
    //     border-right: none;
    //     /* background: red; */
    // }
    
    // .TopPostsPage-imageGridPost:nth-child(n + 11) .TopPostsPage-imageGridPostBody {
    //     /* background: blue; */
    //     border-bottom: none;
    // }

    '&&&:nth-child(4n + 1) $imageGridPostBody': {
      borderBottom: "none"
    },
    '&&&:nth-child(n + 10) $imageGridPostBody': {
      borderRight: "none"
    }
    
  },

  imageGridPostBody: {
    padding: 4,
    paddingTop: 0,
    borderRight: "1px solid white",
    borderBottom: "1px solid white",
    background: "linear-gradient(0deg, #00000038,  transparent 50%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
    zIndex: 3,
    '&&&:hover': {
      background: "rgb(0 0 0 / 27%)",
      backdropFilter: "none",
      color: "white"
    },
    '&:hover $imageGridPostAuthor': {
      opacity: 1
    },
  },
  imageGridPostBackground: {
    opacity: 0,
    position: "absolute",
    top: 0,
    left: "-50%",
    objectFit: "contain",
    height: "100%",
    objectPosition: "right",
    zIndex: -1,
    transition: "opacity 0.2s ease-in",
  },
  imageGridPostAuthor: {
    opacity: 0,
    textAlign: "right",
    paddingTop: 2,
    fontWeight: 600,
    paddingRight: 2,
    transition: "opacity 0.2s ease-in",
    paddingLeft: 20
  },
  imageGridPostTitle: {
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

const sectionsInfo = {
  rationality: {
    title: "Rationality",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706571097/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_catlen.webp",
    tag: "Rationality"
  },
  optimization: {
    title: "Optimization",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706670707/ohabryka_Aquarelle_book_cover_depicting_planets_surrounded_by_d_e9f91f98-66bc-4512-99d9-a13c15151ce8_ybdpvk.png",
    tag: "World Optimization"
  },
  modeling: {
    title: "Modeling",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706680332/ohabryka_Aquarelle_book_cover_inspired_by_topographic_river_map_9015394d-6f09-4e8e-99cc-3e0a91d4816e_ibpfhk.png",
    tag: "World Modeling"
  },
  "ai-alignment": {
    title: "AI Alignment",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706571097/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_catlen.webp",
    tag: "AI"
  },
  practical: {
    title: "Practical",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706670707/ohabryka_Aquarelle_book_cover_depicting_planets_surrounded_by_d_e9f91f98-66bc-4512-99d9-a13c15151ce8_ybdpvk.png",
    tag: "Practical"
  },
  miscellany: {
    title: "Miscellany",
    img: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1706680332/ohabryka_Aquarelle_book_cover_inspired_by_topographic_river_map_9015394d-6f09-4e8e-99cc-3e0a91d4816e_ibpfhk.png",
    tag: null
  }
}

type expansionState = {left: number, right: number} | 'collapsed' | 'default'

const TopPostsPage = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const { query } = location;
  // TODO: make an admin-only edit icon somewhere
  const [editOrderEnabled, setEditOrderEnabled] = useState(false);

  const [expansionState, setExpansionState] = useState({} as Record<string, expansionState>);
  console.log({expansionState})
  const handleToggleExpand = (id: string) => {
    // Get all dom elements with any of the ids in sectionInfo
    const elements = document.querySelectorAll(`[id^="PostsImageGrid-"]`);
    const currentState = expansionState[id] || 'default';

    // Figure out which elements we need to collapse
    // To do that we check if an element has the same y-coordinate as the clicked element
    // If it does, we collapse it
    const clickedElement = document.getElementById(`PostsImageGrid-${id}`);
    const clickedElementY = clickedElement?.getBoundingClientRect().top;
    const clickedElementX = clickedElement?.getBoundingClientRect().left;

    const leftElementsToToggle = Array.from(elements).filter((element) => {
      const elementY = element.getBoundingClientRect().top;
      const elementX = element.getBoundingClientRect().left;
      // console.log({elementY, clickedElementY, elementX, clickedElementX})
      return elementY === clickedElementY && clickedElementX && elementX < clickedElementX;
    });
    
    const rightElementsToToggle = Array.from(elements).filter((element) => {
      const elementY = element.getBoundingClientRect().top;
      const elementX = element.getBoundingClientRect().left;
      // console.log({elementY, clickedElementY, elementX, clickedElementX})
      return elementY === clickedElementY && clickedElementX && elementX > clickedElementX;
    });

    const elementsToToggle = [...leftElementsToToggle, ...rightElementsToToggle];

    const currentStateToNewState = (clickedElementState:expansionState) => {
      return typeof clickedElementState !== 'string' && (clickedElementState.left > 0 || clickedElementState.right > 0) ? 'default' : 'collapsed'
    }

    const newClickedElementState : expansionState = typeof currentState !== 'string' ? 'default' : {left: leftElementsToToggle.length, right: rightElementsToToggle.length}

    const newState : Record<string, expansionState> = {
      ...expansionState,
      ...Object.fromEntries(elementsToToggle.map(element => [element.id.replace('PostsImageGrid-', ''), currentStateToNewState(currentState)])),
      [id]: newClickedElementState
    }

    console.log({elementsToToggle, newState})

    setExpansionState(newState);
  }
  

  const {
    currentSortOrder,
    aiPostsHidden
  } = getCurrentTopPostDisplaySettings(query);

  const { SectionTitle, HeadTags, TopPostsDisplaySettings, ContentStyles, ContentItemBody, TopPostItem, TopPostEditOrder } = Components;

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
        
        <div className={classes.widerColumn}>
          <div className={classes.description}>
            <SectionTitle title={preferredHeadingCase("Best of LessWrong")} />
            <ContentStyles contentType="post">
              {reviewDescriptionPost && <ContentItemBody dangerouslySetInnerHTML={{__html: reviewDescriptionPost.contents?.html ?? ''}} description={`A description of the top posts page`}/>}
            </ContentStyles>
          </div>
          <TopPostsDisplaySettings />
          <div className={classes.gridContainer}>
            {Object.entries(sectionsInfo).map(([id, { title, img, tag }]) => {
              const posts = visibleReviewWinners.map(({ post }) => post).filter(post => !tag || post.tags.map(tag => tag.name).includes(tag));
              return <PostsImageGrid posts={posts} classes={classes} img={img} header={title} key={id} id={id} expansionState={expansionState[id]} handleToggleExpand={handleToggleExpand} />
            })}
          </div>
          
          {/* {visibleReviewWinners.map(({ post, reviewWinner }) => {
            return (<div key={reviewWinner._id} >
              <TopPostItem post={post} />
              {editOrderEnabled && (
                <TopPostEditOrder
                  reviewWinner={reviewWinner}
                  updateCuratedOrder={(newOrder) => updateReviewWinnerOrderAndRefetch(reviewWinner._id, newOrder)}
                />
              )}
            </div>);
          })} */}
        </div>
      </AnalyticsContext>
    </>
  );
}

const PostsImageGrid = ({ posts, classes, img, header, id, expansionState, handleToggleExpand }: { posts: PostsTopItemInfo[], classes: ClassesType<typeof styles>, img: string, header: string, id: string, expansionState: expansionState, handleToggleExpand: (id: string) => void }) => {
  const leftBookOffset = typeof expansionState === 'object' ? expansionState.left : 0;
  const rightBookOffset = typeof expansionState === 'object' ? expansionState.right : 0;

  return <div 
    className={classNames(classes.postsImageGrid, {
      [classes.expandedImageGrid]: typeof expansionState !== 'string' && (expansionState?.left > 0 || expansionState?.right > 0), 
      [classes.collapsedImageGrid]: expansionState === 'collapsed'
    })} 
    id={`PostsImageGrid-${id}`}
  >
    <div className={classes.imageGridHeader} onClick={() => handleToggleExpand(id)}>
      <span className={classes.expandIcon}>+</span>
      <h2 className={classes.imageGridHeaderTitle}>{header}</h2>
    </div>
    <div className={classNames(classes.imageGrid)}>
      <img src={img} className={classes.imageGridBackground}/>
      {leftBookOffset > 0 && posts.slice(12, 12 + 12 * leftBookOffset).map((post, i) => <ImageGridPost post={post} index={i} classes={classes} key={post._id} />)}
      {posts.slice(0, 12).map((post, i) => <ImageGridPost post={post} index={i} classes={classes} key={post._id} />)}
      {rightBookOffset > 0 && posts.slice(leftBookOffset * 12 + 12, leftBookOffset * 12 + 12 + rightBookOffset * 12).map((post, i) => <ImageGridPost post={post} index={i} classes={classes} key={post._id} />)}
    </div>
  </div>
}

const ImageGridPost = ({post, index, classes}: {post: PostsTopItemInfo, index: number, classes: ClassesType<typeof styles>}) => {
  return <div className={classes.imageGridPost} key={post._id}>
  <div className={classes.imageGridPostBody}>
    <div className={classes.imageGridPostAuthor}>
      {post?.user?.displayName}
    </div>
    <div className={classes.imageGridPostTitle}>
      {post.title}
    </div>
  </div>
  <img className={classes.imageGridPostBackground} src={candidateImages[index]} />
</div>
}

const candidateImages = [
"https://cdn.discordapp.com/attachments/1202090633343549520/1202110401114808341/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_1c07f1d6-9cfa-46cb-9eca-9eee9c958681.png?ex=65cc438d&is=65b9ce8d&hm=dd34bb6de3bfc8c5d66147e24edae8fd069f47cdcaa76b761bfcb2f9ae872863&",
"https://cdn.discordapp.com/attachments/1202090633343549520/1202110410761969736/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_073dc94a-a796-426e-b304-941c4eb243c1.png?ex=65cc4390&is=65b9ce90&hm=d310cd4d4136f84c0a558ef01ed366c0219c5ee222be02bfafc712dcddd41da0&",
"https://cdn.discordapp.com/attachments/1202090633343549520/1202110427274682410/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_1cbb5f44-58e7-4cda-9051-ae0b0329c5be.png?ex=65cc4393&is=65b9ce93&hm=ad582ba91a27ca83270cd9b50195a0685201ed6f43aef7410ce99dea50db8031&",
"https://cdn.discordapp.com/attachments/1202090633343549520/1202110440725811270/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_5e6cc8b6-3277-4761-ab74-65d2693c270c.png?ex=65cc4397&is=65b9ce97&hm=0d476e45cba96e700d2afb60f6fd0fdc614f27b571b0d28ed61e567edbbbcd76&",
"https://cdn.discordapp.com/attachments/1202091050643247164/1202110900522192916/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_64734a60-0e42-40a1-aec8-bcccee9c453e.png?ex=65cc4404&is=65b9cf04&hm=3b89005b63752a26c996080e668867657e599a6a79fa030dc0e9d8bdb8d2985b&",
"https://cdn.discordapp.com/attachments/1202091050643247164/1202110912396271626/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_68f1d939-2cb7-4854-b141-a01db337fc11.png?ex=65cc4407&is=65b9cf07&hm=4e92c2ac2391552558f935f14929294a148423c198472e6c6ce3b1524a99146a&",
"https://cdn.discordapp.com/attachments/1202091050643247164/1202110927022067732/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_e9692e4e-eaff-4148-8ddd-4d84a6ae2a88.png?ex=65cc440b&is=65b9cf0b&hm=83e50b7845d96ca393159cffc71aa513687d43ae6c0d001d9575f3dc7aab647b&",
"https://cdn.discordapp.com/attachments/1202091050643247164/1202110935620395058/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_2141e11c-bac8-453d-b4cc-c57bbf55c9cb.png?ex=65cc440d&is=65b9cf0d&hm=5709ec2cd69f1f1669401e09e1b380059020f11cc4b57cbb10824dca46662185&",
"https://cdn.discordapp.com/attachments/1202090703497478194/1202111114700406784/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_f8ae3112-62c3-458b-86df-e27366251c0d.png?ex=65cc4437&is=65b9cf37&hm=37d7e4f0b8e6d6a8dfbfd909e776f0e46cd26a71c0f2050da5bebb7f958e1866&",
"https://cdn.discordapp.com/attachments/1202090703497478194/1202111124938424340/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_8df1b426-cc97-4b84-a17e-93f9e4cf4628.png?ex=65cc443a&is=65b9cf3a&hm=369b3357771b53484d98d9217ac7dcf973201dd6d9448c11d8c39c94cec60409&",
"https://cdn.discordapp.com/attachments/1202090703497478194/1202111132223934514/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_cfc04c3f-24c2-476f-bab4-e28abf04b93d.png?ex=65cc443c&is=65b9cf3c&hm=2d96631524df2a167bee2216a7996bdb92efb494379dbc3cee5643c5af1e85c5&",
"https://cdn.discordapp.com/attachments/1202090703497478194/1202111137697759252/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_a19a1d43-ac99-4c90-86a8-a6bee31530a4.png?ex=65cc443d&is=65b9cf3d&hm=882dae84081c056ea13eb974a40c259d7320cf693c0595a962fdfee1b4920235&",
"https://cdn.discordapp.com/attachments/1202090609658306567/1202111349514043423/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_9a441f6c-786c-42a5-a128-d04a4446205f.png?ex=65cc446f&is=65b9cf6f&hm=d25b74484ec386d4d162e82c2fdf0a1928f3ba94bff4493ebcc8d2d5ae163e89&",
"https://cdn.discordapp.com/attachments/1202090609658306567/1202111361950429204/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_febbafed-0193-4646-8e52-4e03625e7828.png?ex=65cc4472&is=65b9cf72&hm=4b576def03308349f44d802145d668787e3ac6bdf4d11064a71057900e3c8b04&",
"https://cdn.discordapp.com/attachments/1202090609658306567/1202111377192538162/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_10f4a9ff-9121-4c1c-9671-38e6e9bced8e.png?ex=65cc4476&is=65b9cf76&hm=48064dbb38717f9e9c3974e6363ab27464498a922b3778914068228873f888b9&",
"https://cdn.discordapp.com/attachments/1202090609658306567/1202111387275366490/lwbot_Aquarelle_book_cover_inspired_by_topographic_river_maps_a_7fece95f-0f72-4efe-8ebb-285e7a37498e.png?ex=65cc4478&is=65b9cf78&hm=d50838b8859926d14987c44daeede05683a35492a74fdb5458b743142559668f&",
]

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
