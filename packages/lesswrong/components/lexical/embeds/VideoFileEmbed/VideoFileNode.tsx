import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import React, { type JSX } from 'react';

import { BlockWithAlignableContentsWrapper } from '../../nodes/BlockWithAlignableContentsWrapper';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';

/**
 * Matches a direct link to a video file (as opposed to a page on a video
 * host like YouTube), which browsers can play in a plain <video> element.
 */
const VIDEO_FILE_URL_REGEX = /^https?:\/\/[^\s?#]+\.(?:mp4|m4v|webm|ogv|mov)(?:[?#]\S*)?$/i;

export function getVideoFileUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const trimmedUrl = url.trim();
  return VIDEO_FILE_URL_REGEX.test(trimmedUrl) ? trimmedUrl : null;
}

type VideoFileComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  src: string;
}>;

function VideoFileComponent({
  className,
  format,
  nodeKey,
  src,
}: VideoFileComponentProps) {
  return (
    <BlockWithAlignableContentsWrapper
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="video-file-preview">
        <video src={src} controls preload="metadata" playsInline />
      </div>
    </BlockWithAlignableContentsWrapper>
  );
}

export type SerializedVideoFileNode = Spread<
  {
    src: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertVideoFileElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const videoElement = domNode.tagName.toLowerCase() === 'video'
    ? domNode
    : domNode.querySelector('video');
  const src = getVideoFileUrl(videoElement?.getAttribute('src') ?? null);
  if (!src) {
    return null;
  }
  return {node: $createVideoFileNode(src)};
}

export class VideoFileNode extends DecoratorBlockNode {
  __src: string;

  static getType(): string {
    return 'video-file';
  }

  static clone(node: VideoFileNode): VideoFileNode {
    return new VideoFileNode(node.__src, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedVideoFileNode): VideoFileNode {
    return $createVideoFileNode(serializedNode.src).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedVideoFileNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
    };
  }

  constructor(src: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__src = src;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'video-file-preview';

    const video = document.createElement('video');
    video.setAttribute('src', this.__src);
    video.setAttribute('controls', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('playsinline', '');
    element.appendChild(video);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      video: (domNode: HTMLElement) => {
        if (!getVideoFileUrl(domNode.getAttribute('src'))) {
          return null;
        }
        return {
          conversion: $convertVideoFileElement,
          priority: 1,
        };
      },
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('video-file-preview')) {
          return null;
        }
        return {
          conversion: $convertVideoFileElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return this.__src;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <VideoFileComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        src={this.__src}
      />
    );
  }
}

export function $createVideoFileNode(src: string): VideoFileNode {
  return new VideoFileNode(src);
}

export function $isVideoFileNode(
  node: VideoFileNode | LexicalNode | null | undefined,
): node is VideoFileNode {
  return node instanceof VideoFileNode;
}
