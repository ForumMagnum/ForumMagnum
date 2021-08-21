import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import LinkIcon from '@material-ui/icons/Link';
import SvgIcon from '@material-ui/core/SvgIcon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { createStyles } from '@material-ui/core/styles';
import { forumTypeSetting } from '../../lib/instanceSettings';


export const FacebookIcon = (props: any) => <SvgIcon viewBox="0 0 155.139 155.139" {...props}>
  <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184
  c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452 v20.341H37.29v27.585h23.814v70.761H89.584z"/>
</SvgIcon>

const styles = createStyles((theme: ThemeType): JssStyles => ({
  groupTypes: {
    marginLeft: 20,
    display: 'inline-block',
  },

  groupType: {
    ...theme.typography.headerStyle,
    display: 'inline-block',
    width: 'initial',
    height: '20px',
    fontSize: '14px',
    marginRight: 5
  },

  groupLinks: {
    display: 'inline-block',
    marginLeft: '6px'
  },

  facebookIcon: {
    width: "12px",
    height: "12px",
    display: "inline-block",
    color: "rgba(0, 0, 0, 0.7)",
    paddingTop: "0px",
    transform: "translateY(1px)",
  },

  linkIcon: {
    height: "17px",
    width: "17px",
    paddingTop: "2px",
    transform: "translateY(3px) rotate(-45deg)",
  },

  iconButton: {
    padding: '0px',
    width: '18px',
    height: '18px',
    verticalAlign: "baseline",
  }
}));

const tooltips: Partial<Record<string,string>> = {
  'LW': "This is a LessWrong group",
  'EA': "This is an Effective Altruism group",
  'SSC': "This is a Slate Star Codex group",
  'MIRIx': "This is a MIRIx group"
}

const GroupLinks = ({ document, classes }: {
  document: localGroupsBase|PostsBase,
  classes: ClassesType,
}) => {
  const isEAForum = forumTypeSetting.get() === 'EAForum';
  return(
    <span className="group-links">
      {!isEAForum && <div className={classes.groupTypes}>
        {document.types && document.types.map(type => {
          return (
            <Tooltip
              title={tooltips[type]}
              placement="top-end"
              key={type}
            >
              <div className={classes.groupType}>
                {type}
              </div>
            </Tooltip>
          )
        })}
      </div>}
      <div className={classes.groupLinks}>
        {document.facebookLink
          && <Tooltip
            title="Link to Facebook Group"
            placement="top-end"
          >
            <a href={document.facebookLink}><IconButton className={classes.iconButton} color="inherit">
              <FacebookIcon className={classes.facebookIcon}/>
            </IconButton></a>
          </Tooltip>}
        {document.website
          && <Tooltip title={<span>Link to Group Website ({document.website})</span>} placement="top-end">
            <a href={document.website}><IconButton className={classes.iconButton} color="inherit">
              <LinkIcon className={classes.linkIcon}/>
            </IconButton></a>
          </Tooltip>}
      </div>
    </span>
  )
}

const GroupLinksComponent = registerComponent("GroupLinks", GroupLinks, {styles});

declare global {
  interface ComponentTypes {
    GroupLinks: typeof GroupLinksComponent
  }
}

