import {
  Components,
  registerComponent,
} from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import React, { PureComponent } from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    ...theme.typography.postStyle,

    width: "33%",
    padding: 15,

    "&:hover": {
      boxShadow: "0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.12)",
      color: "rgba(0,0,0,0.87)",
    },

    [legacyBreakpoints.maxSmall]: {
      width: "335px !important",
    },
    [legacyBreakpoints.maxTiny]: {
      width: "100% !important",
      padding: "14px 10px 12px 10px !important",
    },
  },

  top: {
    height: 44,
    lineHeight: 1.1,
    borderTopStyle: "solid",
    paddingTop: 7,
  },

  topWithAuthor: {
    height: 68,
  },

  title: {
    fontSize: 16,
    lineHeight: 1.0,
    maxHeight: 32,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontVariant: "small-caps",
    marginRight: 5,
    "&:hover": {
      color: "inherit",
      textDecoration: "none",
    }
  },

  draft: {
    textTransform: "uppercase",
    color: "rgba(100, 169, 105, 0.9)",
  },

  author: {
    marginTop: 3,
    color: "rgba(0,0,0,0.5)",

    "&:hover": {
      color: "rgba(0,0,0,0.3)",
      "& a": {
        color: "rgba(0,0,0,0.3)",
      }
    }
  },

  image: {
    width: "100%",
    display: 'block',
    [legacyBreakpoints.maxTiny]: {
      width: "100%",
    },
    "& img": {
      [legacyBreakpoints.maxSmall]: {
        width: "305px !important",
        height: "auto !important",
      },
      width: "100%",
      height: 95,
      [legacyBreakpoints.maxTiny]: {
        width: "100% !important",
      },
    }
  },
})

class SequencesGridItem extends PureComponent {
  getSequenceUrl = () => {
    return '/s/' + this.props.sequence._id
  }

  render() {
    const { sequence, showAuthor=false, classes } = this.props
    const { LinkCard, SequenceTooltip } = Components;
    const url = this.getSequenceUrl()

    return <LinkCard className={classes.root} to={url} tooltip={<SequenceTooltip sequence={sequence}/>}>
      <div className={classNames(classes.top, {[classes.topWithAuthor]: showAuthor})} style={{borderTopColor: sequence.color}}>
        <Link key={sequence._id} to={url}>
          <Typography variant='title' className={classes.title}>
            {sequence.draft && <span className={classes.draft}>[Draft] </span>}
            {sequence.title}
          </Typography>
        </Link>
        { showAuthor &&
          <div className={classes.author}>
            by <Components.UsersName user={sequence.user} />
          </div>}
      </div>
      <div className={classes.image}>
        <NoSSR>
          <Components.CloudinaryImage
            publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
            height={124}
            width={315}
          />
        </NoSSR>
      </div>
    </LinkCard>
  }
}

registerComponent('SequencesGridItem', SequencesGridItem, withUser, withStyles(styles, { name: "SequencesGridItem" }));
