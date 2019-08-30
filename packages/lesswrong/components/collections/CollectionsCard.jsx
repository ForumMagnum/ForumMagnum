import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    width: "100%",
    maxWidth: 347,
    "&:hover": {
      boxShadow: "0 0 5px rgba(0,0,0,.2)"
    },
  },
  card: {
    padding: theme.spacing.unit*2.5,
    display: "flex",
    height: 315,
    [theme.breakpoints.down('sm')]: {
      height: "auto",
    },
    [theme.breakpoints.down('xs')]: {
      height: "auto",
      padding: theme.spacing.unit*1.25,
    },
    flexWrap: "wrap",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    borderTop: "solid 4px black",
    paddingTop: theme.spacing.unit*1.5
  },
  mergeTitle: {
    display: "inline",
    marginRight: 10,
  },
  text: {
    ...theme.typography.postStyle,
  },
  author: {
    ...theme.typography.postStyle,
    marginBottom:theme.spacing.unit,
    display: "inline-block",
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
  },
  thumbnailImage: { // Used only on XS screens
    float: "left",
    position: "relative",
    marginRight: 15,

    '& img': {
      width: 50,
      height: 41,
    }
  },
})

class CollectionsCard extends PureComponent {
  render() {
    const { collection, url, mergeTitle=false, classes } = this.props
    const { LinkCard, CloudinaryImage, UsersName } = Components;
    const cardContentStyle = {borderTopColor: collection.color}

    return <LinkCard className={classes.root} to={url}>
      <div className={classes.card}>
        <div className={classes.content} style={cardContentStyle}>
          <Hidden smUp implementation="css">
            <div className={classes.thumbnailImage}>
              <CloudinaryImage
                publicId={collection.imageId}
                width={50}
                height={41}
              />
            </div>
          </Hidden>
          <Typography variant="h6" className={classNames(classes.title, {[classes.mergeTitle]: mergeTitle})}>
            <Link to={url}>{collection.title}</Link>
          </Typography>
          <Typography variant="subtitle1" className={classes.author}>
            by <UsersName documentId={collection.userId}/>
          </Typography>
          <Typography variant="body1" className={classes.text}>
            {collection.summary}
          </Typography>
        </div>
        <Hidden xsDown implementation="css">
          <div className={classes.media}>
            <CloudinaryImage publicId={collection.imageId} />
          </div>
        </Hidden>
      </div>
    </LinkCard>
  }
}

registerComponent("CollectionsCard", CollectionsCard,
  withStyles(styles, { name: "CollectionsCard" }));
