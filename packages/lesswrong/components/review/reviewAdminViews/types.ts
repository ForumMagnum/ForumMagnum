/**
 * Shared types and utilities for the BestOfLessWrongAdmin views.
 */

export type PostProcessingStatus = 'needs-selection' | 'needs-upscale' | 'needs-coordinates' | 'review';

export interface ReviewPostWithStatus {
  post: PostsTopItemInfo;
  images: ReviewWinnerArtImages[];
  activeImage: ReviewWinnerArtImages | null;
  status: PostProcessingStatus;
}

export interface AdminViewProps {
  posts: ReviewPostWithStatus[];
  refetchImages: () => void;
  loading: boolean;
}

// Defaults from PostWithArtGrid (set when clicking "select" on an image)
const SELECTION_DEFAULT_COORDINATES = {
  leftXPct: 0.33,
  leftYPct: 0.15,
  leftWidthPct: 0.33,
  leftHeightPct: 0.65,
  leftFlipped: true,
  middleXPct: 0.66,
  middleYPct: 0.15,
  middleWidthPct: 0.33,
  middleHeightPct: 1.0,
  middleFlipped: false,
  rightXPct: 0.0,
  rightYPct: 0.15,
  rightWidthPct: 0.33,
  rightHeightPct: 0.65,
  rightFlipped: false,
} as const;

// Defaults from coverImageGeneration.ts (set when images are first generated)
const GENERATION_DEFAULT_COORDINATES = {
  leftXPct: 0.0,
  leftYPct: 0.0,
  leftWidthPct: 0.33,
  leftHeightPct: 1.0,
  leftFlipped: false,
  middleXPct: 0.33,
  middleYPct: 0.0,
  middleWidthPct: 0.33,
  middleHeightPct: 1.0,
  middleFlipped: false,
  rightXPct: 0.66,
  rightYPct: 0.0,
  rightWidthPct: 0.33,
  rightHeightPct: 1.0,
  rightFlipped: false,
} as const;

type CoordDefaults = typeof SELECTION_DEFAULT_COORDINATES;

function matchesDefaults(coords: SplashArtCoordinatesEdit, defaults: CoordDefaults): boolean {
  for (const key of Object.keys(defaults) as Array<keyof CoordDefaults>) {
    const defaultVal = defaults[key];
    const actual = coords[key];
    if (typeof defaultVal === 'boolean') {
      if (actual !== defaultVal) return false;
    } else {
      if (Math.abs((actual as number) - defaultVal) > 0.001) return false;
    }
  }
  return true;
}

export function hasCustomCoordinates(coords: SplashArtCoordinatesEdit): boolean {
  return !matchesDefaults(coords, SELECTION_DEFAULT_COORDINATES)
    && !matchesDefaults(coords, GENERATION_DEFAULT_COORDINATES);
}

export function getActiveImage(images: ReviewWinnerArtImages[]): ReviewWinnerArtImages | null {
  const withCoords = images.filter(img => img.activeSplashArtCoordinates);
  if (withCoords.length === 0) return null;

  return withCoords.reduce((best, img) => {
    const bestDate = best.activeSplashArtCoordinates
      ? new Date(best.activeSplashArtCoordinates.createdAt).getTime()
      : 0;
    const imgDate = img.activeSplashArtCoordinates
      ? new Date(img.activeSplashArtCoordinates.createdAt).getTime()
      : 0;
    return imgDate > bestDate ? img : best;
  });
}

export function getPostStatus(images: ReviewWinnerArtImages[]): PostProcessingStatus {
  const active = getActiveImage(images);
  if (!active) return 'needs-selection';
  if (!active.upscaledImageUrl) return 'needs-upscale';
  if (!active.activeSplashArtCoordinates || !hasCustomCoordinates(active.activeSplashArtCoordinates)) {
    return 'needs-coordinates';
  }
  return 'review';
}

export function cleanPromptForDisplay(prompt: string): string {
  const dashIdx = prompt.indexOf(' --');
  const withoutParameters = dashIdx > 0 ? prompt.substring(0, dashIdx).trim() : prompt.trim();
  
  return withoutParameters.replace("LessWrong review winner art, ", "").replace(", aquarelle painting fading to white by Thomas W. Schaller", "");
}

export const STATUS_LABELS: Record<PostProcessingStatus, string> = {
  'needs-selection': 'Needs Selection',
  'needs-upscale': 'Needs Upscale',
  'needs-coordinates': 'Needs Coordinates',
  'review': 'Review',
};

export const STATUS_COLORS: Record<PostProcessingStatus, string> = {
  'needs-selection': '#e53935',
  'needs-upscale': '#f9a825',
  'needs-coordinates': '#1e88e5',
  'review': '#43a047',
};

export type AdminViewName = 'pipeline' | 'focused' | 'gallery' | 'table' | 'carousel';

export const VIEW_LABELS: Record<AdminViewName, string> = {
  pipeline: 'Pipeline',
  focused: 'Focused',
  gallery: 'Gallery',
  table: 'Table',
  carousel: 'Carousel',
};
