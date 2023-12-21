import React, { Fragment } from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { WrappedTopPost, useForumWrappedV2 } from "./hooks";
import { userIsAdminOrMod } from "../../../lib/vulcan-users";
import classNames from "classnames";
import range from "lodash/range";
import moment from "moment";
import { BarChart, Bar, ResponsiveContainer, YAxis, XAxis, AreaChart, Area, Tooltip } from "recharts";
import { requireCssVar } from "../../../themes/cssVars";
import { drawnArrow } from "../../icons/drawnArrow";
import { Link } from "../../../lib/reactRouterWrapper";
import { userGetProfileUrlFromSlug } from "../../../lib/collections/users/helpers";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { SoftUpArrowIcon } from "../../icons/softUpArrowIcon";


const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  section: {
    padding: '80px 20px'
  },
  imgWrapper: {
    display: 'inline-block',
    margin: '100px auto 0'
  },
  img: {
    maxWidth: 600,
    maxHeight: '50vh',
  },
  stats: {
    maxWidth: 400,
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    margin: '0 auto',
  },
  stat: {
    flex: 'none',
    width: 100
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 'normal',
    fontWeight: 500,
    // textDecorationLine: 'underline',
    marginTop: 8
  },
  calendar: {
    maxWidth: 600,
    display: 'inline-grid',
    gridTemplateColumns: "repeat(31, 6px)",
    gridTemplateRows: "repeat(12, 6px)",
    gap: '4px',
    margin: '40px auto 0',
  },
  calendarDot: {
    height: 6,
    width: 6,
    backgroundColor: theme.palette.wrapped.darkDot,
    borderRadius: '50%'
  },
  calendarDotActive: {
    backgroundColor: theme.palette.text.alwaysWhite,
  },
  topicsChart: {
    position: 'relative',
    maxWidth: 400,
    margin: '40px auto 0',
  },
  relativeTopicsChartMarkYou: {
    position: 'absolute',
    left: 130,
    top: -29,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    color: theme.palette.wrapped.highlightText
  },
  relativeTopicsChartMarkAvg: {
    position: 'absolute',
    left: 147,
    top: 35,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    color: theme.palette.text.alwaysWhite,
  },
  relativeTopicsChartArrowAvg: {
    width: 22,
    transform: 'rotate(98deg)',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 500,
    margin: '0 auto 14px'
  },
  karmaFromPostsLabel: {
    color: theme.palette.wrapped.highlightText
  },
  karmaFromCommentsLabel: {
    color: theme.palette.wrapped.secondaryText
  },
  authors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: 300,
    textAlign: 'left',
    margin: '30px auto 0',
  },
  author: {
    display: 'flex',
    gap: '16px',
    background: theme.palette.wrapped.panelBackground,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 400,
    borderRadius: theme.borderRadius.default,
    padding: '8px 16px'
  },
  authorName: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 700,
    margin: 0
  },
  authorReadCount: {
    margin: 0
  },
  topPost: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 340,
    margin: '24px auto 0',
  },
  nextTopPosts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: 340,
    margin: '10px auto 0',
  },
  postLinkWrapper: {
    '&:hover': {
      opacity: 0.9
    }
  },
  post: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: 340,
    height: 56,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 600,
    textAlign: 'left',
    borderRadius: theme.borderRadius.default,
    padding: '8px'
  },
  postScore: {
    flex: 'none',
    width: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: theme.palette.wrapped.postScore,
  },
  postVoteArrow: {
    color: theme.palette.wrapped.postScoreArrow,
    margin: "-6px 0 2px 0",
  },
  postTitle: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  comment: {
    width: '100%',
    maxWidth: 340,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontSize: 14,
    lineHeight: 'normal',
    textAlign: 'left',
    borderRadius: theme.borderRadius.default,
    padding: '8px'
  },
  otherReacts: {
    width: '100%',
    maxWidth: 400,
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: '16px',
    margin: '30px auto 0',
  },
  heading1: {
    fontSize: 50,
    lineHeight: '55px',
    fontWeight: 700,
    margin: 0
  },
  heading2: {
    fontSize: 28,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.56px',
    textDecorationLine: 'none',
    margin: 0
  },
  heading3: {
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    margin: 0
  },
  text: {
    maxWidth: 600,
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 500,
    margin: '0 auto'
  },
  highlight: {
    color: theme.palette.wrapped.highlightText,
  },
  link: {
    
  },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt26: { marginTop: 26 },
  mt30: { marginTop: 30 },
  mt40: { marginTop: 40 },
  mt60: { marginTop: 60 },
  mt70: { marginTop: 70 },
})

const wrappedHighlightColor = requireCssVar("palette", "wrapped", "highlightText")
const wrappedSecondaryColor = requireCssVar("palette", "wrapped", "secondaryText")

