/**
 * While the If Anyone Builds It special theme was live, this expanded to
 *   ".ifAnyoneBuildsItPage &": {
 *     "@media (min-width: 960px)": styles
 *   }
 * which was also the criterion for showing a starfield background. Some of
 * those styles were interesting and worth merging into dark mode, so rather
 * than delete them all, we're just changing this to expand to nothing (ie,
 * the theme is never active, but you can search for isIfAnyoneBuildsItFrontPage
 * and rewrap it differently to put it in the regular dark theme.)
 *
 * Note, when unwrapping these styles: You probably want to gat them on isLW(),
 * and, importantly, you need to make sure they look good on both
 * gray-background pages like the front page and black-background pages like
 * post and tag pages. Post item changes, in particular, were gated to the front
 * page because they increased the contrast too much for black-background pages.
 */
export const isIfAnyoneBuildsItFrontPage = (styles: any): any => {
  return {};
}
