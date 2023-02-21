import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useHover } from "./withHover";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

// Much of this styling is based on UsersMenu
const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 5,
    wordBreak: "break-all",
    position: "relative",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  mainButtonRoot: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
  },
  mainButtonContents: {
    textTransform: "none",
    fontSize: 16,
    fontWeight: 400,
    color: theme.palette.header.text,
    wordBreak: "break-word",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  icon: {
    width: 20,
    height: 20,
  },
});

const WriteMenu = ({classes}: {classes: ClassesType}) => {
  const {eventHandlers, hover, anchorEl} = useHover();

  const {LWPopper} = Components;

  return (
    <div className={classes.root} {...eventHandlers}>
      <Button classes={{root: classes.mainButtonRoot}}>
        <div className={classes.mainButtonContents}>
          <PencilSquareIcon className={classes.icon} />
          <span>Write</span>
        </div>
      </Button>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
        <Paper>
          Hello world
        </Paper>
      </LWPopper>
    </div>
  );
}

const WriteMenuComponent = registerComponent("WriteMenu", WriteMenu, {styles});

declare global {
  interface ComponentTypes {
    WriteMenu: typeof WriteMenuComponent
  }
}
