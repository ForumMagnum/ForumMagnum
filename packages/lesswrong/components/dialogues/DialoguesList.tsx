import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  dialogueFacilitationItem: {
    paddingTop: 12,
    paddingBottom: 12,
    position: "relative",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    ...commentBodyStyles(theme),
    lineHeight: '1.65rem',
  },
  content: {
    paddingTop: 0,
    paddingRight: 35,
    paddingLeft: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 75,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    [theme.breakpoints.down('xs')]: {
      marginRight: 10,
      paddingRight: 20,
    },
    "& p": {
      marginBottom: 0,
      marginTop: 5,
    }
  },  

  closeIcon: { 
    color: "#e0e0e0",
    position: 'absolute', 
    right: '8px',
    top: '8px',
    padding: '2px',
  },

  prompt: {
    color: theme.palette.lwTertiary.main,
    fontWeight: 645,
  },

  subheading: {
    marginTop: '10px',
  }
});

const DialoguesList = ({ classes }: { classes: ClassesType }) => {
  const { PostsItem, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle } = Components
  const currentUser = useCurrentUser()

  const { results: dialoguePosts } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  const { results: myDialogues } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "MyDialogues",
    limit: 3,
  }); 

  const dialoguesTooltip = <div>
    <p>Dialogues between a small group of users. Click to see more.</p>
  </div>

  const renderMyDialogues = !!currentUser && myDialogues?.length 

  const myDialoguesTooltip = <div>
      <div>These are the dialoges you are involved in (both drafts and published)</div>
    </div>

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      />
      
      {dialoguePosts?.map((post, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}

      {renderMyDialogues && (
          <div className={classes.subsection}>
            <AnalyticsContext pageSubSectionContext="myDialogues">
              <LWTooltip placement="top-start" title={myDialoguesTooltip}>
                <Link to={"/dialogues"}>
                  <SectionSubtitle className={classes.subheading}>
                    My Dialogues (only visible to you)
                  </SectionSubtitle>
                </Link>
              </LWTooltip>
              {myDialogues?.map((post, i: number) =>
                <PostsItem
                  key={post._id} post={post}
                  showBottomBorder={i < myDialogues.length-1}
                />
              )}
            </AnalyticsContext>
          </div>
        )}
      

   </SingleColumnSection>
  </AnalyticsContext>
}

const DialoguesListComponent = registerComponent('DialoguesList', DialoguesList, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesListComponent
  }
}
