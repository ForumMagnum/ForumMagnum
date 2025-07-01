import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FormGroupLayoutProps } from './FormGroupLayout';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { hasGoogleDocImportSetting } from '@/lib/instanceSettings';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isEAForum, isLW, isLWorAF } from '@/lib/instanceSettings';
import { QuestionIcon } from '../icons/questionIcon';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { Link } from "../../lib/reactRouterWrapper";
import LWTooltip from "../common/LWTooltip";
import EAButton from "../ea-forum/EAButton";
import ForumIcon from "../common/ForumIcon";
import GoogleDocImportButton from "../posts/GoogleDocImportButton";

// We want the buttons to go _above_ the tabs when the space gets too tight,
// which requires some special breakpoint logic (due to the how the central column
// both expands and contracts as you reduce the screen size):
// - Use the row layout above 1070px, and between 620px and the "md" breakpoint (around 950px)
// - Otherwise use the column layout, with the buttons above
const styles = defineStyles("FormGroupPostTopBar", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    borderBottom: theme.palette.border.normal,
    margin: '16px 16px',
    alignItems: 'center',
    flexDirection: "column",
    '& .form-input': {
      margin: 0,
    },
    [`@media (min-width: 1070px)`]: {
      flexDirection: "row",
    },
    [`@media (min-width: 620px) and (max-width: ${theme.breakpoints.values.md}px)`]: {
      flexDirection: "row",
    },
  },
  tabs: {
    order: 2,
    marginRight: 'auto',
    [`@media (min-width: 1070px)`]: {
      order: 1,
      flexBasis: 'auto',
    },
    [`@media (min-width: 620px) and (max-width: ${theme.breakpoints.values.md}px)`]: {
      order: 1,
      flexBasis: 'auto',
    },
  },
  otherChildren: {
    order: 1,
    marginLeft: 'auto',
    display: "flex",
    gap: "2px",
    [`@media (min-width: 1070px)`]: {
      order: 2,
      flexBasis: 'auto',
    },
    [`@media (min-width: 620px) and (max-width: ${theme.breakpoints.values.md}px)`]: {
      order: 2,
      flexBasis: 'auto',
    },
  },
  editorGuideOffset: {
  },
  editorGuideButton: {
    color: theme.palette.grey[900],
    backgroundColor: "transparent",
    padding: "2px 12px",
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  editorGuide: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingTop: 2,
    borderRadius: theme.borderRadius.default,
  },
  editorGuideIcon: {
    width: 16,
    height: 16,
    marginRight: 6
  },
  editorGuideLink: {}
}));

const LinkToEditorGuideButton = () => {
  const classes = useStyles(styles);
  const navigate = useNavigate();

  if (isLWorAF) {
    return (
      <LWTooltip title='The Editor Guide covers sharing drafts, co-authoring, crossposting, LaTeX, footnotes, internal linking, and more!'>
        <EAButton
          className={classes.editorGuideButton}
          onClick={() => {
            navigate(tagGetUrl({slug: "guide-to-the-lesswrong-editor"}))
          }}
        >
          <ForumIcon icon="QuestionMarkCircle" className={classes.editorGuideIcon} />
          Editor Guide
        </EAButton>
      </LWTooltip>
    );
  } else {
    return null;
  }
}

const FormGroupPostTopBar = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles(styles);
  const childrenArray = React.Children.toArray(children);
  const [tabs, ...otherChildren] = childrenArray;

  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  return (
    <div className={classes.root}>
      <div className={classes.tabs}>{tabs}</div>
      <div className={classes.otherChildren}>
        {hasGoogleDocImportSetting.get() && <GoogleDocImportButton postId={postId} version={version} />}
        <LinkToEditorGuideButton />
        {otherChildren}
      </div>
    </div>
  );
};

export default registerComponent('FormGroupPostTopBar', FormGroupPostTopBar);


