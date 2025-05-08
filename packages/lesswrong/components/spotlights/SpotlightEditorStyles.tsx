import React, { ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { descriptionStyles } from './SpotlightItem';

const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.up('md')]: {
      '& .form-section-default > div': {
        display: "flex",
        flexWrap: "wrap",
      },
      '& .input-description': {
        width: "100%",
        ...descriptionStyles(theme),
      },
      '& .input-spotlightImageId, & .input-darkImageId, & .input-spotlightSplashImageUrl': {
        width: "50%"
      },
      '& .input-documentId, & .input-documentType, & .input-position, & .input-draft, & .input-duration, & .input-customTitle, & .input-customSubtitle, & .input-draft, & .input-imageFade, & .input-headerTitle, & .input-headerTitleLeftColor, & .input-headerTitleRightColor, & .input-showAuthor, & .input-subtitleUrl': {
        width: "calc(25% - 12px)",
        overflow: "hidden",
        marginRight: 12
      },
      '& .input-lastPromotedAt': {
        width: "calc(25% - 12px)",
        marginRight: 12
      },
      '& .form-submit': {
        display: "flex",
        justifyContent: "flex-end"
      }
    }
  }
});

export const SpotlightEditorStylesInner = ({classes, children}: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
}) => {
  return <div className={classes.root}>
    {children}
  </div>;
}

export const SpotlightEditorStyles = registerComponent('SpotlightEditorStyles', SpotlightEditorStylesInner, {styles});

declare global {
  interface ComponentTypes {
    SpotlightEditorStyles: typeof SpotlightEditorStyles
  }
}
