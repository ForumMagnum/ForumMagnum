import { getProfileSequencesLoadMoreProps } from "../../../app/users/[slug]/ProfilePageSequencesTab";

describe("profile page sequences tab", () => {
  it("shows load more when user sequence count exceeds loaded sequences even if the query hid it", () => {
    const props = getProfileSequencesLoadMoreProps({
      loadedCount: 8,
      userSequenceCount: 12,
      hidden: true,
    });

    expect(props).toMatchObject({
      totalCount: 12,
      hidden: false,
    });
  });

  it("hides load more once the loaded sequence count reaches the known total", () => {
    const props = getProfileSequencesLoadMoreProps({
      loadedCount: 12,
      userSequenceCount: 12,
      queryTotalCount: 12,
      hidden: false,
    });

    expect(props).toMatchObject({
      totalCount: 12,
      hidden: true,
    });
  });

  it("falls back to the query total when it exceeds the denormalized user count", () => {
    const props = getProfileSequencesLoadMoreProps({
      loadedCount: 8,
      userSequenceCount: 7,
      queryTotalCount: 9,
      hidden: true,
    });

    expect(props).toMatchObject({
      totalCount: 9,
      hidden: false,
    });
  });
});
