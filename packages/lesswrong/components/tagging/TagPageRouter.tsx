import React from "react";
import { useLocation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLayoutOptions } from "../hooks/useLayoutOptions";
import { useTagBySlug } from "./useTag";

/**
 * TODO
 */
const TagPageRouter = () => {
  const { query, params: { slug } } = useLocation();
  const [layoutOptions, setLayoutOptions] = useLayoutOptions();

  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? undefined;
  const contributorsLimit = 7;

  const { tag, loading: loadingTag } = useTagBySlug(slug, revision ? "TagPageWithRevisionFragment" : "TagPageFragment", {
    extraVariables: revision ? {
      version: 'String',
      contributorsLimit: 'Int',
    } : {
      contributorsLimit: 'Int',
    },
    extraVariablesValues: revision ? {
      version: revision,
      contributorsLimit,
    } : {
      contributorsLimit,
    },
  });

  if (!tag || loadingTag) return null;
  
  if (
    tag.isSubforum !== layoutOptions.unspacedGridLayout ||
    tag.isSubforum !== layoutOptions.standaloneNavigation ||
    tag.isSubforum !== layoutOptions.shouldUseGridLayout
  ) {
    setLayoutOptions({
      unspacedGridLayout: tag.isSubforum,
      standaloneNavigation: tag.isSubforum,
      shouldUseGridLayout: tag.isSubforum,
    });
  }

  const {TagPage, TagSubforumPage2} = Components
  return tag.isSubforum ? <TagSubforumPage2/> : <TagPage/>
}

const TagPageRouterComponent = registerComponent("TagPageRouter", TagPageRouter);

declare global {
  interface ComponentTypes {
    TagPageRouter: typeof TagPageRouterComponent
  }
}
