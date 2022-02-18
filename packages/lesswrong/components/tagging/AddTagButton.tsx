import React, { useState }  from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { useCurrentUser } from '../common/withUser';
import { userCanUseTags } from '../../lib/betas';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  addTagButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: "inline-block",
    textAlign: "center"
  },
  defaultButton: {
    paddingLeft: 4
  }
});

const AddTagButton = ({onTagSelected, onlyCoreTags, classes, children}: {
  onTagSelected: (props: {tagId: string, tagName: string})=>void,
  onlyCoreTags?: boolean,
  classes: ClassesType,
  children?: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { LWPopper, AddTag } = Components

  if (!userCanUseTags(currentUser)) {
    return null;
  }

  return <a
    onClick={(ev) => {
      setAnchorEl(ev.currentTarget);
      setIsOpen(true);
      captureEvent("addTagClicked")
    }}
    className={classes.addTagButton}
  >
    {children ? children : <span className={classes.defaultButton}>+ Add Tag</span>}

    <LWPopper
      open={isOpen}
      anchorEl={anchorEl}
      placement="bottom"
      modifiers={{
        flip: {
          enabled: false
        }
      }}
    >
      <ClickAwayListener
        onClickAway={() => setIsOpen(false)}
      >
        <Paper>
          <AddTag
            onlyCoreTags={onlyCoreTags}
            onTagSelected={({tagId, tagName}: {tagId: string, tagName: string}) => {
              setAnchorEl(null);
              setIsOpen(false);
              onTagSelected({tagId, tagName});
            }}
          />
        </Paper>
      </ClickAwayListener>
    </LWPopper>
  </a>;
}

const AddTagButtonComponent = registerComponent("AddTagButton", AddTagButton, {styles});

declare global {
  interface ComponentTypes {
    AddTagButton: typeof AddTagButtonComponent
  }
}
