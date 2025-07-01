import React, { useCallback } from "react";
import { requireCssVar } from "../../themes/cssVars";
import {
  cloudinaryCloudNameSetting, cloudinaryUploadPresetBannerSetting, cloudinaryUploadPresetDigestSetting, cloudinaryUploadPresetEventImageSetting, cloudinaryUploadPresetGridImageSetting, cloudinaryUploadPresetProfileSetting, cloudinaryUploadPresetSocialPreviewSetting, cloudinaryUploadPresetSpotlightSetting
} from "../../lib/publicSettings";
import { useTheme } from "../themes/useTheme";
import { Helmet } from "../common/Helmet";

type CloudinaryImageUploadError = {
  statusText: string,
}

type CloundinaryImageUploadResult = {
  event: "success",
  info?: {
    public_id?: string,
  },
} | {
  event: string,
  info: Record<string, unknown>,
};

type CloudinaryImageUploadCallback = (
  error: CloudinaryImageUploadError|null,
  result: CloundinaryImageUploadResult|null,
) => void;

type CloudinaryImageUploadFont = {
  url: string,
  active: boolean,
}

type CloudinaryImageUploadFontConfig = Record<string, CloudinaryImageUploadFont|null>;

type CloudinaryImageUploadStyles = {
  palette?: Record<string, string>,
  fonts?: CloudinaryImageUploadFontConfig,
}

declare global {
  interface Window {
    /**
     * https://cloudinary.com/documentation/upload_widget_reference
     */
    cloudinary?: {
      openUploadWidget: (
        options: {
          cloudName: string,
          uploadPreset: string,
          multiple?: boolean,
          secure?: boolean,
          encryption?: {key: string, iv: string},
          sources?: string[],
          defaultSource?: string,
          maxFiles?: number,
          cropping?: boolean,
          croppingAspectRatio?: number,
          croppingDefaultSelectionRatio?: number,
          croppingValidateDimensions?: boolean,
          croppingShowDimensions?: boolean,
          croppingShowBackButton?: boolean,
          croppingCoordinatesMode?: "custom" | "face",
          showSkipCropButton?: boolean,
          publicId?: string,
          folder?: string,
          tags?: string[],
          resourceType?: string,
          context?: Record<string, string>,
          uploadSignature?: string | (() => string),
          uploadSignatureTimestamp?: number,
          clientAllowedFormats?: string[],
          maxFileSize?: number,
          maxImageFileSize?: number,
          maxVideoFileSize?: number,
          maxRawFileSize?: number,
          minImageWidth?: number,
          maxImageWidth?: number,
          minImageHeight?: number,
          maxImageHeight?: number,
          validateMaxWidthHeight?: boolean,
          maxChunkSize?: number,
          form?: string,
          fieldName?: string,
          thumbnails?: string,
          thumbnailTransformation?: string | Record<string, string | number>[],
          buttonClass?: string,
          buttonCaption?: string,
          theme?: string,
          text?: Record<string, string>,
          styles?: CloudinaryImageUploadStyles,
          showPoweredBy?: boolean,
          autoMinimize?: boolean,
        },
        resultCallback: CloudinaryImageUploadCallback,
      ) => void,
    },
  }
}

