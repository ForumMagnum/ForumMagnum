import React, { FC } from 'react';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';
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
      paddingRight: theme.spacing.unit*3,
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
      marginTop: theme.spacing.unit/2,
      paddingLeft: theme.spacing.unit*3,
    },
    '& p': {
      marginTop: theme.spacing.unit/2,
      marginBottom: theme.spacing.unit/2
    }
  },
  guidelines: {
    fontStyle: "italic"
  },
}));

const defaultTooltipLWAF = ({classes}: {classes: ClassesType<typeof styles['styles']>}) => <div className={classes.tooltip}>
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

const defaultTooltipEAF = () =>
  <>
    Uncheck this box if you don't want your post to show in the Frontpage list. It will still appear in Recent discussion, Topics pages, and All posts.
  </>

const forumDefaultTooltip: ForumOptions<FC<{classes?: ClassesType<typeof styles['styles']>}>> = {
  LessWrong: defaultTooltipLWAF,
  AlignmentForum: defaultTooltipLWAF,
  EAForum: defaultTooltipEAF,
  default: defaultTooltipEAF,
}

const defaultTooltip = forumSelect(forumDefaultTooltip);

export const SubmitToFrontpageCheckbox = ({ field, label, tooltip }: {
  field: TypedFieldApi<boolean>;
  label?: string;
  tooltip?: string;
}) => {
  const classes = useStyles(styles);

  const handleClick = () => {
    field.handleChange(!field.state.value);
  };

  const defaultLabel = forumSelect({
    EAForum: 'This post may appear on the Frontpage',
    default: 'Moderators may promote to Frontpage'
  });

  const displayedTooltip = tooltip ?? defaultTooltip({classes});
  const displayedLabel = label ?? defaultLabel;

  return <div className={classes.submitToFrontpageWrapper}>
    <TooltipSpan title={displayedTooltip}>
      <div className={classes.submitToFrontpage}>
        <InputLabel className={classes.checkboxLabel}>
          <Checkbox checked={field.state.value} onClick={handleClick} className={classes.checkbox} />
          {displayedLabel}
        </InputLabel>
      </div>
    </TooltipSpan>
  </div>
};


const SubmitToFrontpageCheckboxComponent = registerComponent('SubmitToFrontpageCheckbox', SubmitToFrontpageCheckbox);

declare global {
  interface ComponentTypes {
    SubmitToFrontpageCheckbox: typeof SubmitToFrontpageCheckboxComponent
  }
}
