import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import StarIcon from '@material-ui/icons/Star';
import { commentBodyStyles } from '../../themes/stylePiping'
import * as _ from 'underscore';
import classNames from 'classnames';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const cellStyle = theme => ({
  maxWidth: 350,
})

const headerStyle = theme => ({
  fontSize: "1.1rem",
  fontWeight: 600,
  backgroundColor: theme.palette.grey[800],
  borderRight: `1px solid white`,
  color: "white",
  wordBreak: "normal",
  position: "sticky",
  top: 0,
  paddingTop: 0,
  paddingBottom: 0,
  zIndex: 1,
})

const styles = theme => ({
  root: {
    marginTop: -49, // adjusting for main layout header
    marginBottom: -150, // adjusting for footer
    width: "100%",
    height: "90vh",
    overflow: "scroll",
    position: "relative",
  },
  intro: {
    maxWidth: 560,
    ...commentBodyStyles(theme),
  },
  introCell: {
    backgroundColor: "rgba(0,0,0,.035)",
  },
  introWrapper: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    maxWidth: 880,
    margin: "auto"
  },
  submitButton: {
    marginLeft: 50,
    padding: 16,
    paddingLeft: 25,
    paddingRight: 25,
    backgroundColor: theme.palette.primary.dark,
    color: "white",
    fontWeight: 600,
    borderRadius: 5,
    textAlign: "center"
  },
  table: {
    width: "100%",
    height: "90vh",
    overflow: "scroll",
    position: "relative",
  },
  domain: {
    marginTop: 4,
    color: theme.palette.grey[500]
  },
  cellDescription: {
    ...cellStyle(theme),
    minWidth: 350
  },
  cell: {
    ...cellStyle(theme)
  },
  cellReviewerThoughts: {
    ...cellStyle(theme),
    maxWidth: 300,
    minWidth: 300,
    wordBreak: "break-word",
  },
  cellFoundVia: {
    ...cellStyle(theme),
    maxWidth: 110
  },
  cellLastUpdated: {
    ...cellStyle(theme),
    minWidth: 110,
  },
  cellDateAdded: {
    ...cellStyle(theme),
    textAlign: "center",
    minWidth: 110,
  },
  headerCell: {
    ...headerStyle(theme),
  },
  headerReviewerThoughts: {
    ...headerStyle(theme),
    maxWidth: 300
  },
  headerTitle: {
    ...headerStyle(theme),
    maxWidth: 110,
    textAlign: "center"
  },
  headerDate: {
    ...headerStyle(theme),
    minWidth: 110,
    textAlign: "center"
  },
  descriptionCell: {
    maxWidth: 400,
  },
  leftFixed0: {
    ...cellStyle(theme),
    position: "sticky",
    left: 0,
    paddingLeft: 6,
    paddingRight: 6,
    textAlign: "center"
  },
  leftFixedHeader0: {
    ...headerStyle(theme),
    position: "sticky",
    left: 0,
    zIndex: 2,
    paddingLeft: 6,
    paddingRight: 6
  },
  leftFixed1: {
    ...cellStyle(theme),
    backgroundColor: theme.palette.grey[100],
    position: "sticky",
    left: 0,
    minWidth: 240,
    boxShadow: "2px 0 2px -1px rgba(0,0,0,.15)",
    '& a': {
      color: theme.palette.primary.dark
    }
  },
  leftFixedHeader1: {
    ...headerStyle(theme),
    position: "sticky",
    left: 0,
    zIndex: 3,
    minWidth: 240
  },
  starIcon: {
    width: 16,
    position: "relative",
    top: 2
  },
  tabRow: {
    display: "flex",
    alignItems: "flex-start",
    paddingLeft: 8,
    flexWrap: "wrap-reverse",
  },
  tab: {
    ...theme.typography.commentStyles,
    fontSize: "1rem",
    marginTop: 4,
    marginLeft: 2,
    marginRight: 2,
    marginBottom: -2,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 7,
    paddingBottom: 11,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[300],
    cursor: "pointer",
    boxShadow: "0 0 3px rgba(0,0,0,.3)",
    whiteSpace: "pre",
  },
  tabLabel: {
    fontWeight: 600,
    marginRight: 8,
  },
  tabCount: {
    color: theme.palette.grey[700],
    fontSize: ".8rem",
    display: "inline-block",
  },
  tabDescription: {
    fontSize: "1rem"
  },
  tabSelected: {
    backgroundColor: theme.palette.grey[100],
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerSheet: {
    ...headerStyle(theme),
    maxWidth: 350,
    paddingLeft: 25,
    paddingRight: 25
  },
  cellSheet: {
    ...theme.typography.body1,
    width: 150,
    paddingLeft: 25,
    paddingRight: 25,
    fontWeight: 600,
    color: theme.palette.primary.main,
    cursor: "pointer",
    textAlign: "center"
  },
  cellSheetDescription: {
    width: 250
  },
  link: {
    color: theme.palette.primary.dark
  },
  topLinks: {
    padding: 0,
    borderLeft: "solid 1px rgba(0,0,0,.1)"
  },
  topLinkRow: {
    display: "flex",
    borderBottom: "solid 1px rgba(0,0,0,.1)",
    alignItems: "center",
    fontSize: "1rem",
    '&:last-child': {
      borderBottom: "none"
    }
  },
  topLink: {
    minWidth: 220,
    maxWidth: 220,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 10,

  },
  topLinkDomain: {
    minWidth: 150,
    maxWidth: 150,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 10,
    wordBreak: "break-all"
  },
  topLinkDescription: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 10
  },
  categoryRow: {
    borderBottom: `solid 5px ${theme.palette.grey[200]}`
  }
})

