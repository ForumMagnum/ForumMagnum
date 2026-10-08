import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import LWDialog from "@/components/common/LWDialog";
import Button from '@/lib/vendor/@material-ui/core/src/Button';

const SNOOZE_CHOICES = [
  { amount: 1, key: 'a' },
  { amount: 3, key: 's' },
  { amount: 10, key: 'd' },
];
const SNOOZE_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function getSnoozeAmountForKey(key: string): number | undefined {
  if (SNOOZE_DIGITS.includes(key)) {
    return Number(key);
  }
  return SNOOZE_CHOICES.find(choice => choice.key === key.toLowerCase())?.amount;
}

const styles = defineStyles('SnoozeChoiceModal', (theme: ThemeType) => ({
  paper: {
    // Doubled `&` to beat Paper's elevation shadow and LWDialog's centering
    '&&': {
      boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.12)}`,
      background: theme.palette.grey[100],
      position: 'fixed',
      top: '67vh',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      margin: 0,
    },
  },
  content: {
    minWidth: 300,
    padding: '16px 20px 20px',
  },
  header: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
  },
  undoNote: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  choices: {
    display: 'flex',
    gap: 10,
  },
  choice: {
    flex: 1,
    fontSize: 18,
    minHeight: 56,
    lineHeight: 1.1,
    // Doubled `&` to beat Button's transparent background
    '&&': {
      background: theme.palette.background.paper,
    },
  },
  choiceLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  digitNote: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.grey[500],
    textAlign: 'center',
    marginTop: 10,
  },
  keyHint: {
    fontSize: 13,
    marginTop: 3,
    color: theme.palette.grey[500],
    textTransform: 'none',
  },
}));

const SnoozeChoiceModal = ({ onConfirm, onClose }: {
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);

  useGlobalKeydown(useCallback((event: KeyboardEvent) => {
    // Holding down the S that opened the picker would otherwise pick "s" too
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const amount = getSnoozeAmountForKey(event.key);
    if (amount !== undefined) {
      event.preventDefault();
      onConfirm(amount);
    }
  }, [onConfirm]));

  return (
    <LWDialog open onClose={onClose} backdrop="none" paperClassName={classes.paper}>
      <div className={classes.content}>
        <div className={classes.header}>
          <span className={classes.title}>Snooze User</span>
          <span className={classes.undoNote}>cmd-z to undo</span>
        </div>
        <div className={classes.choices}>
          {SNOOZE_CHOICES.map(({ amount, key }) => (
            <Button
              key={amount}
              className={classes.choice}
              variant="outlined"
              onClick={() => onConfirm(amount)}
            >
              <span className={classes.choiceLabel}>
                <span>{amount}</span>
                <span className={classes.keyHint}>{key}</span>
              </span>
            </Button>
          ))}
        </div>
        <div className={classes.digitNote}>or press any number 1–9 to snooze by that amount</div>
      </div>
    </LWDialog>
  );
};

export default SnoozeChoiceModal;
