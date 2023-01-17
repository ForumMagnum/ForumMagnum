import React from "react";
import { useLocation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLayoutOptions } from "../hooks/useLayoutOptions";
import { useTagBySlug } from "./useTag";

const TagPageRouter = () => {
  const { query, params: { slug } } = useLocation();
  const [overridenLayoutOptions, setLayoutOptions] = useLayoutOptions();

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
    tag.isSubforum !== overridenLayoutOptions.unspacedGridLayout ||
    tag.isSubforum !== overridenLayoutOptions.standaloneNavigation ||
    tag.isSubforum !== overridenLayoutOptions.shouldUseGridLayout
  ) {
    // NOTE: There is an edge case here where if you navigate from one tag page to another, this component isn't
    // unmounted, so the overriden layout options aren't automatically cleared by the callback in useLayoutOptions.tsx.
    // So we have to explicitly clear them here.
    setLayoutOptions(tag.isSubforum ? {
      unspacedGridLayout: true,
      standaloneNavigation: true,
      shouldUseGridLayout: true,
    } : {});
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
