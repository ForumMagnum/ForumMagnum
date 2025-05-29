import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { GUIDE_PATH_PAGES_MAPPING } from "@/lib/arbital/paths";
import { useLocation } from '@/lib/routeUtil';
import { useTagBySlug } from './useTag';
import { Link } from '@/lib/reactRouterWrapper';
import { TagLens } from '@/lib/arbital/useTagLenses';
import { useTagOrLens } from '../hooks/useTagOrLens';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import ForumIcon from "../common/ForumIcon";

const styles = defineStyles("PathInfo", (theme) => ({
  pathInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '16px',
    marginTop: 24,
  },
  pathNavigationBackButton: {
    display: 'flex',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    color: `${theme.palette.greyAlpha(.5)} !important`,
  },
  pathNavigationNextButton: {
    display: 'flex',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.panelBackground.darken15,
    borderRadius: theme.borderRadius.small,
    padding: '4px 8px 5px 8px',
    color: `${theme.palette.greyAlpha(.7)} !important`,
  },
  pathNavigationBackButtonIcon: {
    width: '16px',
    height: '16px',
    marginRight: '4px',
    marginTop: '3px',
  },
  pathNavigationNextButtonIcon: {
    width: '16px',
    height: '16px',
    marginLeft: '4px',
    marginTop: '3px',
  },
}));

function usePathInfo(tag: TagPageFragment|TagPageWithRevisionFragment|null, lens: TagLens|null) {
  const { query } = useLocation();

  if (!tag) {
    return undefined;
  }

  const pathId = query.pathId;
  const pathPages = pathId ? GUIDE_PATH_PAGES_MAPPING[pathId as keyof typeof GUIDE_PATH_PAGES_MAPPING] : undefined;

  if (!pathPages) {
    return undefined;
  }

  const tagSlugs = [tag.slug, ...tag.oldSlugs];
  const lensSlugs = lens ? [lens.slug, ...lens.oldSlugs] : [];
  const allSlugs = [...tagSlugs, ...lensSlugs];
  let currentPagePathIndex;
  for (let slug of allSlugs) {
    const index = pathPages.indexOf(slug);
    if (index >= 0) {
      currentPagePathIndex = index;
      break;
    }
  }

  if (currentPagePathIndex === undefined) {
    return undefined;
  }

  const nextPageId = currentPagePathIndex < pathPages.length - 1 ? pathPages[currentPagePathIndex + 1] : undefined;
  const previousPageId = currentPagePathIndex > 0 ? pathPages[currentPagePathIndex - 1] : undefined;
  const displayPageIndex = currentPagePathIndex + 1;
  const pathPageCount = pathPages.length;

  return { displayPageIndex, nextPageId, previousPageId, pathPageCount, pathId };
}

const PathInfo = ({tag, lens}: {
  tag: TagPageFragment
  lens: TagLens|null
}) => {
  const classes = useStyles(styles);
  const pathInfo = usePathInfo(tag, lens);

  const { tag: guideTag, lens: guideLens } = useTagOrLens(pathInfo?.pathId ?? '', 'TagBasicInfo', { skip: !pathInfo?.pathId });

  const guidePageName = guideTag?.name ?? guideLens?.title;
  
  if (!pathInfo) {
    return null;
  }

  return <div className={classes.pathInfo}>
    {/* 
      * We don't show a button if there's no previous page, since it's not obvious what should happen if the user clicks it.
      * One might be tempted to have it navigate back in history, but if the user got to this page by clicking "Back" from the next page in the path,
      * they'd be sent back to the next page instead of the page which started them on the path. Even that only makes sense in the context of the Bayes' Rule guide.
      */}
    {pathInfo.previousPageId && <Link
      className={classes.pathNavigationBackButton}
      to={tagGetUrl({slug: pathInfo.previousPageId}, {pathId: pathInfo.pathId})}
    >
      <ForumIcon icon="ArrowLeft" className={classes.pathNavigationBackButtonIcon} />
      Back
    </Link>}
    <span>
      {`You are reading `}
      <strong>{guidePageName}</strong>
      {`, page ${pathInfo.displayPageIndex} of ${pathInfo.pathPageCount}`}
    </span>
    {pathInfo.nextPageId && <Link
      className={classes.pathNavigationNextButton}
      to={tagGetUrl({slug: pathInfo.nextPageId}, {pathId: pathInfo.pathId})}
    >
      Continue
      <ForumIcon icon="ArrowRight" className={classes.pathNavigationNextButtonIcon} />
    </Link>}
  </div>
}

export default registerComponent('PathInfo', PathInfo);



