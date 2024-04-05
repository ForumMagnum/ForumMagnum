import React, { ReactNode, useRef, useState }  from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from '@material-ui/core/Paper';
import { useCurrentUser } from '../common/withUser';
import { userCanUseTags } from '../../lib/betas';
import { useTracking } from "../../lib/analyticsEvents";
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { PopperPlacementType } from '@material-ui/core/Popper';

const styles = (theme: ThemeType): JssStyles => ({
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

const AddTagButton = ({onTagSelected, tooltipPlacement = "bottom-start", isVotingContext, classes, children}: {
  onTagSelected: (props: {tagId: string, tagName: string}) => void,
  tooltipPlacement?: PopperPlacementType,
  isVotingContext?: boolean,
  classes: ClassesType,
  children?: ReactNode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorEl = useRef<HTMLAnchorElement|null>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { LWPopper, AddTag, LWClickAwayListener } = Components

  if (!userCanUseTags(currentUser)) {
    return null;
  }

  return <a
    onClick={() => {
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
      placement={tooltipPlacement}
      allowOverflow
    >
      <LWClickAwayListener
        onClickAway={() => setIsOpen(false)}
      >
        <Paper>
          <AddTag
            onTagSelected={({tagId, tagName}: {tagId: string, tagName: string}) => {
              setIsOpen(false);
              onTagSelected({tagId, tagName});
            }}
            isVotingContext={isVotingContext}
          />
        </Paper>
      </LWClickAwayListener>
    </LWPopper>
  </a>;
}

const AddTagButtonComponent = registerComponent("AddTagButton", AddTagButton, {styles});

declare global {
  interface ComponentTypes {
    AddTagButton: typeof AddTagButtonComponent
  }
}
