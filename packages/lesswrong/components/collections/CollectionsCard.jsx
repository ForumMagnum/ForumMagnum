import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import {Card, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import { Link } from 'react-router';
import { Image } from 'cloudinary-react';

const cardTitleStyle = {
  fontSize: "20px",
  lineHeight: "120%",
  fontWeight: "600",
};

const cardSubtitleStyle = {
  fontSize: "16px",
  lineHeight: "100%",
}

const CollectionsCard = ({collection, big = false, url}) => {
  const cardContentStyle = {borderTopColor: collection.color}


  return <div className={"collection-card-item" + (big ? " big" : " small")} >
    <Link to={url} className="collection-card-link">
      <Card className="collection-card">
        <CardMedia className="collection-card-media">
          <Image publicId={collection.imageId} cloudName="lesswrong-2-0" quality="auto" />
        </CardMedia>
        <div className="collection-card-content" style={cardContentStyle}>
          <CardTitle
            title={collection.title}
            className="collection-card-title"
            titleStyle={cardTitleStyle}
            subtitle={<object><div className="collection-card-author">
              by <Components.UsersName user={collection.user}/>
            </div></object>}
            subtitleStyle={cardSubtitleStyle}
          />
          <CardText
            className="collection-card-text"
            >
            {collection.summary}
          </CardText>
        </div>
      </Card>
    </Link>
  </div>
}

registerComponent("CollectionsCard", CollectionsCard);
