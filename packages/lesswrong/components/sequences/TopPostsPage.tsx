import React, { ComponentProps, PropsWithoutRef, useEffect, useState } from 'react';
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
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const MAX_GRID_SIZE = 6;

const gridPositionToClassName = (gridPosition: number) => `gridPosition${gridPosition}` as const;

const gridPositionToClassesEntry = (theme: ThemeType, gridPosition: number) => {
  return [gridPositionToClassName(gridPosition), {
    left: `calc(-${(gridPosition % 3) * 3} * 120px)`,
    [theme.breakpoints.down(1200)]: {
      left: `calc(-${(gridPosition % 2) * 3} * 120px)`,
    },
    [theme.breakpoints.down(800)]: {
      left: 0
    }
  }] as const;
};

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
    width: 'min-content'
  },
  description: {
    maxWidth: 700,
    paddingLeft: 17,
    [theme.breakpoints.down(800)]: {
      paddingLeft: 0
    }
  },
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: '20px',
    width: 1200,
    [theme.breakpoints.down(1200)]: {
      width: 800
    },
    [theme.breakpoints.down(800)]: {
      width: 'inherit',
      rowGap: 0
    }
  },
  postsImageGrid: {
    position: "relative",
    display: "flex",
    '&:hover $imageGridHeader': {
      background: 'rgb(241 209 150 / 40%)'
    },
    '&:hover $toggleIcon': {
      opacity: 1
    },
    [theme.breakpoints.down(800)]: {
      flexDirection: "column",
    }
  },
  expandedImageGrid: {
    '& $imageGridContainer': {
      width: 'calc(9 * 120px - 2px)',
      [theme.breakpoints.down(1200)]: {
        width: 'calc(6 * 120px - 2px)',
      },
      [theme.breakpoints.down(800)]: {
        width: 'calc(3 * 120px - 2px)',
        height: 'calc(4 * 120px)',
      },
    },
    '& $imageGrid': {
      left: '0 !important'
    },
    '& $imageGridPostOffscreen': {
      opacity: 1,
      transitionDelay: '0s'
    },
    '& $toggleIcon': {
      transform: 'rotate(45deg)'
    }
  },
  collapsedImageGrid: {
    '& $imageGridContainer': {
      width: 0
    },
    '& $imageGridHeader': {
      width: 38,
    }
  },
  hiddenImageGrid: {
    '& $imageGridContainer': {
      width: 0
    },
    '& $imageGridHeader': {
      width: 0,
    },
    '& $imageGridHeaderTitle': {
      fontSize: 0,
    },
  },
  imageGridHeader: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: "16px 0px 4px 3px",
    cursor: 'pointer',
    transition: 'background 0.2s ease-in, width 0.5s ease-in-out',
    width: 40,
    '&&&:hover': {
      background: 'rgb(241 209 150 / 75%)'
    },
    [theme.breakpoints.down(800)]: {
      padding: 0,
      writingMode: "inherit",
      transform: 'none',
      width: 'inherit'
    }
  },
  imageGridHeaderTitle: {
    margin: 0,
    fontSize: 32
  },
  toggleIcon: {
    fontSize: 24,
    opacity: 0,
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s ease-in',
    transitionDelay: '0.5s',
    [theme.breakpoints.down(800)]: {
      order: 2,
      padding: 0,
      margin: 0,
      opacity: 1
    }
  },
  imageGridContainer: {
    position: "relative",
    width: 'calc(3 * 120px - 2px)',
    height: 'calc(4 * 120px)',
    overflow: 'hidden',
    transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
    [theme.breakpoints.down(800)]: {
      height: 'calc(1 * 120px)',
    }
  },
  imageGrid: {
    display: "grid",
    gridTemplateRows: "repeat(4, 120px)",
    position: "absolute",
    top: 0,
    overflow: "hidden",
    gridAutoFlow: 'column',
    transition: 'left 0.5s ease-in-out',
    '&:hover $imageGridPostBackground': {
      transitionDelay: '0.2s'
    },
    gridTemplateColumns: "repeat(9, 120px)",
  },
  // If we want to display a grid with more than 6 items, increase this number
  ...Object.fromEntries(Array.from({ length: MAX_GRID_SIZE }, (_, i) => gridPositionToClassesEntry(theme, i))),
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
  imageGridShowAll: {
    height: 120,
    width: 120,
    background: theme.palette.greyAlpha(.8),
    color: theme.palette.text.invertedBackgroundText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    cursor: 'pointer',
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: .8,
  },
  imageGridShowAllTransition: {
    opacity: 0,
    width: 0,
    transition: "opacity 0.2s ease-in, width 0.2s ease-in",
  },  
  imageGridShowAllVisible: {
    transition: "opacity 0.2s ease-in, width 0.2s ease-in",
  },

  imageGridPost: {
    ...theme.typography.commentStyle,
    color: "white",
    display: "flex",
    textWrap: "balance",
    cursor: "pointer",

    '&:hover': {
      opacity: 1 // Overwriting default <a> styles
    },
    
    '&:hover .hoverBackground': {
      opacity: 1
    },

    '&&&:hover $imageGridPostBackground': {
      display: "block",
      opacity: 1,
      transitionDelay: "0s",
      zIndex: 2
    },
    '&&:nth-child(4n + 1) $imageGridPostBody': {
      borderBottom: "none"
    },
  },

  imageGridPostHidden: {
    opacity: 0,
    transitionDelay: '0.5s'
  },

  imageGridPostOffscreen: {
    opacity: 0,
    transitionDelay: '0.5s'
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
    display: 'block',
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    opacity: 0,
    objectFit: "cover",
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
    paddingLeft: 12
  },
  imageGridPostTitle: {
    transition: "opacity 0.2s ease-in",
  },
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