/**
 * Displays the calendar of days the user visited the forum.
 * Visualized as 12 rows of dots, with the visited days' dots being white.
 */
const VisitCalendar = ({daysVisited, classes}: {
  daysVisited: string[],
  classes: ClassesType
}) => {
  return <div className={classes.calendar}>
    {range(0, 12).map((month: number) => {
      const daysInMonth = moment(`2023-${month+1}`, 'YYYY-M').daysInMonth()
      return <Fragment key={`month-${month}`}>
        {range(0, daysInMonth).map(day => {
          const date = moment(`2023-${month+1}-${day+1}`, 'YYYY-M-D')
          return <div
            key={`month-${month}-day-${day}`}
            className={classNames(classes.calendarDot, {
              [classes.calendarDotActive]: daysVisited.some(d => moment(d).isSame(date))
            })}
          ></div>
        })}
        {range(daysInMonth, 31).map(day => {
          return <div key={`month-${month}-day-${day}`}></div>
        })}
      </Fragment>
    })}
  </div>
}

const Post = ({post, classes}: {
  post: WrappedTopPost,
  classes: ClassesType
}) => {
  return <Link to={postGetPageUrl(post)} className={classes.postLinkWrapper}>
    <article className={classes.post}>
      <div className={classes.postScore}>
        <div className={classes.postVoteArrow}>
          <SoftUpArrowIcon />
        </div>
        {post.baseScore}
      </div>
      <div className={classes.postTitle}>
        {post.title}
      </div>
    </article>
  </Link>
}

const KarmaChangeXAxis = () => {
  return <>
    <text y="100%" fontSize={12} fill="#FFF" textAnchor="start">Jan</text>
    <text x="100%" y="100%" fontSize={12} fill="#FFF" textAnchor="end">Dec</text>
  </>
}

