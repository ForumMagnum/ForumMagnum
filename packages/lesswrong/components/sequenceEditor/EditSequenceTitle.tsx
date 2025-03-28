import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import PropTypes from 'prop-types'
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { sequencesImageScrim } from '../sequences/SequencesPage'
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: 65,
    backgroundColor: theme.palette.panelBackground.darken25,
    height: 380,
    [theme.breakpoints.down('sm')]: {
      marginTop: 40,
    }
  },
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 0,
    
    '@media (max-width: 702px)': {
      left: 0,
      width: "100%",
    }
  },
  inputBackground: {
    position: 'relative',
    left: -308,
    width: 702,
    backgroundColor: theme.palette.background.default,
    padding: 32,
    borderRadius: `${theme.borderRadius.default}px ${theme.borderRadius.default}px 0 0`,
    zIndex: theme.zIndexes.editSequenceTitleInput,
    [theme.breakpoints.down('sm')]: {
      left: -348,
    },
    '@media (max-width: 702px)': {
      left: 'auto',
      width: 'auto',
      padding: '20px 8px',
    }
  },
  imageScrim: {
    ...sequencesImageScrim(theme)
  },
  input: {
    width: '100%',
    fontSize: isFriendlyUI ? '2.4rem' : 36,
    fontWeight: isFriendlyUI ? 600 : 400,
    ...theme.typography.smallCaps,
    height: '1em',
    '&::placeholder': {
      color: theme.palette.text.sequenceTitlePlaceholder,
    },
    [theme.breakpoints.down('sm')]: {
      left: 5,
    }
  }
});

const EditSequenceTitle = ({value, path, placeholder, updateCurrentValues, classes}: FormComponentProps<string> & {
  classes: ClassesType<typeof styles>;
}) => {
  return <div className={classes.root}>
    <div className={classes.imageScrim}/>
    <div className={classes.wrapper}>
      <div className={classes.inputBackground}>
        <Input
          className={classes.input}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            void updateCurrentValues({
              [path]: event.target.value
            })
          }}
          disableUnderline
        />
      </div>
    </div>
  </div>
}

const EditSequenceTitleComponent = registerComponent("EditSequenceTitle", EditSequenceTitle, {styles});

declare global {
  interface ComponentTypes {
    EditSequenceTitle: typeof EditSequenceTitleComponent
  }
}
