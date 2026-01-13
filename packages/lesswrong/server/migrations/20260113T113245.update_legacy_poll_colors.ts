// Update legacy poll colors to the new color scheme
const OLD_TO_NEW_COLOR_MAP: Record<string, { darkColor: string; lightColor: string; bannerTextColor: string }> = {
  // Old deep blue -> new blue
  '#06005C': { darkColor: '#004a83', lightColor: '#eef5f6', bannerTextColor: '#004a83' },
  // Old dark green -> new green
  '#1D2A17': { darkColor: '#007311', lightColor: '#eef6f0', bannerTextColor: '#007311' },
  // Old brown/orange -> new orange
  '#7B3402': { darkColor: '#d94300', lightColor: '#fef2ee', bannerTextColor: '#d94300' },
  // Old beige/cream -> new gray
  '#F3F3E1': { darkColor: '#000000', lightColor: '#f5f5f5', bannerTextColor: '#000000' },
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
        "lightColor" = NULL,
        "bannerTextColor" = NULL
      WHERE "darkColor" = $2
    `, [oldDarkColor, newColors.darkColor]);
  }
}
