import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import LocalOfferOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/LocalOfferOutlined';
import type { SearchHitComponentProps } from './types';
import LWTooltip from "../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TagsSearchHit", (theme: ThemeType) => ({
  root: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    ...theme.typography.body2,
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500],
    marginRight: 12,
    marginLeft: 4
  },
  snippet: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    wordBreak: "break-word"
  }
}))

const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const TagsSearchHit = ({hit, clickAction, showIcon=false}: SearchHitComponentProps) => {
  const classes = useStyles(styles);
  const tag = hit as SearchTag;

  const showSnippet = hit._snippetResult?.body?.matchLevel !== "none"

  return <div className={classes.root}>
    {showIcon && <LWTooltip title="Wikitag">
      <LocalOfferOutlinedIcon className={classes.icon}/>
    </LWTooltip>}
    <Link to={tagGetUrl(tag)} onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <div className={classes.name}>
        {tag.name}
      </div>
      {showSnippet && <div className={classes.snippet}>
        <Snippet attribute="description" hit={tag} tagName="mark" />
      </div>}
    </Link>
  </div>
}

export default registerComponent("TagsSearchHit", TagsSearchHit, {styles});



