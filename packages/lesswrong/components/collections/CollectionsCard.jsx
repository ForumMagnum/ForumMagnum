import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import {Card, CardMedia } from 'material-ui/Card';
import { withRouter, Link } from 'react-router';
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

const CollectionsCard = ({collection, big = false, url, classes, router}) => {
  const cardContentStyle = {borderTopColor: collection.color}


  return <div className={classNames("collection-card-item", {big:big, small: !big})}>
    <div onClick={() => router.push(url)} className="collection-card-link">
      <Card className="collection-card">
        <CardMedia className="collection-card-media">
          <Image publicId={collection.imageId} cloudName="lesswrong-2-0" quality="auto" />
        </CardMedia>
        <div className="collection-card-content" style={cardContentStyle}>
          <Link to={url}>
            <Typography variant="title" className={classes.title}>
              {collection.title}
            </Typography>
          </Link>
          <Typography variant="subheading" className={classes.author}>
            by <span onClick={(e)=> e.stopPropagation()}> {/* To avoid routing onClick of parent triggering */}
              <Components.UsersName user={collection.user}/>
            </span>
          </Typography>
          <Typography variant="body2" className={classes.text}>
            {collection.summary}
          </Typography>
        </div>
      </Card>
    </div>
  </div>
}

registerComponent("CollectionsCard", CollectionsCard, withStyles(styles), withRouter);
