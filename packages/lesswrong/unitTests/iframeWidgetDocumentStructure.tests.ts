import escape from "lodash/escape";
import { extractAndReplaceIframeWidgets } from "@/server/editor/conversionUtils";
import { convertImagesInIframeWidgets } from "@/server/scripts/convertImagesToCloudinary";

const mockRawInsertMany = jest.fn();
const mockRawUpdateOne = jest.fn();
const mockWidgetsFind = jest.fn();
const mockImagesFindOne = jest.fn();

jest.mock("@/server/collections/iframeWidgetSrcdocs/collection", () => {
  const IframeWidgetSrcdocs = {
    collectionName: "IframeWidgetSrcdocs",
    rawInsertMany: (...args: unknown[]) => mockRawInsertMany(...args),
    rawUpdateOne: (...args: unknown[]) => mockRawUpdateOne(...args),
    find: (...args: unknown[]) => mockWidgetsFind(...args),
  };
  return {__esModule: true, IframeWidgetSrcdocs, default: IframeWidgetSrcdocs};
});

jest.mock("@/server/collections/images/collection", () => {
  const Images = {
    collectionName: "Images",
    findOne: (...args: unknown[]) => mockImagesFindOne(...args),
  };
  return {__esModule: true, Images, default: Images};
});

const documentWithImage = (imageUrl: string) => `<!DOCTYPE html><html lang="en"><head><title>Widget</title></head><body style="margin:0"><img src="${imageUrl}"></body></html>`;

describe("iframe widgets keep their document structure", () => {
  it("when extracted from a revision", async () => {
    const widgetDocument = documentWithImage("https://example.com/a.png");
    const revisionHtml = `<iframe data-lexical-iframe-widget="true" srcdoc="${escape(widgetDocument)}"></iframe>`;

    await extractAndReplaceIframeWidgets(revisionHtml, "revisionId");

    expect(mockRawInsertMany.mock.calls[0][0][0].html).toBe(widgetDocument);
  });

  it("when their images are mirrored", async () => {
    const mirroredUrl = "https://res.cloudinary.com/mirrored.png";
    mockWidgetsFind.mockReturnValue({
      fetch: async () => [{_id: "widgetId", html: documentWithImage("https://example.com/a.png")}],
    });
    mockImagesFindOne.mockResolvedValue({cdnHostedUrl: mirroredUrl});

    await convertImagesInIframeWidgets(
      `<div class="iframe-widget" data-iframe-widget-id="widgetId"></div>`,
      "postId",
      () => true,
    );

    expect(mockRawUpdateOne).toHaveBeenCalledWith(
      {_id: "widgetId"},
      {$set: {html: documentWithImage(mirroredUrl)}},
    );
  });
});
