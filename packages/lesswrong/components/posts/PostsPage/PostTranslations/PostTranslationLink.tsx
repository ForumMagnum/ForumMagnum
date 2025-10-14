import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';


export interface PostTranslationLinkData {
  url: string;
  title: string;
  language: string;
}

const styles = (theme: ThemeType) => ({
  root: {    
    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.7rem",
    fontWeight: theme.isFriendlyUI ? 600 : undefined,
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.typography.postStyle.fontFamily,
    zIndex: theme.zIndexes.postItemTitle,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 2,
    },
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    alignItems: "center",
    ...theme.typography.postsItemTitle,
    [theme.breakpoints.down('xs')]: {
      whiteSpace: "unset",
      lineHeight: "1.8rem",
    },
    marginRight: theme.spacing.unit,  
  },
  language: { 
    fontFamily: theme.typography.code.fontFamily,
    fontVariant: "small-caps",
    marginRight: theme.spacing.unit
  }
});

const PostTranslationLink = ({classes, data: {url, title, language}}: {
  classes: ClassesType<typeof styles>,
  data: PostTranslationLinkData
}) => {
  return  (
    <div className={classes.root} >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <span className={classes.language}>{language}</span>{title} 
      </a>
    </div>
  );
};

export default registerComponent("PostTranslationLink", PostTranslationLink, { styles });



