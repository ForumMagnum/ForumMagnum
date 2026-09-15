import {
  MAX_AGENT_IMAGE_FILE_SIZE_BYTES,
  validateAgentImageFile,
} from "../../../app/api/agent/uploadImage/route";

describe("agent image uploads", () => {
  it("accepts a non-empty image", () => {
    const image = new File(["image contents"], "image.png", { type: "image/png" });

    expect(validateAgentImageFile(image)).toEqual({ valid: true });
  });

  it("rejects missing, empty, non-image, and oversized files", () => {
    const emptyImage = new File([], "empty.png", { type: "image/png" });
    const textFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    const oversizedImage = new File(
      [new Uint8Array(MAX_AGENT_IMAGE_FILE_SIZE_BYTES + 1)],
      "large.png",
      { type: "image/png" },
    );

    expect(validateAgentImageFile(null)).toEqual({
      valid: false,
      error: "The multipart form must include an image in the 'file' field.",
    });
    expect(validateAgentImageFile(emptyImage)).toEqual({
      valid: false,
      error: "The uploaded image is empty.",
    });
    expect(validateAgentImageFile(textFile)).toEqual({
      valid: false,
      error: "The uploaded file must have an image MIME type.",
    });
    expect(validateAgentImageFile(oversizedImage)).toEqual({
      valid: false,
      error: "Image is too large (4.0MB). Maximum size is 4MB.",
    });
  });
});
