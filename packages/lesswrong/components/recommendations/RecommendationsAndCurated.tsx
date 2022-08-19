import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { CuratedContent } from './CuratedContentItem';

const sequenceHighlights: CuratedContent = {
  documentType: "Collection",
  document: {
    _id: "NBDFAKt3GbFwnwzQF",
    title: "The Sequences Highlights",
    slug: "highlights"
  },
  description: `<div>How can we think better on purpose? Why should we think better on purpose?<br/> Read up on the core concepts that underly the LessWrong community.
    </div>`,
  // hideSummaryOnMobile: true,
  imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1660339717/coverimage-05_qvc8ca.png",
  firstPost: {
    _id: "46qnWRSR7L2eyNbMA",
    url: "/s/NBDFAKt3GbFwnwzQF/p/46qnWRSR7L2eyNbMA",
    title: "The Lens That Sees Its Flaws"
  }
}

const multiagentmodels: CuratedContent = {
  documentType: "Sequence",
  document: {
    _id: "asdf",
    title: "Multiagent Models of Mind",
  },
  description: "Can we think model the functioning of the brain into a number of subsystems, which communicate in part through the global neuronal workspace of consciousness.",
  imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1660861487/DALL_E_2022-08-18_15.08.28_-_multiagent_models_of_mind_aquarelle_painting_by_Thomas_Schaller_as_digital_art_edited_j9bttt.png",
  firstPost: {
    _id: "46qnWRSR7L2eyNbMA",
    url: "/s/NBDFAKt3GbFwnwzQF/p/46qnWRSR7L2eyNbMA",
    title: "The Lens That Sees Its Flaws"
  }
}

const replacingGuilt: CuratedContent = {
  documentType: "Sequence",
  document: {
    _id: "asdf",
    title: "Replacing Guilt",
  },
  description: "A sequence about replacing guilt with other feelings and finding better ways to self-motivate, so that you can build a better future without falling apart in the process.",
  imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1660865781/DALL_E_2022-08-18_16.23.11_-_a_young_man_removing_the_guilt_from_his_heart_starry_sky_backdrop_on_a_white_background_aquarelle_painting_by_Thomas_Schaller_as_digital_art_-_edited_fga7cd.png",
  firstPost: {
    _id: "46qnWRSR7L2eyNbMA",
    url: "/s/NBDFAKt3GbFwnwzQF/p/46qnWRSR7L2eyNbMA",
    title: "Half-assing it with everything you've got"
  }
}

const babbleAndPrune: CuratedContent = {
  documentType: "Sequence",
  document: {
    _id: "asdf",
    title: "Babble & Prune",
  },
  description: "Two Gods - Babble and Prune, Artist and Critic, Generator and Discriminator - are locked in eternal conflict over your mind. Only you, chosen hero, can restore the balance between these two ancient deities, and in doing so maximize your creative output.",
  imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,g_east,w_1024,x_232/v1660868045/DALL_E_2022-08-18_17.04.09_-_a_pair_of_pruning_shears_next_to_giant_soap_bubbles_aquarelle_painting_by_Thomas_Schaller_and_Da_Vinci_as_digital_art_on_white_background_rdwrb8.png",
  firstPost: {
    _id: "46qnWRSR7L2eyNbMA",
    url: "/s/NBDFAKt3GbFwnwzQF/p/46qnWRSR7L2eyNbMA",
    title: "Babble"
  }
}

const cfarHandbook: CuratedContent = {
  documentType: "Sequence",
  document: {
    _id: "asdf",
    title: "CFAR Handbook",
  },
  description: "The Center for Applied Rationality set out to develop simple, concrete concepts and techniques that could be applied to anyone's problems and goals.",
  imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1660869601/DALL_E_2022-08-18_17.31.52_-_students_sitting_on_bean_bags_in_front_of_teacher_by_whiteboard_with_math_aquarelle_painting_by_JMW_Turner_-_edited2_zm0x5r.png",
  firstPost: {
    _id: "46qnWRSR7L2eyNbMA",
    url: "/s/NBDFAKt3GbFwnwzQF/p/46qnWRSR7L2eyNbMA",
    title: "CFAR Handbook: Introduction"
  }
}

export const curatedUrl = "/recommendations"

const styles = (theme: ThemeType): JssStyles => ({
  section: {
    marginTop: -12,
  },
  continueReadingList: {
    marginBottom: theme.spacing.unit*2,
  },
  subsection: {
    marginBottom: theme.spacing.unit,
  },
  footerWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 12,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "center",
    }
  },
  footer: {
    color: theme.palette.grey[600],
    flexGrow: 1,
    flexWrap: "wrap",
    maxWidth: 450,
    display: "flex",
    justifyContent: "space-around",
  },
  loggedOutFooter: {
    maxWidth: 450,
    marginLeft: "auto"
  },
  largeScreenLoggedOutSequences: {
    marginTop: 2,
    marginBottom: 2,
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  smallScreenLoggedOutSequences: {
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
  },
  loggedOutCustomizeLabel: {
    fontSize: "1rem",
    fontStyle: "italic"
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
  }
});

const getFrontPageOverwrites = (haveCurrentUser: boolean): Partial<RecommendationsAlgorithm> => {
  if (forumTypeSetting.get() === 'EAForum') {
    return {
      method: haveCurrentUser ? 'sample' : 'top',
      count: haveCurrentUser ? 3 : 5
    }
  }
  if (forumTypeSetting.get() === "LessWrong") {
    return {
      lwRationalityOnly: true,
      method: 'sample',
      count: haveCurrentUser ? 3 : 2
    }
  }
  return {
    method: 'sample',
    count: haveCurrentUser ? 3 : 2
  }
}

