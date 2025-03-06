import React, { Component, FC } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';
import InputLabel from '@material-ui/core/InputLabel';

const styles = (theme: ThemeType) => ({
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
});

const defaultTooltipLWAF = ({classes}: {classes: ClassesType<typeof styles>}) => <div className={classes.tooltip}>
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

const forumDefaultTooltip: ForumOptions<FC<{classes?: ClassesType<typeof styles>}>> = {
  LessWrong: defaultTooltipLWAF,
  AlignmentForum: defaultTooltipLWAF,
  EAForum: defaultTooltipEAF,
  default: defaultTooltipEAF,
}

const defaultTooltip = forumSelect(forumDefaultTooltip)

export interface SubmitToFrontpageCheckboxProps extends WithStylesProps {
  fieldName?: string,
  currentValues: any,
  document: any,
  label: any,
  tooltip: any,
}

class SubmitToFrontpageCheckbox extends Component<SubmitToFrontpageCheckboxProps> {
  declare context: AnyBecauseTodo

  handleClick = () => {
    const { fieldName = "submitToFrontpage" } = this.props
    const { updateCurrentValues } = this.context
    updateCurrentValues({[fieldName]: !this.getCurrentValue()})
  }
  
  getCurrentValue = () => {
    const { currentValues, document, fieldName = "submitToFrontpage" } = this.props
    let value = true
    if (fieldName in currentValues) {
      value = currentValues[fieldName]
    } else if (fieldName in document) {
      value = document[fieldName]
    }
    return value
  }

  render() {
    const defaultLabel = forumSelect({
      EAForum:'This post may appear on the Frontpage',
      default: 'Moderators may promote to Frontpage'
    })
    const { classes, label = defaultLabel, tooltip } = this.props

    const displayedTooltip = tooltip || defaultTooltip({classes})

    return <div className={classes.submitToFrontpageWrapper}>
      <Tooltip title={displayedTooltip}>
        <div className={classes.submitToFrontpage}>
          <InputLabel className={classes.checkboxLabel}>
            <Checkbox checked={this.getCurrentValue()} onClick={this.handleClick} className={classes.checkbox} />
            {label}
          </InputLabel>
        </div>
      </Tooltip>
    </div>
  }
};

(SubmitToFrontpageCheckbox as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
}


const SubmitToFrontpageCheckboxComponent = registerComponent('SubmitToFrontpageCheckbox', SubmitToFrontpageCheckbox, {styles});

declare global {
  interface ComponentTypes {
    SubmitToFrontpageCheckbox: typeof SubmitToFrontpageCheckboxComponent
  }
}

export default SubmitToFrontpageCheckboxComponent;
