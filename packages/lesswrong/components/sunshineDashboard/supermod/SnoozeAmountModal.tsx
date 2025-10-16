import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWDialog from "@/components/common/LWDialog";
import { DialogTitle } from '@/components/widgets/DialogTitle';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogActions } from '@/components/widgets/DialogActions';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Input from '@/lib/vendor/@material-ui/core/src/Input';

const styles = defineStyles('SnoozeAmountModal', (theme: ThemeType) => ({
  content: {
    minWidth: 400,
  },
  input: {
    marginTop: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 8,
  },
  actions: {
    padding: 16,
  },
}));

const SnoozeAmountModal = ({
  onConfirm,
  onClose,
}: {
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const [amount, setAmount] = useState<string>('10');

  const handleConfirm = () => {
    const parsedAmount = parseInt(amount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onConfirm(parsedAmount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <LWDialog open onClose={onClose}>
      <DialogTitle>Snooze User</DialogTitle>
      <DialogContent className={classes.content}>
        <div className={classes.label}>
          Number of posts/comments before reappearing in queue:
        </div>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          type="number"
          fullWidth
          autoFocus
          placeholder="10"
          className={classes.input}
        />
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={!amount || isNaN(parseInt(amount, 10)) || parseInt(amount, 10) <= 0}
        >
          Snooze
        </Button>
      </DialogActions>
    </LWDialog>
  );
};

export default SnoozeAmountModal;
