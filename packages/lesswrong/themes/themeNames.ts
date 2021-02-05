
export type ThemeName = "default"|"dark"|"comicsans"|"longlines"|"terminal"

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
  {
    name: "comicsans",
    label: "Comic Sans"
  },
  {
    name: "longlines",
    label: "Extra Long Lines"
  },
  {
    name: "terminal",
    label: "VT100 Mode"
  },
]

export function isValidThemeName(name: string): name is ThemeName {
  for (let theme of themeMetadata) {
    if (theme.name === name)
      return true;
  }
  return false;
}
