import React from 'react';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import InputLabel from '@/lib/vendor/@material-ui/core/src/InputLabel';
import { TooltipSpan } from '../common/FMTooltip';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('SubmitToFrontpageCheckbox', (theme: ThemeType) => ({
  submitToFrontpageWrapper: {
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      order:1
    }
  },
  submitToFrontpage: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      maxWidth: "none",
      justifyContent: "flex-end",
      paddingRight: 24,
    }
  },
  checkboxLabel: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 14,
    color: theme.palette.grey[680],
    verticalAlign: 'middle',
    lineHeight: '1.25em',
    marginTop: '3px',
    cursor: 'pointer'
  },
  checkbox: {
    padding: 6
  },
  tooltip: {
    '& ul': {
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 4,
      paddingLeft: 24,
    },
    '& p': {
      marginTop: 4,
      marginBottom: 4
    }
  },
  guidelines: {
    fontStyle: "italic"
  },
}));

const DefaultTooltip = () => {
  const classes = useStyles(styles);
  
  return <div className={classes.tooltip}>
    <p>LW moderators will consider this post for frontpage</p>
    <p className={classes.guidelines}>Things to aim for:</p>
    <ul>
      <li className={classes.guidelines}>
        Usefulness, novelty and fun
      </li>
      <li className={classes.guidelines}>
        Timeless content (minimize reference to current events)
      </li>
      <li className={classes.guidelines}>
        Explain rather than persuade
      </li>
    </ul>
  </div>
}

export const SubmitToFrontpageCheckbox = ({ field, label, tooltip }: {
  field: TypedFieldApi<boolean | null | undefined>;
  label?: string;
  tooltip?: string;
}) => {
  const classes = useStyles(styles);

  const handleClick = () => {
    field.handleChange(!field.state.value);
  };

  const displayedTooltip = tooltip
    ? <>{tooltip}</>
    : <DefaultTooltip/>
  const displayedLabel = label ?? 'Moderators may promote to Frontpage';

  return <div className={classes.submitToFrontpageWrapper}>
    <TooltipSpan title={displayedTooltip}>
      <div className={classes.submitToFrontpage}>
        <InputLabel className={classes.checkboxLabel}>
          <Checkbox checked={!!field.state.value} onClick={handleClick} className={classes.checkbox} />
          {displayedLabel}
        </InputLabel>
      </div>
    </TooltipSpan>
  </div>
};
