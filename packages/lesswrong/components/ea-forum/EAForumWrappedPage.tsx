import React, { useEffect, useState } from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";
import { gql, useQuery } from "@apollo/client";
import { truncatise } from "../../lib/truncatise";
import { useConcreteThemeOptions } from "../themes/useTheme";
import PersonIcon from '@material-ui/icons/Person'
import TopicIcon from '@material-ui/icons/LocalOffer'
import PostIcon from '@material-ui/icons/Description'
import CommentIcon from '@material-ui/icons/Message'
import ShortformIcon from '@material-ui/icons/Notes'
import KarmaIcon from '@material-ui/icons/Star'
import NearMeIcon from '@material-ui/icons/NearMe'
import { RibbonIcon } from "../icons/ribbonIcon";


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
    // backgroundColor: theme.palette.primary.main,
    // background: `linear-gradient(to bottom right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    // color: theme.palette.grey[0],
    padding: '32px 14px 20px',
    // borderRadius: 12,
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
    // color: theme.palette.grey[0],
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
  summarySection: {
    // maxWidth: 500,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: '24px 14px',
    fontFamily: theme.typography.fontFamily,
    padding: '0 30px',
    margin: '24px auto 0',
    [theme.breakpoints.down('xs')]: {
      padding: '0 14px',
    },
    '@media (max-width: 400px)': {
      maxWidth: 300,
      gridTemplateColumns: '1fr',
      
    }
  },
  summaryData: {
    // textAlign: 'center'
  },
  summaryDataLabel: {
    display: 'flex',
    columnGap: 6,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '16px',
    marginBottom: 10
  },
  labelIcon: {
    fontSize: 14,
    fill: theme.palette.grey[600]
  },
  // author: {
  //   display: 'flex',
  //   alignItems: 'center',
  //   columnGap: 8,
  //   fontFamily: theme.typography.headline.fontFamily,
  //   fontSize: 16,
  //   lineHeight: '20px',
  // },
  summaryDataVal: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '4px',
    fontFamily: theme.typography.headline.fontFamily,
    color: theme.palette.grey[800],
    fontSize: 16,
    lineHeight: '20px',
    marginBottom: 6
  },
  count: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  link: {
    color: theme.palette.primary.main,
  },
  darkLink: {
    color: theme.palette.primary.dark,
  },
  textSection: {
    margin: '40px 12px 0'
  },
  postsListSection: {
    margin: '0 12px'
  },
  sectionHeadline: {
    fontSize: 25,
    lineHeight: '32px',
    marginBottom: 8
  },
  body: {
    color: theme.palette.grey[800],
    lineHeight: '22px'
  }
});

const EAForumWrappedPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const theme = useConcreteThemeOptions()
  console.log('theme', theme)
  const [showAnimation, setShowAnimation] = useState(true)
  
  // make sure the full 3 sec gif plays
  useEffect(() => {
    setTimeout(() => {
      setShowAnimation(false)
    }, 2200);
  }, []);
  
  const { data, loading } = useQuery(gql`
    query getWrappedData($year: Int!) {
      UserWrappedDataByYear(year: $year) {
        mostReadAuthors {
          displayName
          slug
          profileImageId
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
  console.log('data', data)
  
  const { SingleColumnSection, Typography, HoverPreviewLink, PostsByVoteWrapper, WrappedLoginForm } = Components
  
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
  
  if (loading || showAnimation) {
    const gifName = theme.name === 'dark' ? 'v1672178471/wrapped_gif_v3_dark_mode.gif' : 'v1672178471/wrapped_gif_v3_light_mode.gif'
    return <div className={classes.loading}>
      <img src={`https://res.cloudinary.com/cea/image/upload/c_crop,w_250,h_250/${gifName}`} className={classes.loadingGif} />
    </div>
  }
  
  const results = data?.UserWrappedDataByYear

  return (
    <div className={classes.root}>
      <SingleColumnSection>
        <div className={classes.summaryCard}>
          <RibbonIcon className={classes.ribbonIcon} />
          
          <Typography variant="headline" className={classes.summaryHeadline}>
            <div>{currentUser?.displayName}'s</div>
            <div>✨&nbsp;2022 EA&nbsp;Forum Wrapped&nbsp;✨</div>
          </Typography>
          
          <div className={classes.summarySection}>
            <div className={classes.summaryData}>
              <div className={classes.summaryDataLabel}>
                <PersonIcon className={classes.labelIcon} />
                Your favorite authors
              </div>
              <div>
                {results.mostReadAuthors.map(author => {
                  return <div key={author.slug} className={classes.summaryDataVal}>
                    <Link to={`/user/${author.slug}?from=2022_wrapped`} className={classes.link}>{author.displayName}</Link>
                    <span className={classes.count}>{author.count} post{author.count > 1 ? 's' : ''} read</span>
                  </div>
                })}
              </div>
            </div>
            <div className={classes.summaryData}>
              <div className={classes.summaryDataLabel}>
                <TopicIcon className={classes.labelIcon} />
                Your favorite topics
              </div>
              <div>
                {results.mostReadTopics.map(topic => {
                  return <div key={topic.slug} className={classes.summaryDataVal}>
                    <span className={classes.link}><HoverPreviewLink href={`/topics/${topic.slug}`} innerHTML={topic.name}/></span>
                    <span className={classes.count}>{topic.count} post{topic.count > 1 ? 's' : ''} read</span>
                  </div>
                })}
              </div>
            </div>
            {results.topPost && <>
              <div className={classes.summaryData}>
                <div className={classes.summaryDataLabel}>
                  <PostIcon className={classes.labelIcon} />
                  Your top post
                </div>
                <div className={classes.summaryDataVal}>
                  <span className={classes.link}>
                    <HoverPreviewLink
                      href={`/posts/${results.topPost._id}/${results.topPost.slug}`}
                      innerHTML={results.topPost.title}
                    />
                  </span>
                  <span className={classes.count}>
                    {results.postCount} post{results.postCount > 1 ? 's' : ''} total
                  </span>
                </div>
              </div>
            </>}
            {results.topComment && <>
              <div className={classes.summaryData}>
                <div className={classes.summaryDataLabel}>
                  <CommentIcon className={classes.labelIcon} />
                  Your top comment
                </div>
                <div className={classes.summaryDataVal}>
                  <span className={classes.link}>
                    <HoverPreviewLink
                      href={`/posts/${results.topComment.postId}?commentId=${results.topComment._id}`}
                      innerHTML={truncatise(results.topComment.contents.plaintextMainText, {
                        TruncateLength: 25,
                        TruncateBy: 'characters',
                        Suffix: '...',
                      })}
                    />
                  </span>
                  <span className={classes.count}>
                    {results.commentCount} comment{results.commentCount > 1 ? 's' : ''} total
                  </span>
                </div>
              </div>
            </>}
            {results.topShortform && <>
              <div className={classes.summaryData}>
                <div className={classes.summaryDataLabel}>
                  <ShortformIcon className={classes.labelIcon} />
                  Your top shortform
                </div>
                <div className={classes.summaryDataVal}>
                  <span className={classes.link}>
                    <HoverPreviewLink
                      href={`/posts/${results.topShortform.postId}?commentId=${results.topShortform._id}`}
                      innerHTML={truncatise(results.topShortform.contents.plaintextMainText, {
                        TruncateLength: 25,
                        TruncateBy: 'characters',
                        Suffix: '...',
                      })}
                    />
                  </span>
                  <span className={classes.count}>
                    {results.shortformCount} shortform{results.shortformCount > 1 ? 's' : ''} total
                  </span>
                </div>
              </div>
            </>}
            <div className={classes.summaryData}>
              <div className={classes.summaryDataLabel}>
                <KarmaIcon className={classes.labelIcon} />
                Your karma change
              </div>
              <div className={classes.summaryDataVal}>
                {results.karmaChange > 0 ? '+' : ''}{results.karmaChange}
              </div>
            </div>
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
                Chaotic Good
              </div>
            </div>
          </div>
        </div>
      </SingleColumnSection>
      
      <SingleColumnSection>
        <div className={classes.textSection}>
          <Typography variant="headline" className={classes.sectionHeadline}>Take a moment to reflect on 2022</Typography>
          <Typography variant="body2" className={classes.body}>
            Look back at everything you enjoyed reading - what did you find most valuable? Your answers will help us encourage more of the most valuable content.
          </Typography>
        </div>
      </SingleColumnSection>
      
      <SingleColumnSection>
        <div className={classes.postsListSection}>
          <Typography variant="headline" className={classes.sectionHeadline}>Your Strong Upvotes from 2022</Typography>
          <PostsByVoteWrapper voteType="bigUpvote" year={2022} />
        </div>
      </SingleColumnSection>
      
      <SingleColumnSection>
        <div className={classes.postsListSection}>
          <Typography variant="headline" className={classes.sectionHeadline}>Your Upvotes from 2022</Typography>
          <PostsByVoteWrapper voteType="smallUpvote" year={2022} />
        </div>
      </SingleColumnSection>
      
      <SingleColumnSection>
        <div className={classes.textSection}>
          <Typography variant="headline" className={classes.sectionHeadline}>Thanks!</Typography>
          <Typography variant="body2" className={classes.body}>
            Thanks for being part of the EA Forum and helping the community think about how to do the most good in the world.
          </Typography>
        </div>
      </SingleColumnSection>
    </div>
  )
}

const EAForumWrappedPageComponent = registerComponent('EAForumWrappedPage', EAForumWrappedPage, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrappedPage: typeof EAForumWrappedPageComponent
  }
}
