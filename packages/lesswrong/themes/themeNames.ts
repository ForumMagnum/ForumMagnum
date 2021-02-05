
export type ThemeName = "default"|"dark"

export type ThemeMetadata = {
  name: ThemeName
  label: string
}

export const themeMetadata: Array<ThemeMetadata> = [
  {
    name: "default",
    label: "Default"
  },
  {
    name: "dark",
    label: "Dark Mode"
  },
]

export function isValidThemeName(name: string): name is ThemeName {
  for (let theme of themeMetadata) {
    if (theme.name === name)
      return true;
  }
  return false;
}