let candidateImages = [
  "https://cl.imagineapi.dev/assets/51d4e735-f328-436b-af1f-72f8a393114e/51d4e735-f328-436b-af1f-72f8a393114e.png","https://cl.imagineapi.dev/assets/9a46ebf2-a5f4-4520-827f-5e723164a857/9a46ebf2-a5f4-4520-827f-5e723164a857.png","https://cl.imagineapi.dev/assets/41b79ce2-bd03-45a5-bd9e-a7761a539b0a/41b79ce2-bd03-45a5-bd9e-a7761a539b0a.png","https://cl.imagineapi.dev/assets/d257c3a8-df69-4da5-ae4c-0fc01bd800d0/d257c3a8-df69-4da5-ae4c-0fc01bd800d0.png","https://cl.imagineapi.dev/assets/53236167-d294-4870-b65b-c793a83be8e0/53236167-d294-4870-b65b-c793a83be8e0.png","https://cl.imagineapi.dev/assets/b8b7586b-3147-4df3-8b46-e2d48ff23620/b8b7586b-3147-4df3-8b46-e2d48ff23620.png","https://cl.imagineapi.dev/assets/2722db46-819c-47f8-ace5-7a2afb7c18e4/2722db46-819c-47f8-ace5-7a2afb7c18e4.png","https://cl.imagineapi.dev/assets/064715cd-3699-44c2-b199-a83dc2872c9d/064715cd-3699-44c2-b199-a83dc2872c9d.png","https://cl.imagineapi.dev/assets/f6d77121-b8af-49d4-8dfe-118320511b4e/f6d77121-b8af-49d4-8dfe-118320511b4e.png","https://cl.imagineapi.dev/assets/4317d007-ab92-4c8a-bed8-4cda860d2177/4317d007-ab92-4c8a-bed8-4cda860d2177.png","https://cl.imagineapi.dev/assets/2f576d43-214d-458b-9d8c-97c3271a52d2/2f576d43-214d-458b-9d8c-97c3271a52d2.png","https://cl.imagineapi.dev/assets/4c16890f-fd3b-4e2e-a432-cad6ee2fca75/4c16890f-fd3b-4e2e-a432-cad6ee2fca75.png","https://cl.imagineapi.dev/assets/7b33c33e-8d37-4334-aef2-413dfb23a36a/7b33c33e-8d37-4334-aef2-413dfb23a36a.png","https://cl.imagineapi.dev/assets/220e0b5e-d9ff-48aa-9bab-b3c7f8e391c3/220e0b5e-d9ff-48aa-9bab-b3c7f8e391c3.png","https://cl.imagineapi.dev/assets/50b35ff2-8cb3-4949-a986-558ab4d56f77/50b35ff2-8cb3-4949-a986-558ab4d56f77.png","https://cl.imagineapi.dev/assets/092e8232-c54b-485e-8985-2476f2f7dabf/092e8232-c54b-485e-8985-2476f2f7dabf.png","https://cl.imagineapi.dev/assets/6cf1f91a-e2e6-4f7f-8ead-cf9c99269eee/6cf1f91a-e2e6-4f7f-8ead-cf9c99269eee.png","https://cl.imagineapi.dev/assets/57295cf3-0519-49a5-8163-2121bf9e6620/57295cf3-0519-49a5-8163-2121bf9e6620.png","https://cl.imagineapi.dev/assets/4ecbedb7-e916-4da0-86ea-882fabf369d1/4ecbedb7-e916-4da0-86ea-882fabf369d1.png","https://cl.imagineapi.dev/assets/5c71f70d-6259-4548-8c85-3681e4a5ce7d/5c71f70d-6259-4548-8c85-3681e4a5ce7d.png","https://cl.imagineapi.dev/assets/e906f7d9-7c7f-49de-a9a6-818c929eacbd/e906f7d9-7c7f-49de-a9a6-818c929eacbd.png","https://cl.imagineapi.dev/assets/b40ad3bb-a92f-42ff-987e-4a6836ddded4/b40ad3bb-a92f-42ff-987e-4a6836ddded4.png","https://cl.imagineapi.dev/assets/a484a7bb-0a2a-45aa-8dba-7dead2bf1334/a484a7bb-0a2a-45aa-8dba-7dead2bf1334.png","https://cl.imagineapi.dev/assets/39596443-b9d9-4447-bb7a-3cb9f562cf2f/39596443-b9d9-4447-bb7a-3cb9f562cf2f.png","https://cl.imagineapi.dev/assets/a69baece-6fa8-4266-a1c5-a05eb1af43d8/a69baece-6fa8-4266-a1c5-a05eb1af43d8.png","https://cl.imagineapi.dev/assets/bbe1c1d5-1597-4c9e-8094-63879a77552e/bbe1c1d5-1597-4c9e-8094-63879a77552e.png","https://cl.imagineapi.dev/assets/f0f7e891-e588-466b-948f-afa899aac21e/f0f7e891-e588-466b-948f-afa899aac21e.png","https://cl.imagineapi.dev/assets/250d7a41-1dce-474b-89c4-2091b0c481de/250d7a41-1dce-474b-89c4-2091b0c481de.png","https://cl.imagineapi.dev/assets/97f33f98-6968-458d-aa71-f1b6018232eb/97f33f98-6968-458d-aa71-f1b6018232eb.png","https://cl.imagineapi.dev/assets/255e4d74-7ca1-44fa-aae0-bbf149c53f4b/255e4d74-7ca1-44fa-aae0-bbf149c53f4b.png","https://cl.imagineapi.dev/assets/c5ed7c40-b0bb-4164-86dd-c4f947abc6f7/c5ed7c40-b0bb-4164-86dd-c4f947abc6f7.png","https://cl.imagineapi.dev/assets/cecf2abe-3e0e-4a3c-800d-50b2d778c65c/cecf2abe-3e0e-4a3c-800d-50b2d778c65c.png","https://cl.imagineapi.dev/assets/7962c1a6-6a1f-451c-83de-b3f3129bba4d/7962c1a6-6a1f-451c-83de-b3f3129bba4d.png","https://cl.imagineapi.dev/assets/7a1ebe62-2c57-4ce3-be9a-c818a065da1f/7a1ebe62-2c57-4ce3-be9a-c818a065da1f.png","https://cl.imagineapi.dev/assets/2cb5a3cf-b03e-4c9b-a428-1311085f141f/2cb5a3cf-b03e-4c9b-a428-1311085f141f.png","https://cl.imagineapi.dev/assets/430e934d-157a-460c-9ea9-7cd7cc3591ab/430e934d-157a-460c-9ea9-7cd7cc3591ab.png","https://cl.imagineapi.dev/assets/8903a624-d266-49a4-93dd-96709147a110/8903a624-d266-49a4-93dd-96709147a110.png","https://cl.imagineapi.dev/assets/b868498d-6a53-49e9-8552-16d648efba15/b868498d-6a53-49e9-8552-16d648efba15.png","https://cl.imagineapi.dev/assets/9c2a7289-ad51-494d-83d5-8ed773478ca6/9c2a7289-ad51-494d-83d5-8ed773478ca6.png","https://cl.imagineapi.dev/assets/c60a34dd-0667-4244-b9ec-c8563e9e27be/c60a34dd-0667-4244-b9ec-c8563e9e27be.png","https://cl.imagineapi.dev/assets/005ef384-c2d6-455b-9661-348baa26ef89/005ef384-c2d6-455b-9661-348baa26ef89.png","https://cl.imagineapi.dev/assets/51375507-ce3e-4989-896e-a60ae8d54033/51375507-ce3e-4989-896e-a60ae8d54033.png","https://cl.imagineapi.dev/assets/67959943-e17b-48a1-bf12-77cb0d8f4391/67959943-e17b-48a1-bf12-77cb0d8f4391.png","https://cl.imagineapi.dev/assets/6ec2a451-8e28-46ee-b925-bb0f11630a31/6ec2a451-8e28-46ee-b925-bb0f11630a31.png","https://cl.imagineapi.dev/assets/5429c2a4-da2f-4c0c-9895-7a624980e66e/5429c2a4-da2f-4c0c-9895-7a624980e66e.png","https://cl.imagineapi.dev/assets/ec13c5e7-b3f2-43a6-b220-ff63709be674/ec13c5e7-b3f2-43a6-b220-ff63709be674.png","https://cl.imagineapi.dev/assets/728f6100-a7f4-4b5d-9787-9ff1ab7314f6/728f6100-a7f4-4b5d-9787-9ff1ab7314f6.png","https://cl.imagineapi.dev/assets/f0a50b14-2ac5-40da-976b-3586b01fbb24/f0a50b14-2ac5-40da-976b-3586b01fbb24.png","https://cl.imagineapi.dev/assets/10d973ec-5205-4d29-a5b2-cf0623ae031a/10d973ec-5205-4d29-a5b2-cf0623ae031a.png","https://cl.imagineapi.dev/assets/919e60d1-ec16-45f0-bfe6-6ba922051dfa/919e60d1-ec16-45f0-bfe6-6ba922051dfa.png","https://cl.imagineapi.dev/assets/556ff0c0-9b01-4bf4-9895-eb7f9863af47/556ff0c0-9b01-4bf4-9895-eb7f9863af47.png","https://cl.imagineapi.dev/assets/ffd37ad8-4b09-4919-a6b2-1af9b452a421/ffd37ad8-4b09-4919-a6b2-1af9b452a421.png","https://cl.imagineapi.dev/assets/a73ec4ca-3668-4016-ac75-64197107b98f/a73ec4ca-3668-4016-ac75-64197107b98f.png","https://cl.imagineapi.dev/assets/dcf0d5d6-452a-4022-bcd7-5cb912986938/dcf0d5d6-452a-4022-bcd7-5cb912986938.png","https://cl.imagineapi.dev/assets/112107d2-005a-4082-8b5c-8f74a0383e7a/112107d2-005a-4082-8b5c-8f74a0383e7a.png","https://cl.imagineapi.dev/assets/f71444cf-f455-4510-86b0-eb768648cfb5/f71444cf-f455-4510-86b0-eb768648cfb5.png","https://cl.imagineapi.dev/assets/5120c32a-8b93-41cd-b05a-feeb06b682b8/5120c32a-8b93-41cd-b05a-feeb06b682b8.png","https://cl.imagineapi.dev/assets/d32b6d54-a29e-4685-9a95-cfca8a195691/d32b6d54-a29e-4685-9a95-cfca8a195691.png","https://cl.imagineapi.dev/assets/73a8575d-c3f4-472b-92be-c66825898037/73a8575d-c3f4-472b-92be-c66825898037.png","https://cl.imagineapi.dev/assets/fb4ecac0-4839-4ecd-a1e6-9dbe1c124d81/fb4ecac0-4839-4ecd-a1e6-9dbe1c124d81.png","https://cl.imagineapi.dev/assets/ee21acde-145f-4a05-8efe-f7425d2fbea0/ee21acde-145f-4a05-8efe-f7425d2fbea0.png","https://cl.imagineapi.dev/assets/77383dd1-6d69-4ff5-bd19-18363135cb07/77383dd1-6d69-4ff5-bd19-18363135cb07.png","https://cl.imagineapi.dev/assets/c18329f0-48d1-4ba1-b6fc-c4d2305fba2b/c18329f0-48d1-4ba1-b6fc-c4d2305fba2b.png","https://cl.imagineapi.dev/assets/c8ea3a1f-9c86-41dc-846b-b81bd49003d7/c8ea3a1f-9c86-41dc-846b-b81bd49003d7.png","https://cl.imagineapi.dev/assets/ea393910-5d27-4f30-b6f3-7ba5e57d236b/ea393910-5d27-4f30-b6f3-7ba5e57d236b.png","https://cl.imagineapi.dev/assets/6be602a2-8b38-4ab4-ba1b-16e7b245afdf/6be602a2-8b38-4ab4-ba1b-16e7b245afdf.png","https://cl.imagineapi.dev/assets/5c35b00b-6094-4a19-bdb4-7288b520cc40/5c35b00b-6094-4a19-bdb4-7288b520cc40.png","https://cl.imagineapi.dev/assets/52385ef5-6e9c-41c3-b412-9af8fb8a75ac/52385ef5-6e9c-41c3-b412-9af8fb8a75ac.png","https://cl.imagineapi.dev/assets/cc038f9c-d810-4096-ac28-a3ee0eb812fc/cc038f9c-d810-4096-ac28-a3ee0eb812fc.png","https://cl.imagineapi.dev/assets/3f055dea-b75c-4344-8c24-0b1453a352f0/3f055dea-b75c-4344-8c24-0b1453a352f0.png","https://cl.imagineapi.dev/assets/f694eeaa-2df5-410a-8af8-fbf89cd38f95/f694eeaa-2df5-410a-8af8-fbf89cd38f95.png","https://cl.imagineapi.dev/assets/5bc1da5d-9241-494a-8f71-59fe45748381/5bc1da5d-9241-494a-8f71-59fe45748381.png","https://cl.imagineapi.dev/assets/344e290f-59c8-42b3-b5de-6ede68b56d41/344e290f-59c8-42b3-b5de-6ede68b56d41.png","https://cl.imagineapi.dev/assets/94458d1e-2cd9-4673-b8e3-a0ae3da5e5ec/94458d1e-2cd9-4673-b8e3-a0ae3da5e5ec.png","https://cl.imagineapi.dev/assets/a1d30f82-cfe4-467c-acc2-930b0b5bab0b/a1d30f82-cfe4-467c-acc2-930b0b5bab0b.png","https://cl.imagineapi.dev/assets/6b3f9b8e-3737-4cb8-aa0a-2db0d13209d8/6b3f9b8e-3737-4cb8-aa0a-2db0d13209d8.png","https://cl.imagineapi.dev/assets/2ea4dd7b-f6f5-4838-a04f-06b80867a2eb/2ea4dd7b-f6f5-4838-a04f-06b80867a2eb.png","https://cl.imagineapi.dev/assets/61a766f6-49ab-44a1-94f4-93aa788c3aa6/61a766f6-49ab-44a1-94f4-93aa788c3aa6.png","https://cl.imagineapi.dev/assets/bb9a8b02-a017-4699-8580-c7f9dacc63ae/bb9a8b02-a017-4699-8580-c7f9dacc63ae.png","https://cl.imagineapi.dev/assets/15b652b0-75c7-4a25-a8b6-bd8607008668/15b652b0-75c7-4a25-a8b6-bd8607008668.png","https://cl.imagineapi.dev/assets/44d01c15-84c6-475a-8a1d-6223440a5e30/44d01c15-84c6-475a-8a1d-6223440a5e30.png","https://cl.imagineapi.dev/assets/ef7a2eed-c32b-4d14-b634-82a3d824dd4f/ef7a2eed-c32b-4d14-b634-82a3d824dd4f.png","https://cl.imagineapi.dev/assets/9b93c317-8992-4a0a-9669-cf227f479dd7/9b93c317-8992-4a0a-9669-cf227f479dd7.png","https://cl.imagineapi.dev/assets/e8e140b0-356c-4016-8f78-476e49a827af/e8e140b0-356c-4016-8f78-476e49a827af.png"
]

