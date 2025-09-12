import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { CSSProperties } from 'react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { useAbstractThemeOptions } from '../themes/useTheme';

const DEFAULT_HEADER_HEIGHT = 300;

// see their documentation: https://cloudinary.com/documentation/transformation_reference
export type CloudinaryPropsType = {
  dpr?: string, // device pixel ratio
  ar?: string,  // aspect ratio
  w?: string,   // width
  h?: string,   // height
  c?: string,   // crop
  g?: string,   // gravity
  q?: string    // quality
  f?: string    // format
}

function cloudinaryPropsToStr(props: Record<string, string>) {
  let sb: string[] = [];
  for(let k in props)
    sb.push(`${k}_${props[k]}`);
  return sb.join(",");
}

export function makeCloudinaryImageUrl (publicId: string, cloudinaryProps: CloudinaryPropsType) {
  return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_crop,g_custom/${cloudinaryPropsToStr(cloudinaryProps)}/${publicId}`
}

// Cloudinary image without using cloudinary-react. Allows SSR.
const CloudinaryImage2 = ({
  width,
  height,
  objectFit,
  darkPublicId,
  publicId,
  imgProps,
  fullWidthHeader,
  className,
  wrapperClassName,
  loading,
}: {
  /** Overridden if fullWidthHeader is true */
  width?: number|string,
  height?: number,
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
  publicId: string,
  darkPublicId?: string|null,
  imgProps?: CloudinaryPropsType,
  /** Overrides width */
  fullWidthHeader?: boolean,
  className?: string,
  wrapperClassName?: string,
  loading?: "lazy"|"eager",
}) => {
  const themeOptions = useAbstractThemeOptions() // Danger, Will Robinson! (It'll be ok, see below.)

  let cloudinaryProps: CloudinaryPropsType = {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces"
  };
  let imageStyle: CSSProperties = {};

  if (width) {
    cloudinaryProps.w = width.toString()
    imageStyle.width = width
  }
  if (height) {
    cloudinaryProps.h = height.toString()
    imageStyle.height = height+"px";
  }
  // ignore input width if we're told we have a fullWidthHeader
  if (fullWidthHeader) {
    // cloudinary props will be used for src, but srcset will effectively
    // overwrite these, unless client is IE
    cloudinaryProps.h = ((height || DEFAULT_HEADER_HEIGHT)*2).toString()
    cloudinaryProps.w = 'iw'
    imageStyle.width="100%"
  }
  if (objectFit) {
    imageStyle.objectFit = objectFit
  }
  
  cloudinaryProps = {...cloudinaryProps, ...imgProps}

  // Dark image should be used when:
  //  - (darkPublicId is defined, obvs)
  //  - And either:
  //    - User is in dark mode
  //    - Or, user is in auto mode, and their browser reports that they prefer
  //      dark mode
  // That last condition cannot be determined from the server, sadly. So we will
  // have to rely on media queries
  let shouldUseDarkImage: "yes"|"no"|"maybe" = "yes"
  if (!darkPublicId || themeOptions.name === "default") {
    shouldUseDarkImage = "no"
  } else if (themeOptions.name === "auto") {
    shouldUseDarkImage = "maybe"
  } // themeOption.name must be dark, defaulting to yes
  // Cast is safe because if shouldUseDarkImage is "yes" we know that darkPublicId is defined
  const basicImageUrl = makeCloudinaryImageUrl(
    shouldUseDarkImage === "yes" ? darkPublicId! : publicId,
    cloudinaryProps
  )
  const darkImageUrl = darkPublicId && makeCloudinaryImageUrl(darkPublicId, cloudinaryProps)

  // fullWidthHeader images are big and so need srcsets
  let srcSetFunc: ((publicId: string) => string) | null = null
  if (fullWidthHeader) {
    // We always double the height, to account for high dpi screens. We can't
    // combine srcset width-checking with DPI-checking unfortunately.
    const srcSetHeight = (cloudinaryProps.h || (DEFAULT_HEADER_HEIGHT*2).toString())
    // NB: we lie about the final width here, we don't know it
    srcSetFunc = (imgId) => `
      ${makeCloudinaryImageUrl(imgId, {...cloudinaryProps, ...{w: '450', h: srcSetHeight}})} 450w,
      ${makeCloudinaryImageUrl(imgId, {...cloudinaryProps, ...{w: '900', h: srcSetHeight}})} 900w,
      ${makeCloudinaryImageUrl(imgId, {...cloudinaryProps, ...{w: '1500', h: srcSetHeight}})} 1500w,
      ${makeCloudinaryImageUrl(imgId, {...cloudinaryProps, ...{w: 'iw', h: srcSetHeight}})} 3000w,
    `
  }

  return <picture className={wrapperClassName}>
    {srcSetFunc && (shouldUseDarkImage === 'maybe' ? <source
      // Cast is safe for similar reasons to above
      srcSet={srcSetFunc(darkPublicId!)}
      media="(min-width: 600px) and (prefers-color-scheme: dark)"
    /> : <source
      srcSet={srcSetFunc(shouldUseDarkImage === "yes" ? darkPublicId! : publicId)}
      media="(min-width: 600px)"
    />)}
    {shouldUseDarkImage === 'maybe' && <source
      // Cast is safe for similar reasons to above
      srcSet={darkImageUrl!}
      media="(prefers-color-scheme: dark)"
    />}
    <img
      loading={loading}
      src={basicImageUrl}
      style={imageStyle}
      className={className}
    />
  </picture>
};

export default registerComponent('CloudinaryImage2', CloudinaryImage2);


