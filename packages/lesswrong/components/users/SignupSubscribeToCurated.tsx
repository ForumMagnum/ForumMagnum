import React, { useState } from 'react';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import Info from '@/lib/vendor/@material-ui/icons/src/Info';
import { isLWorAF, forumHeaderTitleSetting } from '../../lib/instanceSettings';
import InputLabel from '@/lib/vendor/@material-ui/core/src/InputLabel';
import { TooltipSpan } from '../common/FMTooltip';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SignupSubscribeToCurated', (theme: ThemeType) => ({
  checkboxLabel: {
    ...theme.typography.body2,
    marginBottom: 10,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    marginTop: 4,
    cursor: 'pointer'
  },
  checkbox: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingRight: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
    verticalAlign: "middle",
    color: theme.palette.icon.dim2,
    marginLeft: 6,
  },
}));

interface SignupSubscribeToCuratedProps {
  defaultValue: boolean
  onChange: (checked: boolean) => void
  includeAiDigest?: boolean
}

const SignupSubscribeToCurated = ({
  defaultValue,
  onChange,
  includeAiDigest = false,
}: SignupSubscribeToCuratedProps) => {
  const classes = useStyles(styles);
  const [checked, setChecked] = useState(defaultValue);

  // this component is not used in the EA Forum signup flow,
  // but it does appear on the EA Forum via RecentDiscussionSubscribeReminder.tsx
  const emailType = includeAiDigest
    ? 'Curated and Content for You emails'
    : isLWorAF()
      ? 'Curated posts'
      : `the ${forumHeaderTitleSetting.get()} weekly digest email`;
  const tooltip = includeAiDigest
    ? "Curated emails feature posts chosen by the LessWrong moderation team. Content for You is a weekly AI-personalized digest."
    : "Emails 2-3 times per week with the best posts, chosen by the LessWrong moderation team.";

  return <div>
    <InputLabel className={classes.checkboxLabel}>
      <Checkbox
        checked={checked}
        className={classes.checkbox}
        onChange={(_ev, newChecked) => {
          setChecked(newChecked)
          onChange(newChecked)
        }}
      />
      Subscribe to {emailType}
      {isLWorAF() && (
        <TooltipSpan title={tooltip}>
          <Info className={classes.infoIcon}/>
        </TooltipSpan>
      )}
    </InputLabel>
  </div>
}

export default SignupSubscribeToCurated


