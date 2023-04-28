import React, { ReactNode, useRef, useState }  from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from '@material-ui/core/Paper';
import { useCurrentUser } from '../common/withUser';
import { userCanUseTags } from '../../lib/betas';
import { useTracking } from "../../lib/analyticsEvents";
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';

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

const AddTagButton = ({onTagSelected, isVotingContext, classes, children}: {
  onTagSelected: (props: {tagId: string, tagName: string})=>void,
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
    onClick={(ev) => {
      setIsOpen(true);
      captureEvent("addTagClicked")
    }}
    className={classes.addTagButton}
    ref={anchorEl}
  >
    {children ? children : <span className={classes.defaultButton}>+ Add {taggingNameCapitalSetting.get()}</span>}

    <LWPopper
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom-start"
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
