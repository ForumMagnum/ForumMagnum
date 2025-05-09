import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import React, { useState } from "react";

const styles = (theme: ThemeType) => ({
  paper: {
    overflow: "visible",
  },
  datePickers: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: "8px",
    padding: '24px 24px 16px 24px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    }
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 24px 12px 24px',
    gap: "8px",
  }
});

const DateRangeModal = ({
  onClose,
  startDate,
  endDate,
  updateDisplayDates,
  classes,
}: {
  onClose?: () => void;
  startDate: Date | null;
  endDate: Date;
  updateDisplayDates: (startDate: Date | null, endDate: Date) => void;
  classes: ClassesType<typeof styles>;
}) => {
  const { LWDialog, DatePicker, EAButton } = Components;

  const [startDateInternal, setStartDateInternal] = useState<Date | null>(startDate);
  const [endDateInternal, setEndDateInternal] = useState<Date>(endDate);

  const onConfirm = () => {
    updateDisplayDates(startDateInternal, endDateInternal);
    onClose?.();
  };

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      paperClassName={classes.paper}
    >
      <div className={classes.datePickers}>
        <DatePicker label="Start date" value={startDateInternal ?? undefined} onChange={setStartDateInternal} />
        <DatePicker label="End date" value={endDateInternal} onChange={setEndDateInternal} />
      </div>
      <div className={classes.buttons}>
        <EAButton
          id="date-range-modal-cancel-btn"
          style="grey"
          onClick={onClose}
        >
          Cancel
        </EAButton>
        <EAButton
          type="submit"
          id="date-range-modal-submit-btn"
          onClick={onConfirm}
        >
          Confirm
        </EAButton>
      </div>
    </LWDialog>
  );
};

const DateRangeModalComponent = registerComponent("DateRangeModal", DateRangeModal, { styles });

declare global {
  interface ComponentTypes {
    DateRangeModal: typeof DateRangeModalComponent;
  }
}
