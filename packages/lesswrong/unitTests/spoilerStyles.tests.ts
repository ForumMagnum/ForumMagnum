import { getForumTheme } from "@/themes/forumTheme";
import { postBodyStyles } from "@/themes/stylePiping";

describe("spoiler styles", () => {
  it("hide blockquote text until the spoiler is revealed", () => {
    const theme = getForumTheme({ name: "default", siteThemeOverride: {} }, "LessWrong");
    const hiddenSpoilerStyles = postBodyStyles(theme)["& .spoiler"]["&:not(:hover)"];

    expect(hiddenSpoilerStyles["& blockquote"]).toEqual({
      color: theme.palette.panelBackground.spoilerBlock,
    });
  });
});
