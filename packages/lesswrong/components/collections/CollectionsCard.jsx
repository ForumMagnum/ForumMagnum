import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { CardMedia } from 'material-ui/Card';
import { withRouter, Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    cursor:"pointer",
    width: "100%",
    maxWidth: 347,
  },
  card: {
    padding: theme.spacing.unit*2.5,
    display: "flex",
    height: 315,
    [theme.breakpoints.down('sm')]: {
      height: "auto",
    },
    flexWrap: "wrap",
    flexDirection: "column",
    justifyContent: "space-between",
    "&:hover": {
      boxShadow: "0 0 5px rgba(0,0,0,.2)"
    },
  },
  content: {
    marginBottom:theme.spacing.unit*2,
    borderTop: "solid 4px black",
    paddingTop: theme.spacing.unit*1.5
  },
  text: {
    ...theme.typography.postStyle
  },
  author: {
    ...theme.typography.postStyle,
    marginBottom:theme.spacing.unit,
  },
  media: {
    '& img':{
      width:307,
      [theme.breakpoints.down('sm')]: {
        width: "100%",
        maxWidth:307,
        overflow: "hidden"
      },
    }
  }
})

class CollectionsCard extends PureComponent {
  handleClick = (event) => {
    const { url, router } = this.props
    Utils.manualClickNavigation(event, url, router.push)
  }

  render() {
    const { collection, url, classes } = this.props
    const cardContentStyle = {borderTopColor: collection.color}

    return <div className={classes.root} onClick={this.handleClick}>
        <div className={classes.card}>
          <div className={classes.content} style={cardContentStyle}>
            <Typography variant="title" className={classes.title}>
              <Link to={url}>{collection.title}</Link>
            </Typography>
            <Typography variant="subheading" className={classes.author}>
              by <Components.UsersName user={collection.user}/>
            </Typography>
            <Typography variant="body2" className={classes.text}>
              {collection.summary}
            </Typography>
          </div>
          <CardMedia className={classes.media}>
            <Components.CloudinaryImage publicId={collection.imageId} />
          </CardMedia>
        </div>
    </div>
  }
}

registerComponent("CollectionsCard", CollectionsCard, withStyles(styles, { name: "CollectionsCard" }), withRouter);
