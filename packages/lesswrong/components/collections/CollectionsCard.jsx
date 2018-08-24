import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import {Card, CardMedia } from 'material-ui/Card';
import { Link } from 'react-router';
import { Image } from 'cloudinary-react';
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

const CollectionsCard = ({collection, big = false, url, classes}) => {
  const cardContentStyle = {borderTopColor: collection.color}


  return <div className={classNames("collection-card-item", {big:big, small: !big})}>
    <Link to={url} className="collection-card-link">
      <Card className="collection-card">
        <CardMedia className="collection-card-media">
          <Image publicId={collection.imageId} cloudName="lesswrong-2-0" quality="auto" />
        </CardMedia>
        <div className="collection-card-content" style={cardContentStyle}>
          <Typography variant="title" className={classes.title}>
            {collection.title}
          </Typography>
          <Typography variant="subheading" className={classes.author}>
            by <Components.UsersName user={collection.user}/>
          </Typography>
          <Typography variant="body2" className={classes.text}>
            {collection.summary}
          </Typography>
        </div>
      </Card>
    </Link>
  </div>
}

registerComponent("CollectionsCard", CollectionsCard, withStyles(styles, { name: "CollectionsCard" }));
