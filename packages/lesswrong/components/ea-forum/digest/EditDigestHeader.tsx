import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { getDigestName } from '../../../lib/collections/digests/helpers';
import moment from 'moment';
import { useUpdate } from '../../../lib/crud/withUpdate';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    gap: "4px",
  },
  date: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[800],
    },
  },
  datePicker: {
    transform: 'translateY(-12px)',
    zIndex: 2
  }
});

export const EditDigestHeader = ({digest, classes}: {
  digest: DigestsMinimumInfo,
  classes: ClassesType,
}) => {
  // clicking on the start or end date lets you edit it
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const {mutate: updateDigest} = useUpdate({
    collectionName: "Digests",
    fragmentName: "DigestsMinimumInfo",
  });

  const startFormatted = moment(digest.startDate).format('MMM D')
  const endFormatted = digest.endDate ? moment(digest.endDate).format('MMM D') : 'now'

  const onChangeDate = (field: "startDate"|"endDate", date?: Date) => {
    if (date) {
      void updateDigest({
        selector: {_id: digest._id},
        data: {
          [field]: date,
        },
      });
    }
  }

  const {SectionTitle, DatePicker} = Components;

  const startNode = isEditingStartDate
    ? (
      <div className={classes.datePicker}>
        <DatePicker
          label="Start date"
          value={new Date(digest.startDate)}
          onChange={onChangeDate.bind(null, "startDate")}
          onClose={(newDate: Date) => {
            setIsEditingStartDate(false)
          }}
          below
        />
      </div>
    )
    : (
      <span onClick={() => setIsEditingStartDate(true)} className={classes.date}>
        {startFormatted}
      </span>
    );

  const endNode = isEditingEndDate && digest.endDate
    ? (
      <div className={classes.datePicker}>
        <DatePicker
          label="End date"
          value={new Date(digest.endDate)}
          onChange={onChangeDate.bind(null, "endDate")}
          onClose={(newDate: Date) => {
            setIsEditingEndDate(false)
          }}
          below
        />
      </div>
    )
    : (
      <span
        onClick={() => setIsEditingEndDate(true)}
        className={classNames({[classes.date]: digest.endDate})}
      >
        {endFormatted}
      </span>
    );

  return <SectionTitle
    title={<span className={classes.root}>
      {getDigestName({digest, includeDates: false})} ({startNode} - {endNode})
    </span>}
    noTopMargin
  />
}

const EditDigestHeaderComponent = registerComponent('EditDigestHeader', EditDigestHeader, {styles});

declare global {
  interface ComponentTypes {
    EditDigestHeader: typeof EditDigestHeaderComponent
  }
}
