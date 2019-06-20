import React from 'react';
import { Components, registerComponent, } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { truncate } from '../../lib/editor/ellipsize';

const SEQUENCE_DESCRIPTION_TRUNCATION_LENGTH = 750;

const styles = theme => ({
  sequenceDescriptionHighlight: {
  },
});

const SequenceTooltip = ({ sequence, classes }) => {
  const { CalendarDate, ContentItemBody } = Components;
  
  const truncatedDescription = truncate(sequence.contents && sequence.contents.htmlHighlight, SEQUENCE_DESCRIPTION_TRUNCATION_LENGTH);
  
  return <div>
    <div>{sequence.title}</div>
    <div>by {sequence.user.displayName}</div>
    <div>Created <CalendarDate date={sequence.createdAt}/></div>
    
    <ContentItemBody
      className={classes.sequenceDescriptionHighlight}
      dangerouslySetInnerHTML={{__html: truncatedDescription}}/>
  </div>;
}

registerComponent('SequenceTooltip', SequenceTooltip, withStyles(styles, { name: "SequenceTooltip" }));