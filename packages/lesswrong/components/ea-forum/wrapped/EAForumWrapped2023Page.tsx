import React, { Fragment } from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useForumWrappedV2 } from "./hooks";
import { userIsAdminOrMod } from "../../../lib/vulcan-users";
import classNames from "classnames";
import { range } from "lodash";
import moment from "moment";
import { BarChart, Bar, ResponsiveContainer, YAxis, XAxis } from "recharts";



const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.background.wrapped2023,
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
    maxWidth: 600,
    display: 'grid',
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: '16px',
    margin: '0 auto',
  },
  stat: {
    fontSize: 13,
    lineHeight: 'normal',
    fontWeight: 500,
    textDecorationLine: 'underline',
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
    backgroundColor: theme.palette.text.dim40,
    borderRadius: '50%'
  },
  calendarDotActive: {
    backgroundColor: theme.palette.text.alwaysWhite,
  },
  topicsChart: {
    maxWidth: 400,
    margin: '40px auto 0',
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
  text: {
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 500,
    margin: 0
  },
  highlight: {
    color: theme.palette.text.wrappedHighlight
  },
  mt16: { marginTop: 16 },
  mt30: { marginTop: 30 },
  mt70: { marginTop: 70 },
})

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

// const TopicsChartLabel = (props) => {
//   console.log(props)
//   return <div>Topic</div>
// }

const EAForumWrapped2023Page = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()

  const { data } = useForumWrappedV2({
    userId: currentUser?._id,
    year: 2023
  })

  const { SingleColumnSection, CloudinaryImage2 } = Components

  if (!data) return null;

  // TODO un-admin gate
  if (!userIsAdminOrMod(currentUser)) {
    return <div className={classes.root}>
      You do not have permission to view this page.
    </div>
  }
  
  const engagementHours = (data.totalSeconds / 3600)

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
            <div className={classNames(classes.stat, classes.heading2)}>{(engagementHours / 3.5).toFixed(1)}</div>
            <div className={classNames(classes.stat, classes.heading2)}>{(engagementHours / 25).toFixed(1)}</div>
            <div className={classNames(classes.stat, classes.heading2)}>?</div>
            <div className={classes.stat}>episodes of the 80,000 hours podcast</div>
            <div className={classes.stat}>EAG(x) conferences</div>
            <div className={classes.stat}>large language models trained</div>
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
            You spent the most time on <span className={classes.highlight}>{data.mostReadTopics[0].name}</span>
          </h1>
          <div className={classes.topicsChart}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" width={350} height={200} data={data.mostReadTopics} {...{overflow: 'visible'}}>
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
                <Bar dataKey="count" fill="#FFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        
        <SingleColumnSection>
          {/* <pre>Engagement Percentile: {data.engagementPercentile}</pre>
          <pre>Posts Read Count: {data.postsReadCount}</pre>
          <pre>Total Hours: {(data.totalSeconds / 3600).toFixed(1)}</pre>
          <pre>Days Visited: {JSON.stringify(data.daysVisited, null, 2)}</pre> */}
          <pre>Most Read Topics: {JSON.stringify(data.mostReadTopics, null, 2)}</pre>
          <pre>Relative Most Read Core Topics: {JSON.stringify(data.relativeMostReadCoreTopics, null, 2)}</pre>
          <pre>Most Read Authors: {JSON.stringify(data.mostReadAuthors, null, 2)}</pre>
          <pre>Top Post: {JSON.stringify(data.topPost, null, 2)}</pre>
          <pre>Post Count: {data.postCount}</pre>
          <pre>Author Percentile: {data.authorPercentile}</pre>
          <pre>Top Comment: {JSON.stringify(data.topComment, null, 2)}</pre>
          <pre>Comment Count: {data.commentCount}</pre>
          <pre>Commenter Percentile: {data.commenterPercentile}</pre>
          <pre>Top Shortform: {JSON.stringify(data.topShortform, null, 2)}</pre>
          <pre>Shortform Count: {data.shortformCount}</pre>
          <pre>Shortform Percentile: {data.shortformPercentile}</pre>
          <pre>Karma Change: {data.karmaChange}</pre>
          <pre>Post Karma Changes: {JSON.stringify(data.postKarmaChanges, null, 2)}</pre>
          <pre>Comment Karma Changes: {JSON.stringify(data.commentKarmaChanges, null, 2)}</pre>
          <pre>Most Received Reacts: {JSON.stringify(data.mostReceivedReacts, null, 2)}</pre>
          <pre>Alignment: {data.alignment}</pre>
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