const SpreadsheetPage = ({classes}:{
  classes: any
}) => {

  const [selectedTab, setSelectedTab] = useState("Intro")
  const { LWTooltip, HoverPreviewLink, Loading } = Components
  const { data, loading } = useQuery(gql`
    query CoronaVirusData {
      CoronaVirusData {
        range
        majorDimension
        values {
          accepted
          imp
          link
          shortDescription
          url
          description
          domain
          type
          reviewerThoughts
          foundVia
          sourcelink
          sourceLinkDomain
          lastUpdated
          title
          dateAdded
          category
        } 
      }
    }
  `, {
    ssr: true
  });

  if (loading) return <Loading />

  const dataRows = data.CoronaVirusData.values
  const sortedRowsAdded = _.sortBy(dataRows, row => -row.dateAdded)
  const sortedRowsImp = _.sortBy(sortedRowsAdded, row => -row.imp)

  const linkCell = (url, link, domain) => <div>
      <div className={classes.link}><HoverPreviewLink href={url} innerHTML={link}/></div>
      {domain && <div className={classes.domain}>{domain}</div>}
    </div>

  const tabs = [
    {
      label: "All Links",
      description: "All links that we've added, sorted by the most recent.",
      rows: sortedRowsAdded
    },
    {
      label: "Guides/FAQs/Intros",
      displayLabel: "Guides/FAQs/Intros",
      description: "Websites that attempt to gently introduce coronavirus or explain things about it. Typically non-exhaustive.",
      rows: _.filter(sortedRowsImp, row => row.category === "Guides/FAQs/Intros")
    },
    {
      label: "Dashboards",
      description: "Websites showing up-to-date SC2-relevant numbers in easy-to-read format.",
      rows: _.filter(sortedRowsImp, row => row.category === "Dashboards")
    },
    {
      label: "Progression/Outcome",
      displayLabel: "Progression & Outcome",
      description: "Information on what happens once you have COVID-19.",
      rows: _.filter(sortedRowsImp, row => row.category === "Progression/Outcome")
    },
    {
      label: "Spread & Prevention",
      description: "Information about current or predicted prevalence, how COVID-19 is spread, or lower the former/preventing the latter. We may need a prevalence model olympics",
      rows: _.filter(sortedRowsImp, row => row.category === "Spread & Prevention")
    },
    {
      label: "Science",
      description: "Basic science that does not immediatley prompt action. E.g. 'here's what SC2 targets' is in, 'Here's a drug targeting that' is out.",
      rows: _.filter(sortedRowsImp, row => row.category === "Science")
    },
    {
      label: "Medical System",
      description: "Information or models on the current state of the medical system, including 'here's how bad hospitals are' and potential treatments.",
      rows: _.filter(sortedRowsImp, row => row.category === "Medical System")
    },
    {
      label: "Everyday Life",
      description: "Announcements of shutdowns, government or not.",
      rows: _.filter(sortedRowsImp, row => row.category === "Everyday Life")
    },
    {
      label: "Aggregators",
      description: "Websites aggregating other content",
      rows: _.filter(sortedRowsImp, row => row.category === "Aggregators")
    }
  ]

  const rows = _.find(tabs, tab => tab.label === selectedTab)?.rows || []
  return (
    <div className={classes.root}>
      <div className={classes.tabRow}>
        <LWTooltip key={"Intro"} placement="top" title={<div>
            {"What is this table about?"}
          </div>}>
            <div 
              className={classNames(classes.tab, {[classes.tabSelected]:selectedTab === "Intro"})}
              onClick={()=>setSelectedTab("Intro")}
            >
              <span className={classes.tabLabel}>
                Intro
              </span>
          </div>
        </LWTooltip>
        {tabs.map(tab => <LWTooltip key={tab.label} placement="top" title={<div>
            {tab.description} ({tab.rows.length - 1})
          </div>}>
              <div 
                className={classNames(classes.tab, {[classes.tabSelected]:tab.label === selectedTab})}
                onClick={()=>setSelectedTab(tab.label)}
              >
                <span className={classes.tabLabel}>
                  {tab.displayLabel || tab.label}
                </span>
                <span className={classes.tabCount}>
                  {tab.rows.length - 1}
                </span>
            </div>
          </LWTooltip>)}
      </div>
      <div className={classes.table}>
        <Table>
          {selectedTab !== "Intro" ? <TableBody>
            <TableRow key={`row-0`}>
              <TableCell classes={{root: classes.leftFixedHeader0}}>
                <LWTooltip title="Importance">
                  <StarIcon className={classes.starIcon}/>
                </LWTooltip>
              </TableCell>
              <TableCell classes={{root: classes.leftFixedHeader1}}>
                Link
              </TableCell>
              {["Summary", "Type"].map(header => <TableCell key={header} classes={{root: classes.headerCell}}>
                <span>{header}</span>
              </TableCell>)}
              <TableCell classes={{root: classes.headerReviewerThoughts}}>
                Reviewer Thoughts
              </TableCell>
              <TableCell classes={{root: classes.headerCell}}>
                Found Via
              </TableCell>
              <TableCell classes={{root: classes.headerDate}}>
                Last Updated
              </TableCell>
              <TableCell classes={{root: classes.headerTitle}}>
                Title
              </TableCell>
              <TableCell classes={{root: classes.headerDate}}>
                Date Added
              </TableCell>
              <TableCell classes={{root: classes.headerCell}}>
                Category
              </TableCell>
            </TableRow>
            {rows.map(({
              imp,
              link,
              url,
              description,
              domain,
              type,
              reviewerThoughts,
              foundVia,
              sourceLink,
              lastUpdated,
              title,
              dateAdded,
              category,
            }, rowNum) => (
              <TableRow key={`row-${rowNum}`}>
                <TableCell classes={{root: classes.leftFixed0}}>{imp}</TableCell>
                <TableCell className={classes.leftFixed1}>
                  {linkCell(url, link, domain)}
                </TableCell>
                <TableCell classes={{root: classes.cellDescription}}>
                  {description}
                </TableCell>
                <TableCell classes={{root: classes.cell}}>
                  {type}
                </TableCell>
                <TableCell classes={{root: classes.cellReviewerThoughts}}>
                  {reviewerThoughts}
                </TableCell>
                <TableCell classes={{root: classes.cellFoundVia}}>
                  <HoverPreviewLink href={sourceLink} innerHTML={foundVia}/>
                </TableCell>
                <TableCell classes={{root: classes.cellLastUpdated}}>
                  {lastUpdated}
                </TableCell>
                <TableCell classes={{root: classes.cell}}>
                  {title}
                </TableCell>
                <TableCell classes={{root: classes.cellDateAdded}}>
                  {dateAdded}
                </TableCell>
                <TableCell classes={{root: classes.cell}}>
                  {category}
                </TableCell>
              </TableRow>
            ))}
          </TableBody> 
          :
          <TableBody>
            <TableRow>
              <TableCell className={classes.headerSheet}>
                Sheet
              </TableCell>
              <TableCell className={classes.headerCell}>
                Description
              </TableCell>
              <TableCell className={classes.headerCell}>
                Top Links
              </TableCell>
            </TableRow>
            <TableRow className={classes.categoryRow}>
              <TableCell colSpan={3} className={classes.introCell}>
                <div className={classes.introWrapper}>
                  <div className={classes.intro}>
                    <p>
                      Welcome to the Coronavirus Info-Database, an attempt to organize the disparate papers, articles and links that are spread all over the internet regarding the nCov pandemic. You can submit new links, which the maintainers of this sheet will sort and prioritize the links.
                    </p>
                    <p>
                      You can find (and participate) in more LessWrong discussion of COVID-19 on <HoverPreviewLink href={"/tag/coronavirus"} innerHTML="our tag page"/>.
                    </p>
                  </div>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSc5uVDXrowWmhlaDbT3kukODdJotWOZXZivdlFmaHQ6n2gsKw/viewform" className={classes.submitButton}>
                    Submit New Link
                  </a>
                </div>
              </TableCell>
            </TableRow>
            {tabs.map(tab => {
              if (tab.label == "All Links") return null
              return <TableRow key={`intro-${tab.label}`} className={classes.categoryRow}>
                  <TableCell className={classes.cellSheet} onClick={() => setSelectedTab(tab.label)}>
                    <a>{tab.displayLabel || tab.label}</a>
                  </TableCell>
                  <TableCell className={classes.cellSheetDescription}>
                    {tab.description}
                  </TableCell>
                  <TableCell className={classes.topLinks}>
                    {[0,1,2].map(rowNum => <div className={classes.topLinkRow} key={`topLink-${tab.label}-${rowNum}`}>
                        <div className={classes.topLink}>
                          {linkCell(tab.rows[rowNum].url, tab.rows[rowNum].link, null)}
                        </div>
                        <div className={classes.topLinkDomain}>
                          {tab.rows[rowNum].domain}
                        </div>
                        <div className={classes.topLinkDescription}>
                          {tab.rows[rowNum].description}
                        </div>
                    </div>)}
                  </TableCell>
                </TableRow>
            })}
          </TableBody>
          }
        </Table>
      </div>
    </div>
  )
}

const SpreadsheetPageComponent = registerComponent('SpreadsheetPage', SpreadsheetPage, {styles})

declare global {
  interface ComponentTypes {
    PostsSingle:typeof SpreadsheetPageComponent
  }
}