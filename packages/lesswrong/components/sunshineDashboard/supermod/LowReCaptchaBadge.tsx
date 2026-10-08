import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import { userHasLowReCaptchaRating } from '@/lib/collections/users/helpers';

const styles = defineStyles('LowReCaptchaBadge', (theme: ThemeType) => ({
  badge: {
    fontSize: 11,
    padding: '1px 5px',
    borderRadius: 3,
    border: `1px solid ${theme.palette.error.main}`,
    color: theme.palette.error.main,
    marginRight: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
}));

const LowReCaptchaBadge = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);

  if (!userHasLowReCaptchaRating(user)) {
    return null;
  }

  return (
    <LWTooltip title={`Signup reCAPTCHA rating ${user.signUpReCaptchaRating} (0 = likely bot, 1 = likely human). Low-rated users only appear in the inbox when they have content waiting for review.`}>
      <div className={classes.badge}>
        reCAPTCHA {user.signUpReCaptchaRating}
      </div>
    </LWTooltip>
  );
};

export default LowReCaptchaBadge;
