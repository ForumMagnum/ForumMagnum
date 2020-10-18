import React from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';

const SEQUENCE_DESCRIPTION_TRUNCATION_LENGTH = 750;

const styles = (theme: ThemeType): JssStyles => ({
  sequenceDescriptionHighlight: {
  },
});

const SequenceTooltip = ({ sequence, classes }: {
  sequence: SequencesPageFragment,
  classes: ClassesType,
}) => {
  const { ContentItemBody } = Components;
  
  const truncatedDescription = truncate(sequence.contents && sequence.contents.htmlHighlight, SEQUENCE_DESCRIPTION_TRUNCATION_LENGTH);
  
  return <div>
    { /*<div>Created <CalendarDate date={sequence.createdAt}/></div>*/ }
    { /* TODO: Show a date here. We can't use sequence.createdAt because it's often
      very mismatched with the dates of the posts; ideally we'd say something like
      "15 posts from Dec 2010-Feb 2011". */ }
    
    <ContentItemBody
      className={classes.sequenceDescriptionHighlight}
      dangerouslySetInnerHTML={{__html: truncatedDescription}}
      description={`sequence ${sequence._id}`}
    />
  </div>;
}

const SequenceTooltipComponent = registerComponent('SequenceTooltip', SequenceTooltip, {styles});

declare global {
  interface ComponentTypes {
    SequenceTooltip: typeof SequenceTooltipComponent
  }
}

