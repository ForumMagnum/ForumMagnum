import { NextRequest, NextResponse } from "next/server";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import {
  ImageUploadError,
  uploadToCloudinary,
} from "@/components/lexical/utils/cloudinaryUpload";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { authorizeAgentDraftAccess } from "../editorAgentUtil";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { uploadImageMetadataSchema } from "../toolSchemas";

// Vercel rejects function request bodies above 4.5MB before they reach the
// route. Leave room for multipart headers instead of advertising the editor's
// larger direct-to-Cloudinary limit.
export const MAX_AGENT_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024;

interface ImageFileValidationResult {
  valid: boolean
  error?: string
}

export function validateAgentImageFile(file: FormDataEntryValue | null): ImageFileValidationResult {
  if (!(file instanceof Blob)) {
    return { valid: false, error: "The multipart form must include an image in the 'file' field." };
  }
  if (file.size === 0) {
    return { valid: false, error: "The uploaded image is empty." };
  }
  if (file.size > MAX_AGENT_IMAGE_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Image is too large (${sizeMB}MB). Maximum size is 4MB.` };
  }
  if (!file.type.toLowerCase().startsWith("image/")) {
    return { valid: false, error: "The uploaded file must have an image MIME type." };
  }
  return { valid: true };
}

function optionalFormString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function POST(req: NextRequest) {
  const context = await getContextFromReqAndRes({ req, isSSR: false });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    captureAgentApiEvent({
      route: "uploadImage",
      userId: context.currentUser?._id,
      status: "validation_error",
    });
    return NextResponse.json(
      { error: "Expected a multipart/form-data request." },
      { status: 400 },
    );
  }

  const metadataResult = uploadImageMetadataSchema.safeParse({
    postId: optionalFormString(formData.get("postId")),
    key: optionalFormString(formData.get("key")),
    agentName: optionalFormString(formData.get("agentName")),
  });
  if (!metadataResult.success) {
    captureAgentApiEvent({
      route: "uploadImage",
      postId: optionalFormString(formData.get("postId")),
      userId: context.currentUser?._id,
      agentName: optionalFormString(formData.get("agentName")),
      status: "validation_error",
    });
    return NextResponse.json(
      { error: "Invalid request metadata", details: metadataResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName } = metadataResult.data;
  const file = formData.get("file");
  const fileValidation = validateAgentImageFile(file);
  if (!fileValidation.valid || !(file instanceof Blob)) {
    captureAgentApiEvent({
      route: "uploadImage",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status: "validation_error",
    });
    return NextResponse.json(
      { error: fileValidation.error ?? "Invalid image file." },
      { status: 400 },
    );
  }

  try {
    const auth = await authorizeAgentDraftAccess({
      route: "uploadImage",
      postId,
      context,
      linkSharingKey: key,
      agentName,
    });
    if ("errorResponse" in auth) return auth.errorResponse;

    const result = await uploadToCloudinary(file, context.forumType);
    captureAgentApiEvent({
      route: "uploadImage",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status: "success",
      operationResult: "uploaded",
    });
    return NextResponse.json({
      ok: true,
      postId,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("uploadImage", error, {
      postId,
      userId: context.currentUser?._id,
      agentName,
    });
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof ImageUploadError && error.isUserFacing
          ? error.message
          : "Unknown error",
      },
      { status: 502 },
    );
  }
}
