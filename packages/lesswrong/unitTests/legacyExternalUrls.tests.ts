import { rewriteLegacyExternalUrl } from "@/lib/legacyExternalUrls";

describe("rewriteLegacyExternalUrl", () => {
  it("rewrites the retired Overcoming Bias host", () => {
    expect(
      rewriteLegacyExternalUrl("http://www.overcoming-bias.com/2007/12/lonely_dissent.html"),
    ).toBe("http://www.overcomingbias.com/2007/12/lonely_dissent.html");
    expect(
      rewriteLegacyExternalUrl("https://overcoming-bias.com/2008/01/circular_altruism.html?x=1#comments"),
    ).toBe("https://www.overcomingbias.com/2008/01/circular_altruism.html?x=1#comments");
  });

  it("rewrites protocol-relative URLs", () => {
    expect(
      rewriteLegacyExternalUrl("//www.overcoming-bias.com/2007/05/scope_insensitivity.html"),
    ).toBe("//www.overcomingbias.com/2007/05/scope_insensitivity.html");
  });

  it("leaves current and unrelated URLs unchanged", () => {
    expect(
      rewriteLegacyExternalUrl("https://www.overcomingbias.com/p/lonely-dissenthtml"),
    ).toBe("https://www.overcomingbias.com/p/lonely-dissenthtml");
    expect(
      rewriteLegacyExternalUrl("https://overcoming-bias.com.example.com/post"),
    ).toBe("https://overcoming-bias.com.example.com/post");
  });
});
