import React, { useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Menu } from '@/components/widgets/Menu';
import { MAIN_TAB_ID, TagLens } from '@/lib/arbital/useTagLenses';
import { useTracking } from '@/lib/analyticsEvents';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { useCurrentUser } from '../common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { useMessages } from '../common/withMessages';
import { captureException } from '@sentry/core';
import { tagGetHistoryUrl, tagUserHasSufficientKarma } from '@/lib/collections/tags/helpers';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import ForumIcon from "../common/ForumIcon";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { MenuItem } from "../common/Menus";
import LWTooltip from "../common/LWTooltip";
import AnalyticsTracker from "../common/AnalyticsTracker";
import { gql } from '@/lib/generated/gql-codegen';

const styles = defineStyles("TagPageActionsMenu", (theme: ThemeType) => ({
  tagPageTripleDotMenu: {
    marginLeft: -8,
    alignItems: "end",
    fontSize: "30px",
  },
  tripleDotIcon: {
    marginTop: 1,
    rotate: "90deg",
  },
  menuIcon: {
    color: theme.palette.grey[600],
    marginRight: 12,
    "--icon-size": "16px",
  },
  historyIcon: {
    color: theme.palette.grey[600],
    "--icon-size": "16px",
  },
  menu: {},
  infoCircle: {
    color: theme.palette.greyAlpha(0.5),
    marginLeft: 6,
    "--icon-size": "16px",
  },
}))

export const TagPageActionsMenuButton = ({tagOrLens, createLens, handleEditClick}: {
  tagOrLens: TagLens|undefined
  createLens: (() => void)|null,
  handleEditClick: ((reactEvent: React.MouseEvent<HTMLSpanElement>) => void)|null,
}) => {
  const classes = useStyles(styles);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [everOpened, setEverOpened] = useState(false);
  const { captureEvent } = useTracking({eventType: "tagPageMenuClicked", eventProps: {tagOrLensId: tagOrLens?._id, itemType: "tag"}});
  if (!tagOrLens) {
    return null;
  }

  return <>
    <span
      className={classes.tagPageTripleDotMenu}
      onClick={event => {
        setAnchorEl(event.currentTarget)
        setEverOpened(true);
      }}
    >
      <ForumIcon icon="EllipsisVertical" className={classes.tripleDotIcon}/>
    </span>
    <Menu
      onClick={() => {
        captureEvent("tagPageMenuClicked")
        setAnchorEl(null)
      }}
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      className={classes.menu}
    >
      {everOpened && <TagPageActionsMenu
        tagOrLens={tagOrLens}
        createLens={createLens}
        handleEditClick={handleEditClick}
      />}
    </Menu>
  </>
}

const TagPageActionsMenu = ({tagOrLens, handleEditClick, createLens}: {
  tagOrLens: TagLens
  handleEditClick: ((reactEvent: React.MouseEvent<HTMLSpanElement>) => void)|null,
  createLens: (() => void)|null,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const apolloClient = useApolloClient();
  const isLensPage = tagOrLens._id !== MAIN_TAB_ID;
  const classes = useStyles(styles);
  
  const [promoteLensMutation] = useMutation(gql(`
    mutation promoteLensToMain($lensId: String!) {
      promoteLensToMain(lensId: $lensId)
    }
  `));
  async function promoteLens() {
    try {
      const {data: _} = await promoteLensMutation({
        variables: { lensId: tagOrLens._id },
      });
      
      // This invalidates a lot of client apollo cache contents in a way that's
      // hard to fix incrementally, so just reload everything
      await apolloClient.resetStore();
    } catch(err) {
      captureException(err);
      flash(err.toString());
    }
  }

  //check if any of the buttons will render, else don't show the menu
  const willRender = !!handleEditClick || !!createLens || (userIsAdminOrMod(currentUser) && isLensPage);

  if (!willRender) {
    return null;
  }

  return <AnalyticsTracker eventType="tagPageTripleDotClicked" captureOnClick>
    <DropdownMenu>
      {!!handleEditClick && <MenuItem onClick={handleEditClick}>
        <ForumIcon icon="Edit" className={classes.menuIcon}/>
        Edit
      </MenuItem>}
      {!!createLens && <MenuItem onClick={createLens}>
        <ForumIcon icon="Plus" className={classes.menuIcon}/>
        New Lens
      </MenuItem>}
    {userIsAdminOrMod(currentUser) && isLensPage && <MenuItem onClick={promoteLens}>
      Make {tagOrLens.tabTitle ?? "This Lens"} Main
      {" "}
      <LWTooltip title={<>
        <p>Swaps the currently selected lens ({tagOrLens.tabTitle}) with the Main lens. All revisions on this lens will become revisions of the main lens, and vise versa. The tab title and other lens metadata will not be changed.</p>
        <p>Summaries will not be swapped.</p>
        <p>You must be a moderator or admin to do this.</p>
      </>}>
        <ForumIcon className={classes.infoCircle} icon="InfoCircle"/>
        </LWTooltip>
      </MenuItem>}
    </DropdownMenu>
  </AnalyticsTracker>
}
