"use client";

import React, { type JSX } from "react";
import { useEffect, useRef, useState } from "react";
import type { LexicalEditor } from "lexical";
import { useForumType } from "@/components/hooks/useForumType";
import LWDialog from "@/components/common/LWDialog";
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogActions } from "@/components/widgets/DialogActions";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import TextField from "@/lib/vendor/@material-ui/core/src/TextField";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import {
  uploadToCloudinary,
  ImageUploadError,
} from "../../utils/cloudinaryUpload";
import {
  INSERT_IMAGE_COMMAND,
  type InsertImagePayload,
} from "./commands";

const imageDialogStyles = defineStyles("ImageDialog", (theme: ThemeType) => ({
  paper: {
    width: 400,
  },
  fileInputWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fileInputLabel: {
    color: theme.palette.grey[600],
    marginRight: 12,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  errorText: {
    color: theme.palette.error.main,
    marginTop: 8,
    fontSize: 14,
  },
  modeButtonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
}));

interface ImagePickerProps {
  initialAltText?: string;
  onClick: (payload: InsertImagePayload) => void;
  onError?: (error: Error) => void;
}

function ImageUriDialogBody({
  initialAltText = "",
  onClick,
}: ImagePickerProps) {
  const [src, setSrc] = useState("");
  const [altText, setAltText] = useState(initialAltText);

  return (
    <>
      <TextField
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={(event) => setSrc(event.target.value)}
        value={src}
        fullWidth
        margin="dense"
        data-test-id="image-modal-url-input"
      />
      <TextField
        label="Alt Text"
        placeholder="Describe the image"
        onChange={(event) => setAltText(event.target.value)}
        value={altText}
        fullWidth
        margin="dense"
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          color="primary"
          data-test-id="image-modal-confirm-btn"
          disabled={src === ""}
          onClick={() => onClick({ altText, src })}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

function ImageUploadedDialogBody({
  initialAltText = "",
  onClick,
  onError,
}: ImagePickerProps) {
  const { forumType } = useForumType();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState(initialAltText);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const classes = useStyles(imageDialogStyles);

  const handleFileSelect = (files: FileList | null) => {
    setUploadError(null);
    if (files?.[0]) {
      setSelectedFile(files[0]);
      if (!altText) {
        setAltText(files[0].name);
      }
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await uploadToCloudinary(selectedFile, forumType, {
        signal: abortControllerRef.current.signal,
      });

      onClick({
        altText,
        src: result.secure_url,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      const errorMessage =
        error instanceof ImageUploadError && error.isUserFacing
          ? error.message
          : "Failed to upload image. Please try again.";
      setUploadError(errorMessage);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <>
      <div className={classes.fileInputWrapper}>
        <label className={classes.fileInputLabel}>Image Upload</label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleFileSelect(event.target.files)}
          data-test-id="image-modal-file-upload"
        />
      </div>
      <TextField
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={(event) => setAltText(event.target.value)}
        value={altText}
        fullWidth
        margin="dense"
        data-test-id="image-modal-alt-text-input"
      />
      {uploadError && <div className={classes.errorText}>{uploadError}</div>}
      <DialogActions>
        <Button
          color="primary"
          data-test-id="image-modal-file-upload-btn"
          disabled={!selectedFile || isUploading}
          onClick={handleConfirm}>
          {isUploading ? "Uploading..." : "Confirm"}
        </Button>
      </DialogActions>
    </>
  );
}

export function ImagePickerDialogContent({
  initialAltText,
  onClick,
  onError,
}: ImagePickerProps): JSX.Element {
  const [mode, setMode] = useState<null | "url" | "file">(null);
  const classes = useStyles(imageDialogStyles);

  return (
    <>
      {!mode && (
        <div className={classes.modeButtonsContainer}>
          <Button
            variant="outlined"
            data-test-id="image-modal-option-url"
            onClick={() => setMode("url")}>
            URL
          </Button>
          <Button
            variant="outlined"
            data-test-id="image-modal-option-file"
            onClick={() => setMode("file")}>
            File
          </Button>
        </div>
      )}
      {mode === "url" && (
        <ImageUriDialogBody
          initialAltText={initialAltText}
          onClick={onClick}
        />
      )}
      {mode === "file" && (
        <ImageUploadedDialogBody
          initialAltText={initialAltText}
          onClick={onClick}
          onError={onError}
        />
      )}
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
  onError,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
  onError?: (error: Error) => void;
}): JSX.Element {
  const classes = useStyles(imageDialogStyles);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      maxWidth={false}
      paperClassName={classes.paper}>
      <DialogTitle>Insert Image</DialogTitle>
      <DialogContent>
        <ImagePickerDialogContent onClick={onClick} onError={onError} />
      </DialogContent>
    </LWDialog>
  );
}
