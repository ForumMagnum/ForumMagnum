import React, { ReactNode, useRef, useState }  from 'react';
import { Paper }from '@/components/widgets/Paper';
import { useCurrentUser } from '../common/withUser';
import { useTracking } from "../../lib/analyticsEvents";
import type { Placement as PopperPlacementType } from "popper.js"
import LWPopper from "../common/LWPopper";
import AddTagOrWikiPage from "./AddTagOrWikiPage";
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWTooltip from "../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("AddTagButton", (theme: ThemeType) => ({
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
}));

const AddTagButton = ({onTagSelected, menuPlacement="bottom-start", isVotingContext, hasTooltip=true, children}: {
  onTagSelected: (props: {tagId: string, tagName: string}) => void,
  menuPlacement?: PopperPlacementType,
  isVotingContext?: boolean,
  hasTooltip?: boolean,
  children?: ReactNode,
}) => {
  const classes = useStyles(styles);
  const [isOpen, setIsOpen] = useState(false);
  const anchorEl = useRef<HTMLAnchorElement|null>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()

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
          + {`Add Wikitag`}
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
  
  if (hasTooltip) {
    return <LWTooltip title="Add a tag">
      {button}
    </LWTooltip>
  }
  return button;
}

export default AddTagButton;


