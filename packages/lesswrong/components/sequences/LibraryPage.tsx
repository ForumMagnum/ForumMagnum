"use client";

import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useNavigate } from '../../lib/routeUtil';
import SingleColumnSection from "../common/SingleColumnSection";
import ForumIcon from "../common/ForumIcon";
import SequencesNewButton from "./SequencesNewButton";
import SequencesSearchAutoComplete from "../search/SequencesSearchAutoComplete";
import LWCoreReading from "./LWCoreReading";
import LibraryContinueReading from "./LibraryContinueReading";
import LibrarySectionTitle from "./LibrarySectionTitle";
import LibrarySequencesGrid from "./LibrarySequencesGrid";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LibraryPage', (theme: ThemeType) => ({
  hero: {
    paddingTop: 8,
    paddingBottom: 24,
    borderBottom: theme.palette.border.faint,
  },
  heroTitle: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    ...theme.typography.smallCaps,
    margin: 0,
    lineHeight: 1.1,
  },
  heroSubtitle: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    color: theme.palette.grey[600],
    marginTop: 12,
    maxWidth: 620,
    lineHeight: "1.6em",
  },
  heroNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: 20,
  },
  heroNavLink: {
    ...theme.typography.commentStyle,
    fontSize: "1.05rem",
    color: theme.palette.grey[700],
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
    borderRadius: 20,
    padding: "6px 14px",
    boxShadow: theme.palette.boxShadow.faint,
    "&:hover": {
      color: theme.palette.primary.main,
      textDecoration: "none",
      boxShadow: theme.palette.boxShadow.default,
    },
  },
  communityHeaderControls: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  searchBox: {
    position: "relative",
    "& input": {
      ...theme.typography.commentStyle,
      fontSize: "1.05rem",
      color: theme.palette.text.normal,
      background: theme.palette.panelBackground.default,
      border: theme.palette.border.normal,
      borderRadius: 18,
      padding: "7px 14px 7px 34px",
      width: 210,
      "&:focus": {
        border: theme.palette.border.intense,
        outline: "none",
      },
    },
    "& .react-autosuggest__suggestions-container--open": {
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 4,
      width: 400,
      maxWidth: "calc(100vw - 32px)",
      background: theme.palette.panelBackground.default,
      boxShadow: theme.palette.boxShadow.searchResults,
      borderRadius: theme.borderRadius.default,
      zIndex: theme.zIndexes.searchResults,
      overflow: "hidden",
    },
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    color: theme.palette.grey[500],
    pointerEvents: "none",
    zIndex: 1,
  },
}));

const heroNavLinks = [
  {anchor: "core-reading", label: "Core Reading"},
  {anchor: "curated-sequences", label: "Curated Sequences"},
  {anchor: "community-sequences", label: "Community Sequences"},
];

const LibraryPage = () => {
  const classes = useStyles(styles);
  const navigate = useNavigate();

  return <AnalyticsContext pageContext="sequencesHome">
    <SingleColumnSection>
      <div className={classes.hero}>
        <h1 className={classes.heroTitle}>The Library</h1>
        <div className={classes.heroSubtitle}>
          The collected works of the LessWrong community: essays on rationality,
          AI, and how the world works, organized into sequences of posts that
          build on each other and are meant to be read in order.
        </div>
        <nav className={classes.heroNav}>
          {heroNavLinks.map(({anchor, label}) =>
            <a key={anchor} href={`#${anchor}`} className={classes.heroNavLink}>
              {label}
            </a>
          )}
        </nav>
      </div>
    </SingleColumnSection>

    <LibraryContinueReading/>

    <AnalyticsContext pageSectionContext="coreReading">
      <SingleColumnSection>
        <LibrarySectionTitle
          title="Core Reading"
          anchor="core-reading"
          description="The foundational collections. If you're new to LessWrong, this is the place to start."
        />
        <LWCoreReading/>
      </SingleColumnSection>
    </AnalyticsContext>

    <AnalyticsContext pageSectionContext="curatedSequences">
      <SingleColumnSection>
        <LibrarySectionTitle
          title="Curated Sequences"
          anchor="curated-sequences"
          description="Sequences the LessWrong team especially recommends, on topics from game theory to slack to the art of noticing."
        />
        <LibrarySequencesGrid
          terms={{view: 'curatedSequences', limit: 12}}
          itemsPerPage={24}
          showLoadMore
        />
      </SingleColumnSection>
    </AnalyticsContext>

    <AnalyticsContext pageSectionContext="communitySequences">
      <SingleColumnSection>
        <LibrarySectionTitle
          title="Community Sequences"
          anchor="community-sequences"
          description="Hundreds of sequences created by LessWrong users, on anything from anthropics to zettelkasten. Anyone can make one."
        >
          <div className={classes.communityHeaderControls}>
            <div className={classes.searchBox}>
              <ForumIcon icon="Search" className={classes.searchIcon}/>
              <SequencesSearchAutoComplete clickAction={(sequenceId: string) => navigate(`/s/${sequenceId}`)}/>
            </div>
            <SequencesNewButton/>
          </div>
        </LibrarySectionTitle>
        <LibrarySequencesGrid
          terms={{view: 'communitySequences', limit: 12}}
          itemsPerPage={24}
          showLoadMore
        />
      </SingleColumnSection>
    </AnalyticsContext>
  </AnalyticsContext>;
};

export default LibraryPage;
