import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import StarIcon from '@material-ui/icons/Star';
import Button from '@material-ui/core/Button';
import { commentBodyStyles } from '../../themes/stylePiping'
import * as _ from 'underscore';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const cellStyle = theme => ({
  ...commentBodyStyles(theme),
  maxWidth: 350,
  fontSize: "1rem",
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,
  marginTop: 0,
  marginBottom: 0,
  wordBreak: "normal",
})

const headerStyle = theme => ({
  ...commentBodyStyles(theme),
  fontSize: "1.1rem",
  fontWeight: 600,
  backgroundColor: theme.palette.grey[800],
  borderRight: `1px solid white`,
  color: "white",
  wordBreak: "normal",
  position: "sticky",
  top: 0,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 0,
  paddingBottom: 0,
})

const styles = theme => ({
  root: {
    marginTop: -49,
    width: "100%",
    height: "90vh",
    overflow: "scroll",
    position: "relative",
  },
  introductionSection: {
    paddingTop: 60,
    paddingBottom: 75,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around"
  },
  introduction: {
    maxWidth: 620,
    ...commentBodyStyles(theme),
  },
  submitButton: {
    margin: "auto"
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
  cell4: {
    ...cellStyle(theme),
    minWidth: 350
  },
  cell5: {
    ...cellStyle(theme)
  },
  cell6: {
    ...cellStyle(theme)
  },
  cell7: {
    ...cellStyle(theme),
    maxWidth: 300,
    minWidth: 300,
    wordBreak: "break-word",
  },
  cell8: {
    ...cellStyle(theme),
    maxWidth: 110
  },
  cell9: {
    ...cellStyle(theme)
  },
  cell10: {
    ...cellStyle(theme)
  },
  cell11: {
    ...cellStyle(theme),
    minWidth: 110,
  },
  cell12: {
    ...cellStyle(theme)
  },
  cell13: {
    ...cellStyle(theme),
    textAlign: "center",
    minWidth: 110,
  },
  cell14: {
    ...cellStyle(theme)
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
    zIndex: 1,
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
    zIndex: 1,
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
    ...commentBodyStyles(theme),
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
    whiteSpace: "pre"
  },
  tabLabel: {
    fontWeight: 600,
    marginRight: 8,
  },
  tabCount: {
    color: theme.palette.grey[600],
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
  }
})

const SpreadsheetPage = ({classes}:{
  classes: any
}) => {

  const [selectedTab, setSelectedTab] = useState("All Links")
  const { LWTooltip, HoverPreviewLink, Loading } = Components
  const { data, loading } = useQuery(gql`
    query CoronaVirusData {
      CoronaVirusData {
        range
        majorDimension
        values {
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
  console.log(data)

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
      <div className={classes.introductionSection}>
        <div className={classes.introduction}>
          <h1>Coronavirus Database</h1>
          <p>
            Welcome to the Coronavirus Info-Database. This is an attempt to organize and curate all the disparate papers, articles and links that are spread all over the internet regarding the Coronavirus pandemic. If you want to add links, submit the form linked below, which will be added to the Link Dump Form sheet, and the maintainers of this sheet will sort and prioritize the links.
          </p>
          <p>This spreadsheet updates once a day.</p>
          <p>
            You can find (and participate) in more LessWrong discussion of COVID-19 on <HoverPreviewLink href={"/tag/coronavirus"} innerHTML="our tag page"/>.
          </p>
          <div>
            <Link to="https://docs.google.com/forms/d/e/1FAIpQLSc5uVDXrowWmhlaDbT3kukODdJotWOZXZivdlFmaHQ6n2gsKw/viewform" className={classes.submitButton}>
              <Button color="primary" variant="contained">
                Submit New Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className={classes.tabRow}>
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
          <Link to="https://docs.google.com/forms/d/e/1FAIpQLSc5uVDXrowWmhlaDbT3kukODdJotWOZXZivdlFmaHQ6n2gsKw/viewform" className={classes.submitButton}>
            <Button color="primary" variant="contained">
              Submit New Link
            </Button>
          </Link>
      </div>
      <div className={classes.table}>
        <Table>
          <TableBody>
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
              shortDescription,
              url,
              description,
              domain,
              type,
              reviewerThoughts,
              foundVia,
              sourceLink,
              sourceLinkDomain,
              lastUpdated,
              title,
              dateAdded,
              category,
            }, rowNum) => (
              <TableRow key={`row-${rowNum}`}>
                <TableCell classes={{root: classes.leftFixed0}}>{imp}</TableCell>
                <TableCell className={classes.leftFixed1}>
                  <div>
                    <div><HoverPreviewLink href={url} innerHTML={link}/></div>
                    <div className={classes.domain}>{domain}</div>
                  </div>
                </TableCell>
                <TableCell classes={{root: classes.cell4}}>
                  {description}
                </TableCell>
                <TableCell classes={{root: classes.cell6}}>
                  {type}
                </TableCell>
                <TableCell classes={{root: classes.cell7}}>
                  {reviewerThoughts}
                </TableCell>
                <TableCell classes={{root: classes.cell8}}>
                  <HoverPreviewLink href={sourceLink} innerHTML={foundVia}/>
                </TableCell>
                <TableCell classes={{root: classes.cell11}}>
                  {lastUpdated}
                </TableCell>
                <TableCell classes={{root: classes.cell12}}>
                  {title}
                </TableCell>
                <TableCell classes={{root: classes.cell13}}>
                  {dateAdded}
                </TableCell>
                <TableCell classes={{root: classes.cell14}}>
                  {category}
                </TableCell>
                {/* {row.map((cell, cellNum) => {
                  let cellContent = <span>{cell}</span>
                  let styleClass = classes[`cell${cellNum}`]
                  if (cellNum == 0) { styleClass = classes.leftFixed0 }
                  if (cellNum == 1) { styleClass = classes.leftFixed1 }

                  if (cellNum == 1) {
                    cellContent = <div>
                        <div><HoverPreviewLink href={row[3]} innerHTML={cell}/></div>
                        <div className={classes.domain}>{row[5]}</div>
                      </div>
                  }
                  if (cellNum == 8) {
                    cellContent = <HoverPreviewLink href={row[9]} innerHTML={cell}/>
                  }
                  if ([2,3,5,9,10].includes(cellNum)) { return null }

                  return <TableCell key={`cell-${rowNum}-${cellNum}`} classes={{root: styleClass}}>
                          {cellContent}
                        </TableCell>  
                })} */}
              </TableRow>
            ))}
          </TableBody>
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