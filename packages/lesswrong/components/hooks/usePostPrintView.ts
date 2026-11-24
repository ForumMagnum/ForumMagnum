import { useEffect } from "react";
import qs from "qs";
import { postGetPageUrl, PostsMinimumForGetPageUrl } from "@/lib/collections/posts/helpers";
import { useNavigate, useSubscribedLocation } from "@/lib/routeUtil";

const PRINT_QUERY_PARAM = "print";

// Give images and math a moment to finish rendering after fonts are ready
const PRINT_DELAY_MS = 500;

/** The post page's print view, used by "Save as PDF"; see usePostPrintView. */
export const postGetPrintUrl = (post: PostsMinimumForGetPageUrl): string =>
  `${postGetPageUrl(post)}?${PRINT_QUERY_PARAM}=1`;

/**
 * Returns whether the post page was opened as a print view (`?print=1`), in
 * which case it should render only the post. Once the post has loaded, opens
 * the browser's print dialog (from which the post can be saved as a PDF), then
 * drops the query parameter so that reloads and shared links don't print again.
 */
export function usePostPrintView(postLoaded: boolean): boolean {
  const { query, location } = useSubscribedLocation();
  const navigate = useNavigate();
  const isPrintView = !!query[PRINT_QUERY_PARAM];
  const shouldPrint = isPrintView && postLoaded;

  useEffect(() => {
    if (!shouldPrint) return;
    const clearPrintQueryParam = () => {
      const search = qs.stringify({...query, [PRINT_QUERY_PARAM]: undefined});
      // An empty `search: "?"` would leave a bare "?" on the URL
      navigate({...location, search: search ? `?${search}` : ""}, {replace: true});
    };
    let cancelled = false;
    let timeout: number | undefined;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      timeout = window.setTimeout(() => {
        // Not every browser blocks in print(), so wait for the dialog to close
        window.addEventListener("afterprint", clearPrintQueryParam, {once: true});
        window.print();
      }, PRINT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [shouldPrint, query, location, navigate]);

  return isPrintView;
}
