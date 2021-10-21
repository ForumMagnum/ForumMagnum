import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import LinkIcon from '@material-ui/icons/Link';
import SvgIcon from '@material-ui/core/SvgIcon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { createStyles } from '@material-ui/core/styles';
import { forumTypeSetting } from '../../lib/instanceSettings';


// just the "f", used for the FB Group link
export const FacebookIcon = (props: any) => <SvgIcon viewBox="0 0 155.139 155.139" {...props}>
  <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184
  c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452 v20.341H37.29v27.585h23.814v70.761H89.584z"/>
</SvgIcon>

// circle with the "f" cut out, used for the FB Page link
export const RoundFacebookIcon = (props: any) => <SvgIcon viewBox="0 0 24 24" {...props}>
  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
</SvgIcon>

export const MeetupIcon = (props: any) => <SvgIcon viewBox="15 15 70 70" {...props}>
  <path d="M80.952,74.251c-0.74,0.802-1.917,1.41-3.104,1.721c-3.226,0.844-7.038-0.031-10.038-1.351
  c-9.568-4.21-7.455-14.872-3.259-22.225c1.26-2.208,2.503-4.431,3.754-6.666c0.984-1.76,3.114-4.724,2.28-6.875
  c-0.875-2.256-3.216-2.27-4.753-0.369c-1.479,1.829-2.726,4.454-3.746,6.584c-1.111,2.319-6.656,14.507-6.656,14.507
  c-1.024,1.985-2.751,4.839-4.624,6.416c-1.397,1.177-3.95,1.522-5.629,0.303c-1.275-0.927-1.527-2.159-1.277-3.594
  c1.156-6.625,11.204-22.04,4.274-23.125c-2.656-0.416-3.377,2.539-4.196,4.426c-1.354,3.116-2.386,6.361-3.834,9.441
  c-1.664,3.536-2.939,7.219-3.813,11.02c-0.698,3.037-1.602,6.907-5.06,7.832c-9.465,2.531-12.341-3.718-12.341-3.719
  c-1.545-4.916-0.08-9.338,1.408-14.066c1.15-3.652,1.837-7.419,3.293-10.973c2.598-6.336,5.187-19.556,14.549-18.711
  c2.39,0.216,5.063,1.424,7.128,2.628c1.877,1.095,3.305,1.679,5.49,0.499c2.126-1.146,3.099-3.277,5.632-4.008
  c2.715-0.783,4.5,0.376,6.53,2.009c2.846,2.288,3.156,1.254,5.504,0.653c1.947-0.499,4.208-0.73,6.342-0.365
  c10.982,1.882,3.988,15.901,1.368,21.535c-1.705,3.665-9.844,18.404-2.633,20.385c2.175,0.597,4.979,0.325,6.79,1.885
  C82.172,71.633,81.989,73.13,80.952,74.251z" />
</SvgIcon>

const styles = createStyles((theme: ThemeType): JssStyles => ({
  groupTypes: {
    marginLeft: 12,
    display: 'inline-block',
  },

  groupType: {
    ...theme.typography.headerStyle,
    display: 'inline-block',
    width: 'initial',
    height: '20px',
    fontSize: '14px',
    marginLeft: theme.spacing.unit
  },

  groupLinks: {
    display: 'inline-flex',
    alignItems: 'baseline',
    marginLeft: '6px'
  },
  
  groupLink: {
    marginLeft: theme.spacing.unit
  },
  
  websiteLink: {
    marginLeft: theme.spacing.unit - 3
  },
  
  facebookGroupIcon: {
    width: "13px",
    height: "13px",
    display: "inline-block",
    color: "rgba(0, 0, 0, 0.7)",
    paddingTop: "0px",
  },

  socialIcon: {
    width: "15px",
    height: "15px",
    display: "inline-block",
    color: "rgba(0, 0, 0, 0.7)",
    paddingTop: "0px",
    transform: "translateY(1px)",
  },

  linkIcon: {
    height: "17px",
    width: "17px",
    paddingTop: "0px",
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
  // tooltip text differs between group and event
  const isEvent = 'isEvent' in document;
  
  return(
    <div className={classes.root}>
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
            title={`Link to Facebook ${isEvent ? 'Event' : 'Group'}`}
            placement="top-end"
          >
            <a href={document.facebookLink} className={classes.groupLink}>
              <FacebookIcon className={classes.facebookGroupIcon}/>
            </a>
          </Tooltip>}
        {document.facebookPageLink
        && <Tooltip
          title={`Link to Facebook ${isEvent ? 'Event' : 'Page'}`}
          placement="top-end"
        >
          <a href={document.facebookPageLink} className={classes.groupLink}>
            <RoundFacebookIcon className={classes.socialIcon}/>
          </a>
        </Tooltip>}
        {document.meetupLink
          && <Tooltip title={`Link to Meetup.com ${isEvent ? 'Event' : 'Group'}`} placement="top-end">
            <a href={document.meetupLink} className={classes.groupLink}>
              <MeetupIcon className={classes.socialIcon}/>
            </a>
          </Tooltip>}
        {document.website
          && <Tooltip title={<span>Link to Group Website ({document.website})</span>} placement="top-end">
            <a href={document.website} className={classes.websiteLink}>
              <LinkIcon className={classes.linkIcon}/>
            </a>
          </Tooltip>}
      </div>
    </div>
  )
}

const GroupLinksComponent = registerComponent("GroupLinks", GroupLinks, {styles});

declare global {
  interface ComponentTypes {
    GroupLinks: typeof GroupLinksComponent
  }
}