const cloudinaryArgsByImageType = {
  gridImageId: {
    minImageHeight: 80,
    minImageWidth: 203,
    croppingAspectRatio: 2.5375,
    uploadPreset: cloudinaryUploadPresetGridImageSetting.get(),
  },
  bannerImageId: {
    minImageHeight: 300,
    minImageWidth: 700,
    croppingAspectRatio: 4.7,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  squareImageId: {
    minImageHeight: 300,
    minImageWidth: 300,
    croppingAspectRatio: 1,
    croppingDefaultSelectionRatio: 1,
    // Reuse the banner upload preset, since they are basically different versions
    // of the same image
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  profileImageId: {
    minImageHeight: 170,
    minImageWidth: 170,
    croppingAspectRatio: 1,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetProfileSetting.get(),
  },
  socialPreviewImageId: {
    minImageHeight: 270,
    minImageWidth: 500,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1.91,
    uploadPreset: cloudinaryUploadPresetSocialPreviewSetting.get(),
  },
  eventImageId: {
    minImageHeight: 270,
    minImageWidth: 500,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1.91,
    uploadPreset: cloudinaryUploadPresetEventImageSetting.get()
  },
  spotlightImageId: {
    minImageHeight: 232,
    minImageWidth: 345,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetSpotlightSetting.get()
  },
  spotlightDarkImageId: {
    minImageHeight: 232,
    minImageWidth: 345,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetSpotlightSetting.get()
  },
  onsiteDigestImageId: {
    minImageHeight: 300,
    minImageWidth: 200,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetDigestSetting.get()
  },
} as const;

const primaryMain = requireCssVar("palette", "primary", "main");

/**
 * In order to work in both light and dark mode, we need to store the colors in a CSS
 * variable. However, the cloudinary widget is loaded in an iframe which can't access
 * the CSS variables so we need to extract the color back out again. This means the
 * color won't update if the theme changes from light to dark or vice versa whilst the
 * dialog is open, but that seems pretty niche.
 */
const getCssVarValue = (varRef: string): string => {
  const varName = varRef.match(/var\((.*)\)/)?.[1];
  if (!varName) {
    throw new Error("Invalid var ref: " + varRef);
  }
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(varName);
}

export type ImageType = keyof typeof cloudinaryArgsByImageType;

export type UseImageUploadProps = {
  imageType: ImageType,
  onUploadSuccess?: (publicImageId: string) => void | Promise<void>,
  onUploadError?: (error: Error) => void | Promise<void>,
  croppingAspectRatio?: number,
}

export const useImageUpload = ({
  imageType,
  onUploadSuccess,
  onUploadError,
  croppingAspectRatio,
}: UseImageUploadProps) => {
  const theme = useTheme();

  const uploadImage = useCallback(() => {
    if (!window.cloudinary) {
      throw new Error("Cloudinary is not loaded");
    }

    const cloudinaryArgs = cloudinaryArgsByImageType[imageType];
    if (!cloudinaryArgs) {
      throw new Error("Unsupported image upload type")
    }

    const uploadPreset = cloudinaryArgs.uploadPreset;
    if (!uploadPreset) {
      throw new Error(`Cloudinary upload preset not configured for ${imageType}`)
    }

    const color = getCssVarValue(primaryMain);

    window.cloudinary.openUploadWidget({
      multiple: false,
      sources: ["local", "url", "camera", "facebook", "instagram", "google_drive"],
      cropping: true,
      cloudName: cloudinaryCloudNameSetting.get(),
      theme: "minimal",
      croppingValidateDimensions: true,
      croppingShowDimensions: true,
      styles: {
        palette: {
          tabIcon: color,
          link: color,
          action: color,
          textDark: "#212121",
        },
        fonts: {
          default: null,
          [theme.typography.cloudinaryFont.stack]: {
            url: theme.typography.cloudinaryFont.url,
            active: true,
          },
        },
      },
      maxFileSize: 5_000_000, // 5 MB
      ...cloudinaryArgs,
      uploadPreset,
      croppingAspectRatio,
    }, (error, result) => {
      if (error) {
        void onUploadError?.(new Error(error?.statusText ?? "Failed to upload image"));
        return;
      }

      /**
       * Currently we ignore all events other than a successful upload - See
       * https://cloudinary.com/documentation/upload_widget_reference#events
       */
      if (result && result.event !== "success") {
        return;
      }

      const publicId = result?.info?.public_id;
      if (publicId) {
        void onUploadSuccess?.(publicId as string);
      } else {
        void onUploadError?.(new Error("Failed to upload image"));
      }
    });
  }, [
    croppingAspectRatio,
    imageType,
    onUploadSuccess,
    onUploadError,
    theme.typography.cloudinaryFont.stack,
    theme.typography.cloudinaryFont.url,
  ]);

  return {
    uploadImage,
    ImageUploadScript: () => (
      <Helmet name="imageUploadScript">
        <script
          src="https://upload-widget.cloudinary.com/global/all.js"
          type="text/javascript"
        />
      </Helmet>
    ),
  };
}
