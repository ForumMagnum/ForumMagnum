import type { ForumTypeString } from "@/lib/instanceSettings";
import { cloudinaryCloudName, cloudinaryUploadPresetEditorName } from '@/lib/instanceSettings';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
// Cloudinary's limit for a single (non-chunked) upload request.
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

export function isVideoFile(payload: Blob): boolean {
  return payload.type.startsWith('video/');
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export class ImageUploadError extends Error {
  constructor(message: string, public readonly isUserFacing: boolean = true) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  if (!header.includes(';base64')) {
    return new Blob([decodeURIComponent(data)], { type: mime });
  }
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Upload a file to Cloudinary using unsigned upload.
 *
 * @param file - The file or blob to upload
 * @param forumType - The forum whose Cloudinary configuration to use
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @returns The Cloudinary upload result with secure_url, dimensions, etc.
 * Images and videos both go to Cloudinary's `auto` endpoint; videos have a
 * larger size limit.
 *
 * @throws ImageUploadError if upload fails or file is too large
 */
export async function uploadToCloudinary(
  file: File | Blob,
  forumType: ForumTypeString,
  options?: { signal?: AbortSignal }
): Promise<CloudinaryUploadResult> {
  const cloudName = cloudinaryCloudName;
  const uploadPreset = cloudinaryUploadPresetEditorName.get(forumType);

  if (!cloudName) {
    throw new ImageUploadError('Cloudinary cloud name is not configured', false);
  }
  if (!uploadPreset) {
    throw new ImageUploadError('Cloudinary upload preset is not configured', false);
  }

  const isVideo = isVideoFile(file);
  const fileKind = isVideo ? 'Video' : 'Image';
  const maxSizeBytes = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    throw new ImageUploadError(
      `${fileKind} is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`
    );
  }

  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    // eslint-disable-next-line no-console
    console.error('Cloudinary upload failed:', response.status, errorText);
    throw new ImageUploadError(`Failed to upload ${fileKind.toLowerCase()}. Please try again.`);
  }

  return response.json();
}
