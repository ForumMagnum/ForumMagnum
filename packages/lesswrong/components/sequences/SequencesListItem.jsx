import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import { Image } from 'cloudinary-react';
import NoSSR from 'react-no-ssr';

const SequencesListItem = ({sequence, currentUser}) => {
  // const date = moment(new Date(sequence.createdAt)).format('dddd, MMMM Do YYYY');
  return <div className="sequences-list-item">
    <NoSSR>
      <Image
        className="sequences-list-item-image"
        publicId={sequence.gridImageId || "Group_ybgiy6.png"}
        dpr="auto"
        responsive={true}
        sizes="100vw"
        cloudName="lesswrong-2-0"
        quality="auto"
        height={146}
        width={203}
        crop="fill"
      gravity="custom"/>
    </NoSSR>
    <div className="sequences-list-item-right">
      <div className="sequences-list-item-title">{sequence.title}</div>
      <div className="sequences-list-item-articles">{sequence.finishedPosts}/{sequence.totalPosts} articles</div>
      <div className="sequences-list-item-author">by {sequence.user.displayName}</div>
      <div className="sequences-list-item-description">{sequence.description}</div>
      {/* <div className="">
        <div className="sequences-list-item-comment-count">{sequence.commentCount} comments</div>
        <div className="sequences-list-item-date">{date}</div>
      </div> */}
    </div>
  </div>;
};

SequencesListItem.displayName = "SequencesListItem";

registerComponent('SequencesListItem', SequencesListItem, withCurrentUser);