const sectionsInfo = {
  rationality: {
    title: "Rationality",
    img: candidateImages[0],
    tag: "Rationality",
  },
  optimization: {
    title: "Optimization",
    img: candidateImages[1],
    tag: "World Optimization"
  },
  modeling: {
    title: "Modeling",
    img: candidateImages[2],
    tag: "World Modeling"
  },
  "ai-alignment": {
    title: "AI Alignment",
    img: candidateImages[3],
    tag: "AI"
  },
  practical: {
    title: "Practical",
    img: candidateImages[4],
    tag: "Practical"
  },
  miscellany: {
    title: "Miscellany",
    img: candidateImages[5],
    tag: null
  }
};

const yearGroupInfo = {
  2022: {
    img: candidateImages[0],
  },
  2021: {
    img: candidateImages[1],
  },
  2020: {
    img: candidateImages[2],
  },
  2019: {
    img: candidateImages[3],
  },
  2018: {
    img: candidateImages[4],
  },
};

const getOffsets = (index: number, columnLength: number) => {
  const leftOffset = index % columnLength;
  const rightOffset = (columnLength - 1) - leftOffset;
  return [leftOffset, rightOffset];
}

type ExpansionState = 'full' | 'expanded' | 'collapsed' | 'hidden' | 'default';

function useWindowWidth(defaultValue = 2000): number {
  const [windowWidth, setWindowWidth] = useState(defaultValue);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(global?.visualViewport?.width || 2000);
    }

    global?.addEventListener('resize', handleResize);
    handleResize();
    return () => global.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}

