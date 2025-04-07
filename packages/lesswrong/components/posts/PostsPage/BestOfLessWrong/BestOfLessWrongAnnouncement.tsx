import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { REVIEW_YEAR } from '@/lib/reviewUtils';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';

const styles = defineStyles("BestOfLessWrongAnnouncement", (theme: ThemeType) => ({ 
  title: {
    ...theme.typography.title,
    fontSize: 50,
    marginBottom: 16,
  },
  categoriesContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    '&:hover $item': {
      opacity: 1,
    },
    '&:hover $winnerItem': {
      opacity: 1,
      borderBottom: theme.palette.border.grey200,
    },
    '&:hover $winnerItem:last-child': {
      borderBottom: 'none',
    },
    '&:hover $winnerTitle': {
      opacity: 1,
    },
    '&:hover $categoryImage': {
      filter: "brightness(0.5) saturate(.5)",
    },
    '&:hover $categoryTitle': {
      opacity: 0,
    },
    '&:hover $winnerCategoryRank': {
      opacity: 1,
    },
  },
  winnersContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  categoryImage: {
    width: "100%",
    height: 360,
    objectFit: "cover",
    objectPosition: "center",
    borderRadius: 2,
    filter: "brightness(0.85) saturate(1)",
    transition: "opacity 0.2s ease-in-out",
  },
  categoryImageContainer: {
    height: 360,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  categoryImageHover: {
    opacity: 0,
  },
  category: {
    width: "calc(16% - 2px)",
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
    cursor: "pointer",
    '&:hover': {
      opacity: 1
    },
  },
  categoryTitle: {
    ...theme.typography.body1,
    fontSize: 18,
    ...theme.typography.headerStyle,
    lineHeight: '1.2',
    textAlign: 'center',
    fontWeight: 600,
    marginTop: 12,
    position: "absolute",
    top: "48%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: theme.palette.text.alwaysWhite,
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(1px)',
    textShadow: `0 0 4px ${theme.palette.greyAlpha(.8)}, 0 0 8px ${theme.palette.greyAlpha(.2)}`,
  },
  winnerItem: {
    width: "100%",
    height: 120,
    overflow: "hidden",
    borderBottom: theme.palette.border.faint,
    position: "relative",
    cursor: "pointer",
    marginBottom: 1,
    zIndex: 1,
    '&:hover $winnerImage': {
      opacity: 1,
      filter: "brightness(1) saturate(1)",
    },
    '&:hover $winnerCategoryRank': {
      color: theme.palette.grey[300],
    },
    '&:hover $winnerTitle': {
      color: theme.palette.grey[100],
    },
    '&:hover $winnerImageBackground': {
      opacity: .2,
    },
  },
  winnerImage: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    height: 360,
    overflow: "hidden",
    opacity: 0,
    objectFit: "cover",
    objectPosition: "center",
    transform: "scale(2)",
    borderRadius: 2,
    filter: "brightness(0.75) saturate(.75)",
    transition: "opacity 0.2s ease-in-out",
    zIndex: 1,
  },
  winnerImageHover: {
    opacity: 1
  },
  winnerTitle: {
    ...theme.typography.body2,
    transition: "opacity 0.2s ease-in-out",
    fontSize: 13,
    color: theme.palette.grey[300],
    lineHeight: '1.2',
    position: "absolute",
    textShadow: `0px 0px 3px ${theme.palette.text.alwaysBlack}, 0 0 5px ${theme.palette.text.alwaysBlack}`,
    top: 8,
    left: 8,
    right: 8,
    opacity: 0,
  },
  winnerCategoryRank: {
    ...theme.typography.body2,
    transition: "opacity 0.1s ease-in-out",
    fontSize: '.9rem',
    color: theme.palette.grey[500],
    lineHeight: '1.2',
    position: "absolute",
    bottom: 8,
    left: 8,
    opacity: 0,
    textShadow: `0 0 4px ${theme.palette.greyAlpha(.8)}`,
  },
  winnerImageBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: theme.palette.background.paper,
    opacity: 0,
    zIndex: 1,
  }
}));

