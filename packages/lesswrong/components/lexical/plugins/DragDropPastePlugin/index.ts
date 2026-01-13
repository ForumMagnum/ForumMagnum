/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {DRAG_DROP_PASTE} from '@lexical/rich-text';
import {isMimeType} from '@lexical/utils';
import {COMMAND_PRIORITY_LOW} from 'lexical';
import {useEffect, useRef} from 'react';

import {INSERT_IMAGE_COMMAND} from '../ImagesPlugin';
import {
  uploadToCloudinary,
  ImageUploadError,
} from '../../utils/cloudinaryUpload';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

export interface DragDropPasteProps {
  onUploadError?: (error: Error) => void;
}

export default function DragDropPaste({
  onUploadError,
}: DragDropPasteProps = {}): null {
  const [editor] = useLexicalComposerContext();
  const activeUploadsRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const activeUploads = activeUploadsRef.current;
    return () => {
      for (const controller of activeUploads.values()) {
        controller.abort();
      }
      activeUploads.clear();
    };
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          for (const file of files) {
            if (!isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              continue;
            }

            const uploadId = `${Date.now()}-${Math.random()}`;
            const controller = new AbortController();
            activeUploadsRef.current.set(uploadId, controller);

            try {
              const result = await uploadToCloudinary(file, {
                signal: controller.signal,
              });

              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: result.secure_url,
                width: result.width,
                height: result.height,
              });
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                continue;
              }

              const uploadError = error instanceof ImageUploadError
                ? error
                : new ImageUploadError('Failed to upload image. Please try again.');

              if (onUploadError) {
                onUploadError(uploadError);
              } else {
                // eslint-disable-next-line no-console
                console.error('Image upload failed:', error);
              }
            } finally {
              activeUploadsRef.current.delete(uploadId);
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onUploadError]);

  return null;
}
