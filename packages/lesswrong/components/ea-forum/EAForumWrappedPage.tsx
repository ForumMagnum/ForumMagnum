import React, { useEffect, useMemo, useState } from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib";
import moment from "moment";
import { Link } from "../../lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";
import { gql, useQuery } from "@apollo/client";
import { truncatise } from "../../lib/truncatise";
import { useConcreteThemeOptions } from "../themes/useTheme";
import InfoIcon from '@material-ui/icons/Info'
import ClockIcon from '@material-ui/icons/Schedule'
import PersonIcon from '@material-ui/icons/Person'
import TopicIcon from '@material-ui/icons/LocalOffer'
import PostIcon from '@material-ui/icons/Description'
import CommentIcon from '@material-ui/icons/Message'
import ShortformIcon from '@material-ui/icons/Notes'
import KarmaIcon from '@material-ui/icons/Star'
import NearMeIcon from '@material-ui/icons/NearMe'
import { RibbonIcon } from "../icons/ribbonIcon";
import { AnalyticsContext } from "../../lib/analyticsEvents";


const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  loading: {
    textAlign: 'center',
  },
  loadingGif: {
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      marginTop: 30
    }
  },
  summaryCard: {
    position: 'relative',
    maxWidth: 640,
    backgroundColor: theme.palette.background.default,
    padding: '32px 14px 20px',
    borderTopLeftRadius: '255px 15px',
    borderTopRightRadius: '15px 225px',
    borderBottomRightRadius: '225px 15px',
    borderBottomLeftRadius: '15px 255px',
    border: `3px solid ${theme.palette.border.primaryTranslucent}`,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      padding: '24px 14px 16px',
    }
  },
  ribbonIcon: {
    position: 'absolute',
    top: -40,
    left: -114,
    width: 220,
    transform: 'rotate(-40deg)',
    fill: theme.palette.primary.main,
    stroke: theme.palette.background.default,
    zIndex: -1
  },
  summaryHeadline: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    columnGap: 5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 600,
    [theme.breakpoints.down('xs')]: {
      fontSize: 22,
    }
  },
  loggedOutSection: {
    maxWidth: 300,
    margin: '20px auto 0'
  },
  unqualifiedUserSection: {
    maxWidth: 435,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    fontSize: 16,
    lineHeight: '24px',
    padding: '0 20px',
    margin: '20px auto 14px'
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: '50% 50%',
    gridGap: '14px 14px',
    fontFamily: theme.typography.fontFamily,
    padding: '0 30px',
    margin: '16px auto 0',
    [theme.breakpoints.down('xs')]: {
      padding: '0 14px',
    },
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    }
  },
  summarySectionTitleRow: {
    padding: '0 30px',
    margin: '20px auto 0',
    [theme.breakpoints.down('xs')]: {
      padding: '0 14px',
    },
  },
  summarySectionTitle: {
    display: 'inline-block',
    fontFamily: theme.typography.fontFamily,
    fontSize: 18,
    lineHeight: '24px',
    paddingBottom: 4,
    borderBottom: `2px solid rgba(255, 168, 50, 0.6)`
  },
  summaryData: {
  },
  summaryDataLabel: {
    display: 'flex',
    columnGap: 6,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[900],
    fontSize: 14,
    lineHeight: '18px',
    marginBottom: 8
  },
  labelIcon: {
    fontSize: 16,
    fill: theme.palette.grey[600]
  },
  infoIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  summaryDataVal: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '3px',
    fontFamily: theme.typography.headline.fontFamily,
    color: theme.palette.grey[800],
    fontSize: 16,
    lineHeight: '24px',
    marginBottom: 5
  },
  count: {
    color: theme.palette.grey[600],
    fontSize: 12,
    lineHeight: '16px'
  },
  link: {
    overflowWrap: 'anywhere',
    color: theme.palette.primary.main,
  },
  darkLink: {
    color: theme.palette.primary.dark,
  },
  textSection: {
    margin: '40px 0 0',
  },
  postsListSection: {
  },
  sectionHeadlineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 8
  },
  sectionHeadline: {
    fontSize: 25,
    lineHeight: '32px',
    marginBottom: 8
  },
  mvpLabel: {
    maxWidth: 54,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    fontSize: 12,
    lineHeight: '16px',
    textAlign: 'center'
  },
  body: {
    color: theme.palette.grey[800],
    lineHeight: '22px'
  }
})

const EAForumWrappedPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const theme = useConcreteThemeOptions()
  // animation gif depends on whether the user has light or dark mode,
  // but due to "auto" we need to make that determination on the client
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationCompleted, setAnimationCompleted] = useState(false)
  
  // make sure the full 3 sec gif plays
  useEffect(() => {
    setShowAnimation(true)
    setTimeout(() => {
      setShowAnimation(false)
      setAnimationCompleted(true)
    }, 2900);
  }, []);
  
  const { data, loading } = useQuery(gql`
    query getWrappedData($year: Int!) {
      UserWrappedDataByYear(year: $year) {
        alignment
        totalSeconds
        engagementPercentile
        postsReadCount
        mostReadAuthors {
          displayName
          slug
          count
        }
        mostReadTopics {
          name
          slug
          count
        }
        postCount
        topPost {
          _id
          title
          slug
          baseScore
        }
        commentCount
        topComment {
          _id
          postId
          baseScore
          contents {
            plaintextMainText
          }
        }
        shortformCount
        topShortform {
          _id
          postId
          baseScore
          contents {
            plaintextMainText
          }
        }
        karmaChange
      }
    }
  `, {
    variables: {
      year: 2022
    },
    ssr: true,
    skip: !currentUser
  })
  
  const { SingleColumnSection, Typography, HoverPreviewLink, PostsByVoteWrapper, WrappedLoginForm, LWTooltip, Loading } = Components
  
  // if there's no logged in user, prompt them to login
  if (!currentUser) {
    return <div className={classes.root}>
      <SingleColumnSection>
        <div className={classes.summaryCard}>
          <Typography variant="headline" className={classes.summaryHeadline}>
            ✨&nbsp;2022 EA&nbsp;Forum Wrapped&nbsp;✨
          </Typography>
          <div className={classes.loggedOutSection}>
            <WrappedLoginForm />
          </div>
        </div>
      </SingleColumnSection>
    </div>
  }
  
  // calculate the user's # of years on the site at Dec 31, 2022
  const userCreatedAt = moment(currentUser.createdAt)
  const endOf2022 = moment().year(2023).dayOfYear(0)
  const userAge = endOf2022.diff(moment(currentUser.createdAt), 'years') + 1
  // if their account was created after 2022, show this message
  if (userCreatedAt.isAfter(endOf2022)) {
    return <div className={classes.root}>
      <SingleColumnSection>
        <div className={classes.summaryCard}>
          <Typography variant="headline" className={classes.summaryHeadline}>
            ✨&nbsp;2022 EA&nbsp;Forum Wrapped&nbsp;✨
          </Typography>
          <div className={classes.unqualifiedUserSection}>
            Looks like you didn't have an account in 2022 - check back in at the end of 2023!
          </div>
        </div>
      </SingleColumnSection>
    </div>
  }
  
  if (showAnimation) {
    const gifName = theme.name === 'dark' ? 'v1672178471/wrapped_gif_v3_dark_mode.gif' : 'v1672178471/wrapped_gif_v3_light_mode.gif'
    return <div className={classes.loading}>
      <img src={`https://res.cloudinary.com/cea/image/upload/c_crop,w_250,h_250/${gifName}`} className={classes.loadingGif} />
    </div>
  }
  // we start out with the loading animation, before we know if we need the light or dark mode gif
  if (!animationCompleted || loading) {
    return <Loading />
  }
  
  const results = data?.UserWrappedDataByYear
  const hasReadContent = results.postsReadCount > 0
  const hasPublishedContent = results.topPost || results.topComment || results.topShortform

  return (
    <AnalyticsContext pageContext="eaYearWrapped">
      <div className={classes.root}>
        <SingleColumnSection>
          <div className={classes.summaryCard}>
            <RibbonIcon className={classes.ribbonIcon} />
            
            <Typography variant="headline" className={classes.summaryHeadline}>
              <div>{currentUser?.displayName}'s</div>
              <div>✨&nbsp;2022 EA&nbsp;Forum Wrapped&nbsp;✨</div>
            </Typography>
            
            <h2 className={classes.summarySectionTitleRow}>
              <div className={classes.summarySectionTitle}>
                It's your {moment.localeData().ordinal(userAge)} year on the EA Forum
              </div>
            </h2>
            <div className={classes.summarySection}>
              <AnalyticsContext pageSectionContext="hoursSpent">
                <div className={classes.summaryData}>
                  <div className={classes.summaryDataLabel}>
                    <ClockIcon className={classes.labelIcon} />
                    Hours spent here this year
                  </div>
                  <div className={classes.summaryDataVal}>
                    {Math.round(results.totalSeconds / 360) / 10}
                    <span className={classes.count}>
                      That's more time than {Math.trunc(results.engagementPercentile * 100)}% of other users!
                    </span>
                  </div>
                </div>
              </AnalyticsContext>
              <div className={classes.summaryData}>
                <div className={classes.summaryDataLabel}>
                  <NearMeIcon className={classes.labelIcon} />
                  <div>
                    Your EA Forum <a href="https://en.wikipedia.org/wiki/Alignment_(Dungeons_%26_Dragons)#Alignments" target="_blank" rel="noopener noreferrer" className={classes.darkLink}>
                      alignment
                    </a>
                  </div>
                </div>
                <div className={classes.summaryDataVal}>
                  {results?.alignment}
                </div>
              </div>
            </div>
            
            {hasReadContent && <>
              <h2 className={classes.summarySectionTitleRow}>
                <div className={classes.summarySectionTitle}>
                  You read {results.postsReadCount} post{results.postsReadCount === 1 ? '' : 's'} this year
                </div>
              </h2>
              <div className={classes.summarySection}>
                <AnalyticsContext pageSectionContext="mostReadAuthors">
                  <div className={classes.summaryData}>
                    <div className={classes.summaryDataLabel}>
                      <PersonIcon className={classes.labelIcon} />
                      Your favorite authors
                    </div>
                      <div>
                        {results.mostReadAuthors.map((author: AnyBecauseTodo) => {
                          return <div key={author.slug} className={classes.summaryDataVal}>
                            <Link to={`/users/${author.slug}?from=2022_wrapped`} className={classes.link}>{author.displayName}</Link>
                            <span className={classes.count}>{author.count} post{author.count === 1 ? '' : 's'} read</span>
                          </div>
                        })}
                      </div>
                  </div>
                </AnalyticsContext>
                {results.mostReadTopics?.length > 0 && <AnalyticsContext pageSectionContext="mostReadTopics">
                  <div className={classes.summaryData}>
                    <div className={classes.summaryDataLabel}>
                      <TopicIcon className={classes.labelIcon} />
                      Your favorite topics <LWTooltip title="We've disqualified Community from this stat because it gets applied to a lot of posts, and doesn't function like other topics.">
                        <InfoIcon className={classes.infoIcon} />
                      </LWTooltip>
                    </div>
                    <div>
                      {results.mostReadTopics.map((topic: AnyBecauseTodo) => {
                        return <div key={topic.slug} className={classes.summaryDataVal}>
                          <span className={classes.link}><HoverPreviewLink href={`/topics/${topic.slug}`} innerHTML={topic.name}/></span>
                          <span className={classes.count}>{topic.count} post{topic.count === 1 ? '' : 's'} read</span>
                        </div>
                      })}
                    </div>
                  </div>
                </AnalyticsContext>}
              </div>
            </>}
            
            {hasPublishedContent && <>
              <h2 className={classes.summarySectionTitleRow}>
                <div className={classes.summarySectionTitle}>
                  You joined the conversation this year
                </div>
              </h2>
              <div className={classes.summarySection}>
                {results.topPost && <AnalyticsContext pageSectionContext="topPost">
                  <div className={classes.summaryData}>
                    <div className={classes.summaryDataLabel}>
                      <PostIcon className={classes.labelIcon} />
                      Your highest-karma post
                    </div>
                    <div className={classes.summaryDataVal}>
                      <span className={classes.link}>
                        <HoverPreviewLink
                          href={`/posts/${results.topPost._id}/${results.topPost.slug}`}
                          innerHTML={truncatise(results.topPost.title, {
                            TruncateLength: 50,
                            TruncateBy: 'characters',
                            Suffix: '...',
                          })}
                        />
                      </span>
                      <span className={classes.count}>
                        {results.postCount} post{results.postCount === 1 ? '' : 's'} total
                      </span>
                    </div>
                  </div>
                </AnalyticsContext>}
                {results.topComment && <AnalyticsContext pageSectionContext="topComment">
                    <div className={classes.summaryData}>
                      <div className={classes.summaryDataLabel}>
                        <CommentIcon className={classes.labelIcon} />
                        Your highest-karma comment
                      </div>
                      <div className={classes.summaryDataVal}>
                        <span className={classes.link}>
                          <HoverPreviewLink
                            href={`/posts/${results.topComment.postId}?commentId=${results.topComment._id}`}
                            innerHTML={truncatise(results.topComment.contents.plaintextMainText, {
                              TruncateLength: 50,
                              TruncateBy: 'characters',
                              Suffix: '...',
                            })}
                          />
                        </span>
                        <span className={classes.count}>
                          {results.commentCount} comment{results.commentCount === 1 ? '' : 's'} total
                        </span>
                      </div>
                    </div>
                </AnalyticsContext>}
                {results.topShortform && <AnalyticsContext pageSectionContext="topShortform">
                  <div className={classes.summaryData}>
                    <div className={classes.summaryDataLabel}>
                      <ShortformIcon className={classes.labelIcon} />
                      Your highest-karma quick take
                    </div>
                    <div className={classes.summaryDataVal}>
                      <span className={classes.link}>
                        <HoverPreviewLink
                          href={`/posts/${results.topShortform.postId}?commentId=${results.topShortform._id}`}
                          innerHTML={truncatise(results.topShortform.contents.plaintextMainText, {
                            TruncateLength: 50,
                            TruncateBy: 'characters',
                            Suffix: '...',
                          })}
                        />
                      </span>
                      <span className={classes.count}>
                        {results.shortformCount} shortform{results.shortformCount === 1 ? '' : 's'} total
                      </span>
                    </div>
                  </div>
                </AnalyticsContext>}
                {(results.karmaChange !== null) && <div className={classes.summaryData}>
                  <div className={classes.summaryDataLabel}>
                    <KarmaIcon className={classes.labelIcon} />
                    Your overall karma change
                  </div>
                  <div className={classes.summaryDataVal}>
                    {results.karmaChange > 0 ? '+' : ''}{results.karmaChange}
                  </div>
                </div>}
              </div>
            </>}
          </div>
        </SingleColumnSection>
        
        {hasReadContent && <>
          <SingleColumnSection>
            <div className={classes.textSection}>
              <Typography variant="headline" className={classes.sectionHeadline}>Take a moment to reflect on 2022</Typography>
              <Typography variant="body2" className={classes.body}>
                Look back at everything you enjoyed reading - what did you find most valuable? Your answers will help us encourage more of the most valuable content.
              </Typography>
            </div>
          </SingleColumnSection>
          
          <AnalyticsContext pageSectionContext="bigUpvotes">
            <SingleColumnSection>
              <div className={classes.postsListSection}>
                <div className={classes.sectionHeadlineRow}>
                  <Typography variant="headline" className={classes.sectionHeadline}>Your Strong Upvotes from 2022</Typography>
                  <div className={classes.mvpLabel}>Most Valuable</div>
                </div>
                <PostsByVoteWrapper voteType="bigUpvote" year={2022} showMostValuableCheckbox />
              </div>
            </SingleColumnSection>
          </AnalyticsContext>
          
          <AnalyticsContext pageSectionContext="smallUpvotes">
            <SingleColumnSection>
              <div className={classes.postsListSection}>
                <div className={classes.sectionHeadlineRow}>
                  <Typography variant="headline" className={classes.sectionHeadline}>Your Upvotes from 2022</Typography>
                  <div className={classes.mvpLabel}>Most Valuable</div>
                </div>
                <PostsByVoteWrapper voteType="smallUpvote" year={2022} showMostValuableCheckbox />
              </div>
            </SingleColumnSection>
          </AnalyticsContext>
        </>}
        
        <SingleColumnSection>
          <div className={classes.textSection}>
            <Typography variant="headline" className={classes.sectionHeadline}>Thank you! 💜</Typography>
            <Typography variant="body2" className={classes.body}>
              Thanks for being part of the EA Forum and helping the community think about how to do the most good in the world.
            </Typography>
          </div>
        </SingleColumnSection>
      </div>
    </AnalyticsContext>
  )
}

const EAForumWrappedPageComponent = registerComponent('EAForumWrappedPage', EAForumWrappedPage, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrappedPage: typeof EAForumWrappedPageComponent
  }
}