async function useUpdateReviewWinnerOrder(reviewWinnersWithPosts: GetAllReviewWinnersQueryResult,updatedReviewWinnerIds: string[]) {
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

  const reviewWinnerIdMap = keyBy(reviewWinnersWithPosts, ({ reviewWinner }) => reviewWinner._id);
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
};


const TopPostsPage = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const { query } = location;
  // TODO: make an admin-only edit icon somewhere
  const [editOrderEnabled, setEditOrderEnabled] = useState(false);

  const [expansionState, setExpansionState] = useState<Record<string, ExpansionState>>({});
  const [fullyOpenGridId, setFullyOpenGridId] = useState<string>();
  const handleToggleExpand = (id: string) => {
    const elements = document.querySelectorAll(`[id^="PostsImageGrid-"]`);
    const currentState = expansionState[id] || 'default';

    const clickedElement = document.getElementById(`PostsImageGrid-${id}`);
    const clickedElementY = clickedElement?.getBoundingClientRect().top;

    const elementsToToggle = Array.from(elements).filter((element) => {
      const elementY = element.getBoundingClientRect().top;
      return elementY === clickedElementY && clickedElement
    });

    const newClickedElementState = currentState === 'expanded' ? 'default' : 'expanded';

    const newState: Record<string, ExpansionState> = {
      ...expansionState,
      ...Object.fromEntries(elementsToToggle.map(element => [element.id.replace('PostsImageGrid-', ''), currentState === 'expanded' ? 'default' : 'collapsed'])),
      [id]: newClickedElementState
    }

    setExpansionState(newState);
  }

  const handleOpenFull = (id: string) => {
    setFullyOpenGridId(id);
    // const newState: Record<string, ExpansionState> = {
    //   ...Object.fromEntries(Object.entries(expansionState).map(([key]) => [key, 'hidden'])),
    //   [id]: 'full'
    // }

    // setExpansionState(newState);
  };
  

  const {
    currentSortOrder,
    aiPostsHidden
  } = getCurrentTopPostDisplaySettings(query);

  const { SectionTitle, HeadTags, TopPostsDisplaySettings, ContentStyles, ContentItemBody, TopPostItem, TopPostEditOrder } = Components;

  const { post: reviewDescriptionPost } = usePostBySlug({ slug: 'top-posts-review-description' });

  const { data } = useQuery(gql`
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

  const sortedReviewWinners = sortReviewWinners(reviewWinnersWithPosts, currentSortOrder);
  // If AI posts are hidden, only show those posts that are not marked as "AI" posts
  const visibleReviewWinners = sortedReviewWinners.filter(({ reviewWinner: { isAI } }) => !aiPostsHidden || !isAI);

  const sectionGrid = Object.entries(sectionsInfo).map(([id, { title, img, tag }], index) => {
    const posts = visibleReviewWinners.map(({ post }) => post).filter(post => !tag || post.tags.map(tag => tag.name).includes(tag));
    const hidden = !!(fullyOpenGridId && id !== fullyOpenGridId);
    return <PostsImageGrid posts={posts} classes={classes} img={img} header={title} key={id} id={id} gridPosition={index} expansionState={expansionState[id]} handleToggleExpand={handleToggleExpand} handleOpenFull={handleOpenFull} hidden={hidden} />
  });

  const yearGrid = Object.entries(yearGroupInfo).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([year, { img }], index) => {
    const posts = visibleReviewWinners.filter(({ reviewWinner }) => reviewWinner.reviewYear.toString() === year).map(({ post }) => post);
    const hidden = !!(fullyOpenGridId && year !== fullyOpenGridId);
    return <PostsImageGrid posts={posts} classes={classes} img={img} header={year} key={year} id={year} gridPosition={index} expansionState={expansionState[year]} handleToggleExpand={handleToggleExpand} handleOpenFull={handleOpenFull} hidden={hidden} />
  });

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
          <div>
            <TopPostsDisplaySettings />
            <div className={classes.gridContainer}>
              {currentSortOrder === 'curated' ? sectionGrid : yearGrid}
            </div>
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
}

const PostsImageGrid = ({ posts, classes, img, header, id, gridPosition, expansionState, handleToggleExpand, handleOpenFull, hidden = false }: {
  posts: PostsTopItemInfo[],
  classes: ClassesType<typeof styles>,
  img: string,
  header: string,
  id: string,
  gridPosition: number,
  expansionState: ExpansionState,
  handleToggleExpand: (id: string) => void,
  handleOpenFull: (id: string) => void,
  hidden?: boolean,
}) => {
  const screenWidth = useWindowWidth(2000)
  const [leftOffset, rightOffset] = getOffsets(gridPosition, Math.min(Math.max(Math.floor((screenWidth) / 400), 1), 3));
  const paddedPosts = [...posts, ...posts.slice(0, 24)];

  const isExpanded = expansionState === 'expanded';

  const smallDisplay = screenWidth <= 800;

  const displayedPostProps: ComponentProps<typeof ImageGridPost>[] = [];
  if (leftOffset > 0) {
    const leftOffsetPosts = paddedPosts.slice(12, 12 + (12 * leftOffset));
    displayedPostProps.push(...leftOffsetPosts.map((post, i) => ({ post, index: i, classes, offscreen: true })));
  }
  
  const noOffsetPosts = paddedPosts.slice(0, 12);
  displayedPostProps.push(...noOffsetPosts.map((post, i) => ({ post, index: i, classes })));
  
  if (rightOffset > 0) {
    const rightOffsetPosts = paddedPosts.slice((leftOffset * 12) + 12, (leftOffset * 12) + 12 + (rightOffset * 12));
    displayedPostProps.push(...rightOffsetPosts.map((post, i) => ({ post, index: i, classes, offscreen: true })));
  }

  const lastDisplayedPostProps = displayedPostProps.at(-1);
  if (lastDisplayedPostProps && isExpanded) {
    lastDisplayedPostProps.hidden = true;
  }

  const displayedPosts = displayedPostProps.map((props) => <ImageGridPost key={props.post._id} {...props} />)

  return <div 
    className={classNames(classes.postsImageGrid, {
      [classes.expandedImageGrid]: isExpanded, 
      [classes.collapsedImageGrid]: expansionState === 'collapsed',
      [classes.hiddenImageGrid]: hidden
    })} 
    id={`PostsImageGrid-${id}`}
  >
    <div className={classes.imageGridHeader} onClick={() => handleToggleExpand(id)}>
      <span className={classes.toggleIcon}>
        <span className={classes.expandIcon}>+</span>
      </span>
      <h2 className={classes.imageGridHeaderTitle}>{header}</h2>
    </div>
    <div className={classes.imageGridContainer}>
      <div className={classNames(classes.imageGrid, classes[gridPositionToClassName(gridPosition) as keyof ClassesType<typeof styles>])} > 
        <img src={img} className={classes.imageGridBackground}/>
        {displayedPosts}
        <div className={classNames(classes.imageGridShowAll, { [classes.imageGridShowAllVisible]: isExpanded, [classes.imageGridShowAllTransition]: (rightOffset === 0) && !isExpanded })} onClick={() => handleOpenFull(id)}>Show All</div>
      </div>
    </div>
  </div>
}

const ImageGridPost = ({ post, index, classes, offscreen = false, hidden = false }: {
  post: PostsTopItemInfo,
  index: number,
  classes: ClassesType<typeof styles>,
  offscreen?: boolean,
  hidden?: boolean,
}) => {
  return <Link className={classNames(classes.imageGridPost)} key={post._id} to={postGetPageUrl(post)}>
  <div className={classes.imageGridPostBody}>
    <div className={classes.imageGridPostAuthor}>
      {post?.user?.displayName}
    </div>
    <div className={classNames(classes.imageGridPostTitle, { [classes.imageGridPostOffscreen]: offscreen && !hidden, [classes.imageGridPostHidden]: hidden })}>
      {post.title}
    </div>
  </div>
  <img className={classes.imageGridPostBackground} src={candidateImages[index]} loading="lazy" />
</Link>
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
