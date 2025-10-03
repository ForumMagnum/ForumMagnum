import { cloudinaryCloudNameSetting } from '@/lib/instanceSettings';

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

export function makeCloudinaryImageUrl(publicId: string, cloudinaryProps: CloudinaryPropsType) {
  return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_crop,g_custom/${cloudinaryPropsToStr(cloudinaryProps)}/${publicId}`;
}
