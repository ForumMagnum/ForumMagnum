import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import {Card, CardMedia } from 'material-ui/Card';
import { withRouter, Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  text: {
    ...theme.typography.postStyle
  },
  author: {
    ...theme.typography.postStyle,
    marginBottom:10,
  }
})

class CollectionsCard extends PureComponent {
  handleClick = (event) => {
    const { url, router } = this.props
    Utils.manualClickNavigation(event, url, router.push)
  }

  render() {
    const { collection, big = false, url, classes } = this.props
    const cardContentStyle = {borderTopColor: collection.color}

    return <div className={classNames("collection-card-item", {big:big, small: !big})}>
      <div onClick={this.handleClick} className="collection-card-link">
        <Card className="collection-card">
          <CardMedia className="collection-card-media">
            <Components.CloudinaryImage publicId={collection.imageId} />
          </CardMedia>
          <div className="collection-card-content" style={cardContentStyle}>
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
        </Card>
      </div>
    </div>
  }
}

registerComponent("CollectionsCard", CollectionsCard, withStyles(styles), withRouter);
