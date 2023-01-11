import React, { useEffect, useRef } from "react";
import { subforumSlugsSetting, useLocation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLayoutOptions } from "../hooks/useLayoutOptions";
import { useSetTheme, useTheme, useThemeOptions } from "../themes/useTheme";
import { useTagBySlug } from "./useTag";

const TagPageRouter = () => {
  const { query, params: { slug } } = useLocation();
  const [layoutOptions, setLayoutOptions] = useLayoutOptions();

  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? undefined;
  const contributorsLimit = 7;

  const isSubforum = subforumSlugsSetting.get().includes(slug);

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
  
  if (tag.isSubforum !== layoutOptions.unspacedGridLayout) {
    setLayoutOptions({unspacedGridLayout: isSubforum})
  }

  const {TagPage, TagSubforumPage2} = Components
  return isSubforum ? <TagSubforumPage2/> : <TagPage/>
}

const TagPageRouterComponent = registerComponent("TagPageRouter", TagPageRouter);

declare global {
  interface ComponentTypes {
    TagPageRouter: typeof TagPageRouterComponent
  }
}
