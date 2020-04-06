import React, { useState }  from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { useCurrentUser } from '../common/withUser';
import { userCanUseTags } from '../../lib/betas';

const styles = theme => ({
  addTagButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: "inline-block",
    height: 26,
    textAlign: "center",
    padding: 4
  },
});

const AddTagButton = ({onTagSelected, classes}: {
  onTagSelected: (props: {tagId: string, tagName: string})=>void,
  classes: ClassesType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const currentUser = useCurrentUser();
  
  if (!userCanUseTags(currentUser)) {
    return null;
  }
  
  return <a
    onClick={(ev) => {setAnchorEl(ev.currentTarget); setIsOpen(true)}}
    className={classes.addTagButton}
  >
    {"+ Add Tag"}
    
    <Components.LWPopper
      open={isOpen}
      anchorEl={anchorEl}
      placement="bottom-start"
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
          <Components.AddTag
            onTagSelected={({tagId, tagName}: {tagId: string, tagName: string}) => {
              setAnchorEl(null);
              setIsOpen(false);
              onTagSelected({tagId, tagName});
            }}
          />
        </Paper>
      </ClickAwayListener>
    </Components.LWPopper>
  </a>;
}

const AddTagButtonComponent = registerComponent("AddTagButton", AddTagButton, {styles});

declare global {
  interface ComponentTypes {
    AddTagButton: typeof AddTagButtonComponent
  }
}
