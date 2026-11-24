import React, { ReactNode, useContext } from 'react';
import classNames from 'classnames';
import { curatedUrl } from '../recommendations/constants';
import { Link } from '../../lib/reactRouterWrapper';
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { PostIndicator, PostIndicatorHighlightContext, usePostIndicators } from './postIndicators';

const styles = defineStyles("PostsItemIcons", (theme: ThemeType) => ({
  iconSet: {
    marginLeft: 8,
    marginRight: 8,
    lineHeight: "1.0rem",
    cursor: "default",
    '&:empty': {
      display: 'none',
    },
  },
  postIcon: {
    marginRight: 4,
  },
  icon: {
    "--icon-size": "15.6px",
    color: theme.palette.icon.dim4,
    position: "relative",
    top: 3,
  },
  dialogueIcon: {
  },
}));

const IndicatorIcon = ({indicator, children}: {
  indicator: PostIndicator,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const { setHighlightedIndicator } = useContext(PostIndicatorHighlightContext);

  return <span
    className={classes.postIcon}
    onMouseEnter={() => setHighlightedIndicator(indicator)}
    onMouseLeave={() => setHighlightedIndicator(null)}
  >
    {children}
  </span>
}

export const CuratedIcon = ({hasColor}: {
  hasColor?: boolean,
}) => {
  const classes = useStyles(styles);
  return <IndicatorIcon indicator="curated">
    <Link to={curatedUrl}>
      <ForumIcon icon="Star" className={classes.icon}/>
    </Link>
  </IndicatorIcon>
}

export const PostsItemIcons = ({post, hideCuratedIcon}: {
  post: PostsBase,
  hideCuratedIcon?: boolean,
}) => {
  const classes = useStyles(styles);
  const indicators = usePostIndicators(post);

  return <span className={classes.iconSet}>
    {indicators.curated && !hideCuratedIcon && <CuratedIcon/>}

    {(post.debate || post.collabEditorDialogue) && <span className={classes.postIcon}>
      <LWTooltip title="Dialogue" placement="right">
        <ForumIcon
          icon={"ChatBubbleLeftRightFilled"}
          className={classNames(classes.icon, classes.dialogueIcon)}
        />
      </LWTooltip>
    </span>}

    {indicators.recommended && <IndicatorIcon indicator="recommended">
      <ForumIcon icon="Sparkle" className={classes.icon} />
    </IndicatorIcon>}
  </span>
}
