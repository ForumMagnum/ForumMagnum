import React, { ReactNode, useRef, useState }  from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Paper }from '@/components/widgets/Paper';
import { useCurrentUser } from '../common/withUser';
import { userCanUseTags } from '../../lib/betas';
import { useTracking } from "../../lib/analyticsEvents";
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { isBookUI, preferredHeadingCase } from '../../themes/forumTheme';
import type { Placement as PopperPlacementType } from "popper.js"

const styles = (theme: ThemeType) => ({
  addTagButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: "inline-block",
    textAlign: "center",
    "@media print": { display: "none" },
  },
  defaultButton: {
    paddingLeft: 4
  }
});

const AddTagButton = ({onTagSelected, menuPlacement="bottom-start", isVotingContext, hasTooltip=true, classes, children}: {
  onTagSelected: (props: {tagId: string, tagName: string}) => void,
  menuPlacement?: PopperPlacementType,
  isVotingContext?: boolean,
  hasTooltip?: boolean,
  classes: ClassesType<typeof styles>,
  children?: ReactNode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorEl = useRef<HTMLAnchorElement|null>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { LWPopper, AddTagOrWikiPage, LWClickAwayListener, LWTooltip } = Components

  if (!userCanUseTags(currentUser)) {
    return null;
  }

  const button = <a onClick={() => {
        setIsOpen(true);
        captureEvent("addTagClicked")
      }}
      className={classes.addTagButton}
      ref={anchorEl}
    >
      {children
        ? children
        : <span className={classes.defaultButton}>
          + {preferredHeadingCase(`Add ${taggingNameCapitalSetting.get()}`)}
        </span>
      }
        <LWPopper
          open={isOpen}
          anchorEl={anchorEl.current}
          placement={menuPlacement}
          allowOverflow
        >
          <LWClickAwayListener
            onClickAway={() => setIsOpen(false)}
          >
            <Paper>
              <AddTagOrWikiPage
                onlyTags={true}
                onTagSelected={({tagId, tagName}: {tagId: string, tagName: string}) => {
                  setIsOpen(false);
                  onTagSelected({tagId, tagName});
                }}
                isVotingContext={isVotingContext}
              />
            </Paper>
          </LWClickAwayListener>
        </LWPopper>
    </a>
  
  if (isBookUI && hasTooltip) {
    return <LWTooltip title="Add a tag">
      {button}
    </LWTooltip>
  }
  return button;
}

const AddTagButtonComponent = registerComponent("AddTagButton", AddTagButton, {styles});

declare global {
  interface ComponentTypes {
    AddTagButton: typeof AddTagButtonComponent
  }
}