const BestOfLessWrongAnnouncement = () => {
  const classes = useStyles(styles);

  const { results } = useMulti({
    terms: {
      view: "bestOfLessWrongAnnouncement",
    },
    limit: 18,
    collectionName: "ReviewWinners",
    fragmentName: "ReviewWinnerAnnouncement",
  });

  const topPerCategory = groupBy(results, 'category');

  const { SingleColumnSection } = Components;

  const sections = {
    'Rationality': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,w_0.15,x_0.29,y_-0.05,h_1/dpr_2.0,w_1080/f_auto,q_auto/v1708753260/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_09275054-eb84-43c4-9cfa-4a05e1818c9e_rmov5i.png',
      topThree: topPerCategory['rationality']?.slice(0, 3),
    },
    'Modeling': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/a_hflip/c_crop,w_1,x_0,y_0.05,h_1/dpr_2.0,w_1080/f_auto,q_auto/v1708753450/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_15ba02c3-b268-45f1-a780-322bbaa6fc22_eu9l0l.png',
      topThree: topPerCategory['modeling']?.slice(0, 3),
    },
    'Optimization': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,a_hflip,w_0.99,x_-0.35,y_0.2,h_1/dpr_2.0,w_1080/f_auto,q_auto/v1708753382/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_242eda7f-95a9-4c3b-8090-991a1b11286f_xcjhxq.png',
      topThree: topPerCategory['optimization']?.slice(0, 3),
    },
    'AI Safety': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,w_0.801,x_0.6,y_0.4,h_1/dpr_2.0,w_1080/f_auto,fl_progressive,q_auto/v1708570131/lwbot_topographic_watercolor_artwork_of_a_giant_robot_hand_gent_e4e9f305-9611-4787-8768-d7af3d702ed4_ta2ii9.png',
      topThree: topPerCategory['ai safety']?.slice(0, 3),
    },
    'AI Strategy': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,w_0.99,x_0,y_0,h_1/dpr_2.0,w_1080/f_auto,q_auto/v1708753570/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_8dda30ee-71d6-4b24-80c7-a8499a5b25c6_uacvgk.png',
      topThree: topPerCategory['ai strategy']?.slice(0, 3),
    },
    'Practical': {
      img: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,w_0.651,x_0.32,y_0.05,h_1/dpr_2.0,w_1080/f_auto,q_auto/v1708974564/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_4f6449e2-569b-48a3-b878-a400315b3ef0_hqutxe.png',
      topThree: topPerCategory['practical']?.slice(0, 3),
    },
  }

  return (
    <AnalyticsContext pageSectionContext="bestOfLessWrongAnnouncement">
      <SingleColumnSection>
        <div className={classes.title}>
          Best of LessWrong {REVIEW_YEAR}
        </div>
        <div className={classes.categoriesContainer}>
          {Object.keys(sections).map(category => {
            const section = sections[category as keyof typeof sections];
            return <div className={classes.category} key={category}>
              <div className={classes.categoryImageContainer}>
                <img src={section.img} className={classes.categoryImage}/>
                <div className={classes.winnersContainer}> 
                  {section.topThree?.map(({post, _id}, index) => {
                    if (!post) return null;
                    return <Link key={_id} to={postGetPageUrl(post)} className={classes.winnerItem}>
                      <div className={classes.winnerImageBackground} />
                      <div className={classes.winnerTitle}>
                        {post?.title}
                      </div>
                      <div className={classes.winnerCategoryRank}>#{index + 1} in {category}</div>
                    </Link>
                  })}
                </div>
              </div>
              <div className={classes.categoryTitle}>
                {category}
              </div>
            </div>
            })}
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const BestOfLessWrongAnnouncementComponent = registerComponent('BestOfLessWrongAnnouncement', BestOfLessWrongAnnouncement);

declare global {
  interface ComponentTypes {
    BestOfLessWrongAnnouncement: typeof BestOfLessWrongAnnouncementComponent
  }
}

export default BestOfLessWrongAnnouncement;
