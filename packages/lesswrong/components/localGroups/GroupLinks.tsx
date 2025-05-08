import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { forumTypeSetting } from '../../lib/instanceSettings';
import classNames from 'classnames';
import SvgIcon from '../icons/SvgIcon';
import {isFriendlyUI} from '../../themes/forumTheme'
import { TooltipSpan } from '../common/FMTooltip';
import { ForumIcon } from "../common/ForumIcon";

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

export const SlackIcon = (props: any) => <SvgIcon viewBox="70 70 130 130" {...props}>
  <g>
    <g>
      <path d="M99.4,151.2c0,7.1-5.8,12.9-12.9,12.9s-12.9-5.8-12.9-12.9c0-7.1,5.8-12.9,12.9-12.9h12.9V151.2z"/>
      <path d="M105.9,151.2c0-7.1,5.8-12.9,12.9-12.9s12.9,5.8,12.9,12.9v32.3c0,7.1-5.8,12.9-12.9,12.9s-12.9-5.8-12.9-12.9
        C105.9,183.5,105.9,151.2,105.9,151.2z"/>
    </g>
    <g>
      <path d="M118.8,99.4c-7.1,0-12.9-5.8-12.9-12.9s5.8-12.9,12.9-12.9s12.9,5.8,12.9,12.9v12.9H118.8z"/>
      <path d="M118.8,105.9c7.1,0,12.9,5.8,12.9,12.9s-5.8,12.9-12.9,12.9H86.5c-7.1,0-12.9-5.8-12.9-12.9s5.8-12.9,12.9-12.9
        C86.5,105.9,118.8,105.9,118.8,105.9z"/>
    </g>
    <g>
      <path d="M170.6,118.8c0-7.1,5.8-12.9,12.9-12.9c7.1,0,12.9,5.8,12.9,12.9s-5.8,12.9-12.9,12.9h-12.9V118.8z"/>
      <path d="M164.1,118.8c0,7.1-5.8,12.9-12.9,12.9c-7.1,0-12.9-5.8-12.9-12.9V86.5c0-7.1,5.8-12.9,12.9-12.9
        c7.1,0,12.9,5.8,12.9,12.9V118.8z"/>
    </g>
    <g>
      <path d="M151.2,170.6c7.1,0,12.9,5.8,12.9,12.9c0,7.1-5.8,12.9-12.9,12.9c-7.1,0-12.9-5.8-12.9-12.9v-12.9H151.2z"/>
      <path d="M151.2,164.1c-7.1,0-12.9-5.8-12.9-12.9c0-7.1,5.8-12.9,12.9-12.9h32.3c7.1,0,12.9,5.8,12.9,12.9
        c0,7.1-5.8,12.9-12.9,12.9H151.2z"/>
    </g>
  </g>
</SvgIcon>

const styles = (theme: ThemeType) => ({
  root: {
    display: 'inline-block'
  },

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
    marginLeft: 6
  },
  
  groupLink: {
    marginLeft: 6,
  },
  
  websiteLink: {
    marginLeft: theme.spacing.unit - 2,
    transform: "translateY(3px)",
  },
  
  facebookGroupIcon: {
    width: 14,
    height: 14,
    display: "inline-block",
    color: theme.palette.icon.slightlyDim3,
    paddingTop: "0px",
  },

  socialIcon: {
    width: 16,
    height: 16,
    display: "inline-block",
    color: theme.palette.icon.slightlyDim3,
    paddingTop: "0px",
    transform: "translateY(2px)",
  },

  linkIcon: {
    height: 18,
    width: 18,
    paddingTop: "0px",
    color: theme.palette.icon.slightlyDim3,
  },

  iconButton: {
    padding: '0px',
    width: '18px',
    height: '18px',
    verticalAlign: "baseline",
  },
  
  noMargin: {
    margin: 0,
    '& :first-child': {
      marginLeft: 0
    }
  }
});

const tooltips: Partial<Record<string,string>> = {
  'LW': "This is a LessWrong group",
  'EA': "This is an Effective Altruism group",
  'SSC': "This is a Slate Star Codex group",
  'MIRIx': "This is a MIRIx group"
}

const GroupLinksInner = ({ document, noMargin, classes }: {
  document: localGroupsBase|PostsBase,
  noMargin?: Boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const isEAForum = forumTypeSetting.get() === 'EAForum';
  // tooltip text differs between group and event
  const isEvent = 'isEvent' in document;
  const groupLinkProps = {
    className: classes.groupLink,
    target: "_blank",
    rel: "noreferrer",
  } 
  return(
    <div className={classes.root}>
      {!isFriendlyUI && <div className={noMargin ? classNames(classes.groupTypes, classes.noMargin) : classes.groupTypes}>
        {document.types && document.types.map(type => {
          return (
            <TooltipSpan
              title={tooltips[type]}
              placement="top-end"
              key={type}
              className={classes.groupType}
            >
              {type}
            </TooltipSpan>
          )
        })}
      </div>}
      <div className={(noMargin && (isEAForum || !document.types?.length)) ? classNames(classes.groupLinks, classes.noMargin) : classes.groupLinks}>
        {document.facebookLink
          && <TooltipSpan
            title={`Link to Facebook ${isEvent ? 'Event' : 'Group'}`}
            placement="top-end"
          >
            <a href={document.facebookLink} {...groupLinkProps}>
              <FacebookIcon className={classes.facebookGroupIcon}/>
            </a>
          </TooltipSpan>}
        {'facebookPageLink' in document && document.facebookPageLink
        && <TooltipSpan
          title={`Link to Facebook ${isEvent ? 'Event' : 'Page'}`}
          placement="top-end"
        >
          <a href={document.facebookPageLink} {...groupLinkProps}>
            <RoundFacebookIcon className={classes.socialIcon}/>
          </a>
        </TooltipSpan>}
        {document.meetupLink
          && <TooltipSpan title={`Link to Meetup.com ${isEvent ? 'Event' : 'Group'}`} placement="top-end">
            <a href={document.meetupLink} {...groupLinkProps}>
              <MeetupIcon className={classes.socialIcon}/>
            </a>
          </TooltipSpan>}
        {'slackLink' in document && document.slackLink
          && <TooltipSpan title={`Link to Slack Workspace`} placement="top-end">
          <a href={document.slackLink} {...groupLinkProps}>
            <SlackIcon className={classes.socialIcon}/>
          </a>
        </TooltipSpan>}
        {document.website
          && <TooltipSpan title={<span>Link to Group Website ({document.website})</span>} placement="top-end">
            <a href={document.website} {...groupLinkProps} className={classes.websiteLink}>
              <ForumIcon icon="Link" className={classes.linkIcon}/>
            </a>
          </TooltipSpan>}
      </div>
    </div>
  )
}

export const GroupLinks = registerComponent("GroupLinks", GroupLinksInner, {styles});

declare global {
  interface ComponentTypes {
    GroupLinks: typeof GroupLinks
  }
}
