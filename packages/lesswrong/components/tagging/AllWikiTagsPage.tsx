import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useDialog } from '../common/withDialog';
import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SearchIcon from '@material-ui/icons/Search';

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    padding: "0 100px",
    maxWidth: 1000,
  },
  topSection: {
    marginBottom: 32,
  },
  addTagButton: {
    verticalAlign: "middle",
  },
  titleClass: {
    fontSize: "4rem",
    fontWeight: 500,
    marginBottom: 32,
  },
  mainContent: {
    display: "flex",
  },
  wikiTagNestedList: {
    flex: 1
  },
  viewer: {
    flex: 3
  },
  viewerContent: {
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    width: 400,
    // marginTop: theme.spacing.unit * 4,
  },
  searchIcon: {
    // position: 'absolute',
    // right: '15px',
    // top: '50%',
    // transform: 'translateY(-70%)',
    color: theme.palette.grey[500],
    marginLeft: -20,
  },
  searchBar: {
    width: "100%",
    padding: 6,
    fontSize: "1.0rem",
    boxSizing: "border-box",
  },
  wikitagName: {
    fontSize: "1.5rem",
    fontWeight: 500,
  }
}))

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  // const { tag, loading } = useTagBySlug("portal", "AllWikiTagsPageFragment");

  const { SectionButton, SectionTitle, ContentStyles, ToCColumn, WikiTagNestedList } = Components;

  // const htmlWithAnchors = tag?.tableOfContents?.html || tag?.description?.html || "";

  const viewingPage = <div>
    <div className={classes.wikitagName}>
    </div>
  </div>





  return (
    <AnalyticsContext pageContext="allWikiTagsPage">
      <div className={classes.root}>
        <div className={classes.topSection}>
            <SectionTitle title="Concepts" titleClassName={classes.titleClass}>
              <SectionButton>
                {currentUser && tagUserHasSufficientKarma(currentUser, "new") && <Link
                  to={tagCreateUrl}
                >
                  <AddBoxIcon className={classes.addTagButton}/>
                  New {taggingNameCapitalSetting.get()}
                </Link>}
                {!currentUser && <a onClick={(ev) => {
                  openDialog({
                    componentName: "LoginPopup",
                    componentProps: {}
                  });
                  ev.preventDefault();
                }}>
                  <AddBoxIcon className={classes.addTagButton}/>
                  New {taggingNameCapitalSetting.get()}
                </a>}
              </SectionButton>
            </SectionTitle>

            <div className={classes.searchContainer}>
              <input
                type="text"
                className={classes.searchBar}
                placeholder="What would you like to read about?"
              />
              <SearchIcon className={classes.searchIcon} />
            </div>


        </div>
        <div className={classes.mainContent}>
          <div className={classes.wikiTagNestedList}>
          <WikiTagNestedList />
          </div>
          <div className={classes.viewer}>
            <ContentStyles contentType="tag" className={classes.viewerContent}>
            </ContentStyles>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const AllWikiTagsPageComponent = registerComponent("AllWikiTagsPage", AllWikiTagsPage);

export default AllWikiTagsPageComponent;

declare global {
  interface ComponentTypes {
    AllWikiTagsPage: typeof AllWikiTagsPageComponent
  }
}
