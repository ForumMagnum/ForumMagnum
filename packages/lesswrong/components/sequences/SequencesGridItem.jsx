import {
  Components,
  registerComponent,
  Utils
} from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import React, { PureComponent } from 'react';
import { Link, withRouter } from 'react-router';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    ...theme.typography.postStyle,
    cursor: 'pointer',
    
    width: 233,
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
  
  link: {
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
  
  bottom: {
  },
  
  image: {
    width: 203,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.05)",
    [legacyBreakpoints.maxTiny]: {
      width: "100%",
    },
    [theme.breakpoints.down('sm')]: {
      height: "auto",
    },
    "& img": {
      [legacyBreakpoints.maxSmall]: {
        width: "305px !important",
        height: "auto !important",
      },
      width: 203,
      height: 80,
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

  handleClick = (event) => {
    const url = this.getSequenceUrl()
    const navigate = this.props.router.push
    Utils.manualClickNavigation(event, url, navigate)
  }

  render() {
    const { sequence, showAuthor=false, classes } = this.props

    return <div className={classes.root} onClick={this.handleClick}>
      <div className={classNames(classes.top, {[classes.topWithAuthor]: showAuthor})} style={{borderTopColor: sequence.color}}>
        <Link key={sequence._id} className={classes.link} to={this.getSequenceUrl()}>
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
      <div className={classes.bottom}>
        <div className={classes.image}>
          <NoSSR>
            <Components.CloudinaryImage
              publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
              height={124}
              width={315}
            />
          </NoSSR>
        </div>
      </div>
    </div>;
  }
}

SequencesGridItem.displayName = "SequencesGridItem";

registerComponent('SequencesGridItem', SequencesGridItem, withUser, withStyles(styles, { name: "SequencesGridItem" }), withRouter);