const EAForumWrapped2023Page = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()

  const { data } = useForumWrappedV2({
    userId: currentUser?._id,
    year: 2023
  })

  const { SingleColumnSection, CloudinaryImage2, UsersProfileImage } = Components

  if (!data) return null;

  // TODO un-admin gate
  if (!userIsAdminOrMod(currentUser)) {
    return <div className={classes.root}>
      You do not have permission to view this page.
    </div>
  }
  
  const engagementHours = (data.totalSeconds / 3600)
  const mostReadTopics = data.mostReadTopics.map((topic, i) => {
    return {
      ...topic,
      fill: i === 0 ? wrappedHighlightColor : '#FFF'
    }
  })
  const relativeMostReadTopics = data.relativeMostReadCoreTopics.map(topic => {
    return {
      ...topic,
      tagName: topic.tagShortName ?? topic.tagName,
      overallReadCount: topic.userReadCount / topic.readLikelihoodRatio
    }
  }).slice(0, 4)
  const topAuthorByEngagementPercentile = [...data.mostReadAuthors].sort((a, b) => b.engagementPercentile - a.engagementPercentile)[0]
  const topAuthorPercentByEngagementPercentile = Math.ceil(1 - topAuthorByEngagementPercentile.engagementPercentile)
  const totalReactsReceived = data.mostReceivedReacts.reduce((prev, next) => prev + next.count, 0)

  return (
    <AnalyticsContext pageContext="eaYearWrapped">
      <main className={classes.root}>
        
        <section className={classes.section}>
          <h1 className={classes.heading1}>Your 2023 Wrapped</h1>
          <CloudinaryImage2 publicId="b90e48ae75ae9f3d73bbcf17f2ddf6a0" wrapperClassName={classes.imgWrapper} className={classes.img} />
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            You’re a top <span className={classes.highlight}>{Math.ceil((1 - data.engagementPercentile) * 100)}%</span> reader of the EA Forum
          </h1>
          <p className={classNames(classes.text, classes.mt16)}>You read {data.postsReadCount} posts this year</p>
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            You spent <span className={classes.highlight}>{engagementHours.toFixed(1)}</span> hours on the EA Forum in 2023
          </h1>
          <p className={classNames(classes.text, classes.mt70)}>Which is about the same as...</p>
          <div className={classNames(classes.stats, classes.mt30)}>
            <article className={classes.stat}>
              <div className={classes.heading2}>{(engagementHours / 3.5).toFixed(1)}</div>
              <div className={classes.statLabel}>episodes of the 80,000 hours podcast</div>
            </article>
            <article className={classes.stat}>
              <div className={classes.heading2}>{(engagementHours / 25).toFixed(1)}</div>
              <div className={classes.statLabel}>EAG(x) conferences</div>
            </article>
            <article className={classes.stat}>
              <div className={classes.heading2}>?</div>
              <div className={classes.statLabel}>large language models trained</div>
            </article>
          </div>
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            You visited the EA Forum on <span className={classes.highlight}>{data.daysVisited.length}</span> days in 2023
          </h1>
          <p className={classNames(classes.text, classes.mt16)}>(You may have visited more times while logged out)</p>
          <VisitCalendar daysVisited={data.daysVisited} classes={classes} />
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            You spent the most time on <span className={classes.highlight}>{mostReadTopics[0].name}</span>
          </h1>
          <div className={classes.topicsChart}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" width={350} height={200} data={mostReadTopics} barCategoryGap={'20%'} {...{overflow: 'visible'}}>
                <YAxis
                  dataKey="shortName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{fill: '#FFF'}}
                  tickMargin={10}
                />
                <XAxis dataKey="count" type="number" hide />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            You spent more time on <span className={classes.highlight}>{relativeMostReadTopics[0].tagName}</span> than other users
          </h1>
          <div className={classes.topicsChart}>
            <aside className={classes.relativeTopicsChartMarkYou}>
              you
              {drawnArrow}
            </aside>
            <aside className={classes.relativeTopicsChartMarkAvg}>
              <div className={classes.relativeTopicsChartArrowAvg}>
                {drawnArrow}
              </div>
              average
            </aside>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" width={350} height={200} data={relativeMostReadTopics} barCategoryGap={'20%'} barGap={0} {...{overflow: 'visible'}}>
                <YAxis
                  dataKey="tagName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{fill: '#FFF'}}
                  tickMargin={10}
                />
                <XAxis dataKey="userReadCount" type="number" hide />
                <Bar dataKey="userReadCount" fill={wrappedHighlightColor} />
                <Bar dataKey="overallReadCount" fill="#FFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        <section className={classes.section}>
          <h1 className={classes.heading2}>
            Your most-read author was <span className={classes.highlight}>{data.mostReadAuthors[0].displayName}</span>
          </h1>
          <div className={classes.authors}>
            {data.mostReadAuthors.map(author => {
              return <article key={author.slug} className={classes.author}>
                <UsersProfileImage size={40} user={author} />
                <div>
                  <h2 className={classes.authorName}>
                    <Link to={userGetProfileUrlFromSlug(author.slug)} className={classes.link}>
                      {author.displayName}
                    </Link>
                  </h2>
                  <p className={classes.authorReadCount}>
                    {author.count} post{author.count === 1 ? '' : 's'} read
                  </p>
                </div>
              </article>
            })}
          </div>
        </section>
        
        {topAuthorPercentByEngagementPercentile <= 10 && <section className={classes.section}>
          <h1 className={classes.heading2}>
            You’re in the top <span className={classes.highlight}>{topAuthorPercentByEngagementPercentile}%</span> of {topAuthorByEngagementPercentile.displayName}’s readers
          </h1>
          <p className={classNames(classes.text, classes.mt20)}>Want to say thanks?</p>
          <div className={classes.messageAuthor}>
            TODO DM author
          </div>
        </section>}
        
        {!!data.topPosts?.length && <section className={classes.section}>
          <h1 className={classes.heading2}>
            Your highest-karma <span className={classes.highlight}>post</span> in 2023:
          </h1>
          <div className={classes.topPost}>
            <Post post={data.topPosts[0]} classes={classes} />
          </div>
          {data.topPosts.length > 1 && <>
            <p className={classNames(classes.text, classes.mt60)}>
              Other posts you wrote this year...
            </p>
            <div className={classes.nextTopPosts}>
              {data.topPosts.slice(1).map(post => {
                return <Post key={post._id} post={post} classes={classes} />
              })}
            </div>
          </>}
          <p className={classNames(classes.text, classes.mt40)}>
            You wrote {data.postCount} post{data.postCount === 1 ? '' : 's'} in total this year.
            This means you're in the top {Math.ceil((1-data.authorPercentile) * 100)}% of post authors.
          </p>
        </section>}
        
        {!!data.topComment && <section className={classes.section}>
          <h1 className={classes.heading2}>
            Your highest-karma <span className={classes.highlight}>comment</span> in 2023:
          </h1>
          <div className={classes.topPost}>
            <article className={classes.comment}>
              {data.topComment.contents.plaintextMainText}
            </article>
          </div>
          <p className={classNames(classes.text, classes.mt30)}>
            You wrote {data.commentCount} comment{data.commentCount === 1 ? '' : 's'} in total this year.
            This means you're in the top {Math.ceil((1-data.commenterPercentile) * 100)}% of commenters.
          </p>
        </section>}
        
        {/* TODO use topShortform */}
        {!!data.topComment && <section className={classes.section}>
          <h1 className={classes.heading2}>
            Your highest-karma <span className={classes.highlight}>quick take</span> in 2023:
          </h1>
          <div className={classes.topPost}>
            <article className={classes.comment}>
              {data.topComment.contents.plaintextMainText}
            </article>
          </div>
          <p className={classNames(classes.text, classes.mt30)}>
            You wrote {data.shortformCount} comment{data.shortformCount === 1 ? '' : 's'} in total this year.
            This means you're in the top {Math.ceil((1-data.shortformPercentile) * 100)}% of quick take authors.
          </p>
        </section>}
        
        {data.karmaChange !== undefined && <section className={classes.section}>
          <h1 className={classes.heading2}>
            Your overall karma change this year was <span className={classes.highlight}>{data.karmaChange >= 0 ? '+' : ''}{data.karmaChange}</span>
          </h1>
          <div className={classes.topicsChart}>
            <div className={classes.chartLabels}>
              <div className={classes.karmaFromPostsLabel}>Karma from posts</div>
              <div className={classes.karmaFromCommentsLabel}>Karma from comments</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart width={350} height={200} data={data.combinedKarmaVals}>
                <YAxis tick={false} axisLine={{strokeWidth: 2, stroke: '#FFF'}} width={2} />
                <XAxis dataKey="date" tick={false} axisLine={{strokeWidth: 3, stroke: '#FFF'}} height={16} label={<KarmaChangeXAxis />} />
                <Area dataKey="commentKarma" stackId="1" stroke={wrappedSecondaryColor} fill={wrappedSecondaryColor} fillOpacity={1} />
                <Area dataKey="postKarma" stackId="1" stroke={wrappedHighlightColor} fill={wrappedHighlightColor} fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>}
        
        {totalReactsReceived > 5 && <section className={classes.section}>
          <h1 className={classes.heading2}>
            Others gave you{" "}
            <span className={classes.highlight}>
              {data.mostReceivedReacts[0].count} {data.mostReceivedReacts[0].name}
            </span>{" "}
            reacts{data.mostReceivedReacts.length > 1 ? '...' : ''}
          </h1>
          {data.mostReceivedReacts.length > 1 && <div className={classes.otherReacts}>
            <p className={classes.heading3}>... and {totalReactsReceived} reacts in total:</p>
            <div className={classNames(classes.stats, classes.mt26)}>
              {data.mostReceivedReacts.slice(1).map(react => {
                return <article key={react.name} className={classes.stat}>
                  <div className={classes.heading2}>{react.count}</div>
                  <div className={classes.statLabel}>{react.name}</div>
                </article>
              })}
            </div>
          </div>}
        </section>}
        
        
        <SingleColumnSection>
          {/* <pre>Engagement Percentile: {data.engagementPercentile}</pre>
          <pre>Posts Read Count: {data.postsReadCount}</pre>
          <pre>Total Hours: {(data.totalSeconds / 3600).toFixed(1)}</pre>
          <pre>Days Visited: {JSON.stringify(data.daysVisited, null, 2)}</pre> */}
          {/* <pre>Most Read Topics: {JSON.stringify(data.mostReadTopics, null, 2)}</pre> */}
          {/* <pre>Relative Most Read Core Topics: {JSON.stringify(data.relativeMostReadCoreTopics, null, 2)}</pre> */}
          {/* <pre>Most Read Authors: {JSON.stringify(data.mostReadAuthors, null, 2)}</pre> */}
          {/* <pre>Top Posts: {JSON.stringify(data.topPosts, null, 2)}</pre>
          <pre>Post Count: {data.postCount}</pre>
          <pre>Author Percentile: {data.authorPercentile}</pre> */}
          {/* <pre>Top Comment: {JSON.stringify(data.topComment, null, 2)}</pre>
          <pre>Comment Count: {data.commentCount}</pre>
          <pre>Commenter Percentile: {data.commenterPercentile}</pre>
          <pre>Top Shortform: {JSON.stringify(data.topShortform, null, 2)}</pre>
          <pre>Shortform Count: {data.shortformCount}</pre>
          <pre>Shortform Percentile: {data.shortformPercentile}</pre> */}
          {/* <pre>Karma Change: {data.karmaChange}</pre> */}
          {/* <pre>Combined karma vals: {JSON.stringify(data.combinedKarmaVals, null, 2)}</pre> */}
          <pre>Most Received Reacts: {JSON.stringify(data.mostReceivedReacts, null, 2)}</pre>
          {/* <pre>Alignment: {data.alignment}</pre> */}
        </SingleColumnSection>
      </main>
      
      
    </AnalyticsContext>
  )
}

const EAForumWrapped2023PageComponent = registerComponent('EAForumWrapped2023Page', EAForumWrapped2023Page, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrapped2023Page: typeof EAForumWrapped2023PageComponent
  }
}
