export function isIfAnyoneBuildsItFrontPage(styles: any) {
  return {
    '.ifAnyoneBuildsItPage &': {
      '@media (min-width: 960px)': styles
    }
  };
}
