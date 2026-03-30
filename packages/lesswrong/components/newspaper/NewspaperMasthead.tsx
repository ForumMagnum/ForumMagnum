import React from 'react';
import { getVolumeAndIssue, formatNewspaperDate } from './newspaperHelpers';
import { newspaperStyles } from './newspaperStyles';

const NewspaperMasthead = ({classes, displayDate}:{classes: ClassesType<typeof newspaperStyles>, displayDate: Date}) => {
  return <div className={classes.container}>
    <div className={classes.masthead}>
      <div className={classes.mastheadTitle}>
        The LessWrong Times
      </div>
      <div className={classes.mastheadSubtitle}>
        Curated stories matching your interests.
      </div>
    </div>
    <hr className={classes.mastheadRule} />
    <div className={classes.mastheadMeta}>
      <span>{getVolumeAndIssue(displayDate)}</span>
      <span>Founded 2009</span>
      <span>{formatNewspaperDate(displayDate)}</span>
    </div>
  </div>;
};

export default NewspaperMasthead;
