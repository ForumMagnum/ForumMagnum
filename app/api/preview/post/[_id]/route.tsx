import { runQuery } from '@/server/vulcan-lib/query';
import { ImageResponse } from 'next/og';
import { gql } from '@/lib/generated/gql-codegen';
import { NextResponse } from 'next/server';
import { forumTitleSetting } from '@/lib/instanceSettings';
import sharp from 'sharp';
import type { ReactElement } from 'react';
 
const PostMetadataQuery = gql(`
  query PostMetadataForPreviewImage($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        _id
        title
        socialPreviewImageAutoUrl
        contents {
          plaintextMainText
        }
        user { displayName }
        coauthors { displayName }
      }
    }
  }
`);

export async function GET( _req: Request, props: {
  params: Promise<{ _id: string }>,
  searchParams: Promise<{ format: string|null }>
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);

  const postId = await params._id;
  const format = parseLinkPreviewImageFormat(searchParams?.format);

  const result = await runQuery(PostMetadataQuery, {
    postId,
  });
  const post = result?.data?.post?.result;
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return await generateLinkPreviewImage(post, format);
}

type LinkPreviewImageFormat = "og" | "twitter";
function parseLinkPreviewImageFormat(format: string|null): LinkPreviewImageFormat {
  switch (format) {
    case "og":
      return "og";
    case "twitter":
      return "twitter";
    default:
      return "og";
  }
}

const containerStyle = {
  display: "flex",
  background: 'white',
  position: "absolute",
  left: 0, top: 0, right: 0, bottom: 0,
} as const;

const sitenameStyle = {
  position: "absolute",
  left: 50,
  top: 30,
  fontSize: 20,
} as const;

const titleStyle = {
  position: "absolute",
  left: 50,
  top: 55,
  right: 50,
  height: "400px",
  textAlign: "left",

  fontSize: 40,
  color: 'black',
} as const;

const imageFrame = {
  left: 0,
  top: 230,
  width: 400,
  height: 400,
} as const;

const previewTextStyle = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  whiteSpace: "pre-wrap",
  left: 450,
  top: 230,
  width: 700,
  fontSize: 20,
} as const;

const lineStyle = {
  textAlign: "justify",
  minHeight: 20,
} as const;

async function generateLinkPreviewImage(post: PostMetadataForPreviewImageQuery_post_SinglePostOutput_result_Post, format: LinkPreviewImageFormat): Promise<ImageResponse> {
  const socialPreviewImage = await buildSocialPreviewImage(post.socialPreviewImageAutoUrl ?? "");
  return new ImageResponse((
    <div style={containerStyle}>
      <div style={sitenameStyle}>{forumTitleSetting.get()}</div>
      <div style={titleStyle}>{post.title}</div>
      {socialPreviewImage}
      <div style={previewTextStyle}>
        {post.contents?.plaintextMainText.split('\n').map(line => <div style={lineStyle}>
          {line}
        </div>)}
      </div>
    </div>
  ),
  {
    width: 1200,
    height: 630,
  });
}

type ImageDimensions = {
  width: number;
  height: number;
};

type ImageRenderData = {
  dataUrl: string;
  scaledDimensions: ImageDimensions;
};

async function buildSocialPreviewImage(src: string): Promise<ReactElement | null> {
  if (!src) return null;

  // We download and resize the image ourselves to avoid satori's resizing artifacts,
  // and to compute a layout based on real image dimensions.
  const renderData = await fetchAndResizeImage(src, imageFrame.width, imageFrame.height);
  if (!renderData) return null;

  const imageStyle = getImageStyleInFrame(renderData.scaledDimensions, imageFrame);
  return <img src={renderData.dataUrl} style={imageStyle} />;
}

async function fetchAndResizeImage(
  src: string,
  maxWidth: number,
  maxHeight: number
): Promise<ImageRenderData | null> {
  const response = await fetch(src);
  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') ?? undefined;
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const originalWidth = metadata.width ?? maxWidth;
  const originalHeight = metadata.height ?? maxHeight;

  const scaledDimensions = getScaledDimensions(
    { width: originalWidth, height: originalHeight },
    { width: maxWidth, height: maxHeight }
  );

  const outputFormat = getSharpOutputFormat(metadata.format);
  const outputBuffer = await image
    .resize({
      width: scaledDimensions.width,
      height: scaledDimensions.height,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .toFormat(outputFormat)
    .toBuffer();

  const outputMimeType = getMimeTypeForFormat(outputFormat, contentType);
  const dataUrl = `data:${outputMimeType};base64,${outputBuffer.toString('base64')}`;

  return { dataUrl, scaledDimensions };
}

function getScaledDimensions(
  original: ImageDimensions,
  max: ImageDimensions
): ImageDimensions {
  const widthScale = max.width / original.width;
  const heightScale = max.height / original.height;
  const scale = Math.min(widthScale, heightScale, 1);

  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
  };
}

function getImageStyleInFrame(
  imageDimensions: ImageDimensions,
  frame: { left: number; top: number; width: number; height: number }
) {
  const leftOffset = Math.max(0, Math.round((frame.width - imageDimensions.width) / 2));
  const topOffset = Math.max(0, Math.round((frame.height - imageDimensions.height) / 2));

  return {
    position: "absolute",
    left: frame.left + leftOffset,
    top: frame.top + topOffset,
    width: imageDimensions.width,
    height: imageDimensions.height,
  } as const;
}

function getSharpOutputFormat(format?: string): 'jpeg' | 'png' | 'webp' {
  switch (format) {
    case 'jpeg':
    case 'png':
    case 'webp':
      return format;
    default:
      return 'png';
  }
}

function getMimeTypeForFormat(format: string, fallback?: string): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return fallback ?? 'image/png';
  }
}
