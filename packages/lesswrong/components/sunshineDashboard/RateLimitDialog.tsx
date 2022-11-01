import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Input from '@material-ui/core/Input';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  daysInput: {
    marginLeft: 'auto',
    width: 'fit-content'
  }
});

export const RateLimitDialog = ({ createRateLimit, onClose, classes }: {
  createRateLimit: (endDate?: Date) => Promise<void>,
  onClose: () => void,
  classes: ClassesType,
}) => {
  const { LWDialog } = Components;

  const [endAfterDays, setEndAfterDays] = useState<number | undefined>(30);

  const changeEndAfterDays = (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = ev.target.value;
    if (!newValue.length) {
      setEndAfterDays(undefined);
    } else {
      const days = parseInt(ev.target.value);
      setEndAfterDays(days);  
    }
  };

  const applyRateLimit = async () => {
    if (endAfterDays === undefined) {
      await createRateLimit();
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + endAfterDays);
      await createRateLimit(endDate);
    }
    onClose();
  };

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>
        Rate limit this user?
      </DialogTitle>
      <DialogContent>
        Delete the "days" value to set a rate limit with no fixed end date.
        <br />
        <div className={classes.daysInput}>
          <Input
            type='number'
            value={endAfterDays}
            onChange={changeEndAfterDays}
          />
          days.
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={applyRateLimit}>
          Create Rate Limit
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </LWDialog>
  );
}

const RateLimitDialogComponent = registerComponent('RateLimitDialog', RateLimitDialog, {styles});

declare global {
  interface ComponentTypes {
    RateLimitDialog: typeof RateLimitDialogComponent
  }
}

