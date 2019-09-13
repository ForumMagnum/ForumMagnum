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
  const { ContentItemBody } = Components;
  
  const truncatedDescription = truncate(sequence.contents && sequence.contents.htmlHighlight, SEQUENCE_DESCRIPTION_TRUNCATION_LENGTH);
  
  return <div>
    { /*<div>Created <CalendarDate date={sequence.createdAt}/></div>*/ }
    { /* TODO: Show a date here. We can't use sequence.createdAt because it's often
      very mismatched with the dates of the posts; ideally we'd say something like
      "15 posts from Dec 2010-Feb 2011". */ }
    
    <ContentItemBody
      className={classes.sequenceDescriptionHighlight}
      dangerouslySetInnerHTML={{__html: truncatedDescription}}/>
  </div>;
}

registerComponent('SequenceTooltip', SequenceTooltip, withStyles(styles, { name: "SequenceTooltip" }));