const isLW = forumTypeSetting.get() === 'LessWrong'

const RecommendationsAndCurated = ({
  configName,
  classes,
}: {
  configName: string,
  classes: ClassesType,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettings] = useState<any>(null);
  const currentUser = useCurrentUser();
  const {continueReading} = useContinueReading();

  const toggleSettings = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings, setShowSettings]);

  const render = () => {
    const { CuratedContentItem, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsButton, ContinueReadingList, RecommendationsList, SectionTitle, SectionSubtitle, BookmarksList, LWTooltip, PostsList2 } = Components;

    const settings = getRecommendationSettings({settings: settingsState, currentUser, configName})
    const frontpageRecommendationSettings: RecommendationsAlgorithm = {
      ...settings,
      ...getFrontPageOverwrites(!!currentUser)
    }

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've bookmarked</div>
      <div><em>(Click to see all)</em></div>
    </div>

    // Disabled during 2018 Review [and coronavirus]
    const recommendationsTooltip = <div>
      <div>
        {forumTypeSetting.get() === 'EAForum' ?
          'Assorted suggested reading, including some of the ' :
          'Recently curated posts, as well as a random sampling of '}
        top-rated posts of all time
        {settings.onlyUnread && " that you haven't read yet"}.
      </div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    const renderBookmarks = ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks
    const renderContinueReading = currentUser && (continueReading?.length > 0) && !settings.hideContinueReading
    
    const bookmarksLimit = (settings.hideFrontpage && settings.hideContinueReading) ? 6 : 3 

    return <SingleColumnSection className={classes.section}>
      <AnalyticsContext pageSectionContext="recommendations">
        <SectionTitle title={<LWTooltip title={recommendationsTooltip} placement="left">
          <Link to={"/recommendations"}>Recommendations</Link>
        </LWTooltip>}>
          {currentUser &&
            <LWTooltip title="Customize your recommendations">
              <SettingsButton showIcon={false} onClick={toggleSettings} label="Customize"/>
            </LWTooltip>
          }
        </SectionTitle>

        {showSettings &&
          <RecommendationsAlgorithmPicker
            configName={configName}
            settings={frontpageRecommendationSettings}
            onChange={(newSettings) => setSettings(newSettings)}
          /> }

        {isLW && <AnalyticsContext pageSubSectionContext="frontpageCuratedCollections">
          <CuratedContentItem content={sequenceHighlights} />
          <CuratedContentItem content={multiagentmodels} />
          <CuratedContentItem content={replacingGuilt} />
          <CuratedContentItem content={babbleAndPrune} />
          <CuratedContentItem content={cfarHandbook} />
        </AnalyticsContext>}

        {!currentUser && forumTypeSetting.get() === 'LessWrong' && <div>
          {/* <div className={classes.largeScreenLoggedOutSequences}>
            <AnalyticsContext pageSectionContext="frontpageCuratedSequences">
              <CuratedSequences />
            </AnalyticsContext>
          </div>
          <div className={classes.smallScreenLoggedOutSequences}>
            <ContinueReadingList continueReading={continueReading} />
          </div> */}
        </div>}

        <div className={classes.subsection}>
          <div className={classes.posts}>
            {!settings.hideFrontpage && 
              <AnalyticsContext listContext="frontpageFromTheArchives" pageSubSectionContext="frontpageFromTheArchives" capturePostItemOnMount>
                <RecommendationsList algorithm={frontpageRecommendationSettings} />
              </AnalyticsContext>
            }
            <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
              <PostsList2
                terms={{view:"curated", limit: currentUser ? 3 : 2}}
                showNoResults={false}
                showLoadMore={false}
                hideLastUnread={true}
                boxShadow={false}
                curatedIconLeft={true}
              />
            </AnalyticsContext>
          </div>
        </div>

        {renderContinueReading && <div className={currentUser ? classes.subsection : null}>
          <AnalyticsContext pageSubSectionContext="continueReading">
            <LWTooltip placement="top-start" title={continueReadingTooltip}>
              <Link to={"/library"}>
                <SectionSubtitle className={classNames(classes.subtitle, classes.continueReading)}>
                  Continue Reading
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            <ContinueReadingList continueReading={continueReading} />
          </AnalyticsContext>
        </div>}

        {renderBookmarks && <div className={classes.subsection}>
          <AnalyticsContext pageSubSectionContext="frontpageBookmarksList" listContext={"frontpageBookmarksList"} capturePostItemOnMount>
            <LWTooltip placement="top-start" title={bookmarksTooltip}>
              <Link to={"/bookmarks"}>
                <SectionSubtitle>
                  Bookmarks
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            <BookmarksList limit={bookmarksLimit} hideLoadMore={true}/>
          </AnalyticsContext>
        </div>}

        {/* disabled except during review */}
        {/* <AnalyticsContext pageSectionContext="LessWrong 2018 Review">
          <FrontpageVotingPhase settings={frontpageRecommendationSettings} />
        </AnalyticsContext> */}

        {/* disabled except during coronavirus times */}
        {/* <AnalyticsContext pageSectionContext="coronavirusWidget">
          <div className={classes.subsection}>
            <CoronavirusFrontpageWidget settings={frontpageRecommendationSettings} />
          </div>
        </AnalyticsContext> */}
      </AnalyticsContext>
    </SingleColumnSection>
  }

  return render();
}

const RecommendationsAndCuratedComponent = registerComponent("RecommendationsAndCurated", RecommendationsAndCurated, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsAndCurated: typeof RecommendationsAndCuratedComponent
  }
}
