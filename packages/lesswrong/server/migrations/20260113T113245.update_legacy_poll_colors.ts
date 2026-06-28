// Update legacy poll colors to the new color scheme.
// NOTE: The naming is confusing but intentional for backwards compatibility.
// darkColor is used as the background (now light colors), lightColor is used as foreground (now dark colors).

const OLD_TO_NEW_COLOR_MAP: Record<string, { darkColor: string; lightColor: string; bannerTextColor: string }> = {
  // Old deep blue -> new blue (light bg in darkColor, dark fg in lightColor)
  '#06005C': { darkColor: '#eef5f6', lightColor: '#004a83', bannerTextColor: '#004a83' },
  // Old dark green -> new green
  '#1D2A17': { darkColor: '#eef6f0', lightColor: '#007311', bannerTextColor: '#007311' },
  // Old brown/orange -> new orange
  '#7B3402': { darkColor: '#fef2ee', lightColor: '#d94300', bannerTextColor: '#d94300' },
  // Old beige/cream -> new gray
  '#F3F3E1': { darkColor: '#f5f5f5', lightColor: '#000000', bannerTextColor: '#000000' },
};

export const up = async ({db}: MigrationContext) => {
  for (const [oldDarkColor, newColors] of Object.entries(OLD_TO_NEW_COLOR_MAP)) {
    await db.none(`
      UPDATE "ForumEvents"
      SET
        "darkColor" = $2,
        "lightColor" = $3,
        "bannerTextColor" = $4
      WHERE UPPER("darkColor") = $1
    `, [oldDarkColor.toUpperCase(), newColors.darkColor, newColors.lightColor, newColors.bannerTextColor]);
  }
}

export const down = async ({db}: MigrationContext) => {
  // Reverse the mapping
  for (const [oldDarkColor, newColors] of Object.entries(OLD_TO_NEW_COLOR_MAP)) {
    await db.none(`
      UPDATE "ForumEvents"
      SET
        "darkColor" = $1,
        "lightColor" = $2,
        "bannerTextColor" = $3
      WHERE "darkColor" = $4
    `, [oldDarkColor, '#ffffff', '#ffffff', newColors.darkColor]);
  }
}
