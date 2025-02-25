import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { getDigestName } from '../../../lib/collections/digests/helpers';
import moment from 'moment';
import { useUpdate } from '../../../lib/crud/withUpdate';
import classNames from 'classnames';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: 20,
  },
  title: {
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
  },
  viewOnsiteDigestButton: {
    width: 200,
    color: theme.palette.grey[700],
    fontWeight: '600',
  },
  viewOnsiteDigestIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  onsiteDigestSettingsSection: {
    maxWidth: 396,
  },
  onsiteDigestSettingsHeading: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: '500',
    margin: 0,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  collapseChevron: {
    width: 15,
    transition: "transform 0.2s",
  },
  collapseChevronOpen: {
    transform: "rotate(90deg)",
  },
  onsiteDigestSettings: {
    padding: '0 6px 6px'
  },
  colorPickerRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    fontWeight: '500',
  },
  imageUploadRow: {
    maxWidth: 360,
    marginTop: 6
  },
});

export const EditDigestHeader = ({digest, classes}: {
  digest: DigestsMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  // clicking on the start or end date lets you edit it
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  // on-site digest settings section is collapsed by default
  const [isOnsiteSettingsExpanded, setIsOnsiteSettingsExpanded] = useState(false)
  
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
  
  const onChangeImg = (value: string|null) => {
    void updateDigest({
      selector: {_id: digest._id},
      data: {
        onsiteImageId: value,
      },
    });
  }
  
  const updateCurrentValues = async (data: AnyBecauseHard) => {
    void updateDigest({
      selector: {_id: digest._id},
      data
    });
  }

  const {EAButton, SectionTitle, DatePicker, ForumIcon, FormComponentColorPicker, ImageUpload2} = Components;

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

  return <div className={classes.root}>
    <SectionTitle
      title={<span className={classes.title}>
        {getDigestName(digest)} ({startNode} - {endNode})
      </span>}
      noTopMargin
    />
    <EAButton
      style="grey"
      href={`/digests/${digest.num}`}
      target="_blank"
      className={classes.viewOnsiteDigestButton}
    >
      View on-site digest
      <OpenInNewIcon className={classes.viewOnsiteDigestIcon} />
    </EAButton>
    <section className={classes.onsiteDigestSettingsSection}>
      <h2
        className={classes.onsiteDigestSettingsHeading}
        onClick={() => setIsOnsiteSettingsExpanded(!isOnsiteSettingsExpanded)}
      >
        <ForumIcon icon="ThickChevronRight" className={classNames(
          classes.collapseChevron, isOnsiteSettingsExpanded && classes.collapseChevronOpen
        )} />
        Edit on-site digest settings
      </h2>
      {isOnsiteSettingsExpanded && <div className={classes.onsiteDigestSettings}>
        <div className={classes.colorPickerRow}>
          <div className={classes.label}>Background fade color:</div>
          <FormComponentColorPicker
            value={digest.onsitePrimaryColor}
            updateCurrentValues={updateCurrentValues}
            path="onsitePrimaryColor"
          />
        </div>
        <div className={classes.imageUploadRow}>
          <ImageUpload2
            name="onsiteDigestImageId"
            value={digest.onsiteImageId}
            updateValue={onChangeImg}
            clearField={() => onChangeImg(null)}
            label="Set background image"
          />
        </div>
      </div>}
    </section>
    
  </div>
}

const EditDigestHeaderComponent = registerComponent('EditDigestHeader', EditDigestHeader, {styles});

declare global {
  interface ComponentTypes {
    EditDigestHeader: typeof EditDigestHeaderComponent
  }
}
