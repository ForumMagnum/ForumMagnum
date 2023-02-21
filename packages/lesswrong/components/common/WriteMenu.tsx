import React, { FC, ComponentType } from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import {
  DocumentIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useHover } from "./withHover";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

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
  dropdown: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxWidth: 320,
    border: `solid 1px ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
  },
  dropdownSection: {
    padding: 5,
  },
  dropdownDivider: {
    border: "none",
    borderTop: `solid 1px ${theme.palette.grey[200]}`,
  },
  itemRoot: {
    display: "flex",
    flexDirection: "row",
    cursor: "pointer",
    padding: 8,
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  itemIcon: {
    width: 26,
    height: 26,
    marginLeft: -4,
    marginRight: 8,
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
  },
  itemTitle: {
    fontSize: 14,
  },
  itemDescription: {
    color: theme.palette.grey[700],
    marginTop: 4,
  },
});

type WriteMenuItemProps = {
  title: string,
  description: string,
  Icon: ComponentType<{className?: string}>,
  action: string | (() => {}),
  classes: ClassesType,
}

const WriteMenuItem: FC<WriteMenuItemProps> = ({
  title, description, Icon, action, classes,
}) => {
  void action;
  return (
    <div className={classes.itemRoot}>
      <Icon className={classes.itemIcon} />
      <div className={classes.itemInfo}>
        <div className={classes.itemTitle}>{title}</div>
        <div className={classes.itemDescription}>{description}</div>
      </div>
    </div>
  );
}

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
        placement="bottom-end"
      >
        <Paper className={classes.dropdown}>
          <div className={classes.dropdownSection}>
            <WriteMenuItem
              title="New Post"
              description="Summaries, resources, advice, recent developments, critiques etc."
              Icon={DocumentIcon}
              action="/newPost"
              classes={classes}
            />
            <WriteMenuItem
              title="New Question"
              description="A way to kick off discussion or solicit answers to something"
              Icon={QuestionMarkCircleIcon}
              action="/newPost?question=true"
              classes={classes}
            />
            <WriteMenuItem
              title="New Shortform"
              description="Exploratory, draft-stage, rough and off-the-cuff thougths"
              Icon={LightBulbIcon}
              action=""
              classes={classes}
            />
          </div>
          <hr className={classes.dropdownDivider} />
          <div className={classes.dropdownSection}>
            <WriteMenuItem
              title="New Event"
              description="Arrange workshops, talks, reading groups etc. In-person or online"
              Icon={CalendarIcon}
              action="/newPost?eventForm=true"
              classes={classes}
            />
          </div>
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
