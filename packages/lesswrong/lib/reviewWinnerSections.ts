import { ReviewYear, ReviewWinnerCategory } from '@/lib/reviewUtils';

export type CoordinateInfo = {
  leftXPct: number
  leftYPct: number
  rightXPct: number
  rightYPct: number
  middleXPct: number
  middleYPct: number
  leftFlipped?: boolean
  middleFlipped?: boolean
  rightFlipped?: boolean
  leftWidthPct: number
  rightWidthPct: number
  middleWidthPct: number
  leftHeightPct?: number;
  middleHeightPct?: number;
  rightHeightPct?: number;
};

export interface ReviewSectionInfo {
  title?: string;
  imgUrl: string;
  order: number;
  coords: CoordinateInfo;
  tag: string | null;
}

export interface ReviewYearGroupInfo {
  title?: string;
  imgUrl: string;
  coords: CoordinateInfo;
}

export const reviewWinnerSectionsInfo: Record<ReviewWinnerCategory, ReviewSectionInfo> = {
  modeling: {
    tag: "World Modeling",
    order: 2,
    title: "World",
    coords: {
      leftXPct: 0.05,
      leftYPct: 0,
      rightXPct: 0.57,
      rightYPct: 0,
      middleXPct: 0.31,
      middleYPct: 0,
      leftFlipped: true,
      leftWidthPct: 0.26,
      rightWidthPct: 0.26,
      middleWidthPct: 0.26
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753450/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_15ba02c3-b268-45f1-a780-322bbaa6fc22_eu9l0l.png"
  },
  "ai safety": {
    tag: "AI",
    order: 5,
    title: "Technical AI Safety",
    coords: {
      leftXPct: 0.2,
      leftYPct: 0.3,
      rightXPct: 0.554,
      rightYPct: 0.3,
      middleXPct: 0.467,
      middleYPct: 0.3,
      leftFlipped: false,
      leftWidthPct: 0.267,
      rightFlipped: true,
      middleFlipped: false,
      rightWidthPct: 0.267,
      middleWidthPct: 0.267
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1708570131/lwbot_topographic_watercolor_artwork_of_a_giant_robot_hand_gent_e4e9f305-9611-4787-8768-d7af3d702ed4_ta2ii9.png"
  },
  practical: {
    tag: "Practical",
    order: 3,
    title: "Practical",
    coords: {
      leftXPct: 0.2,
      leftYPct: 0.05,
      rightXPct: 0.634,
      rightYPct: 0.05,
      middleXPct: 0.417,
      middleYPct: 0.05,
      leftFlipped: false,
      leftWidthPct: 0.217,
      rightWidthPct: 0.217,
      middleWidthPct: 0.217
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708974564/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_4f6449e2-569b-48a3-b878-a400315b3ef0_hqutxe.png"
  },
  "ai strategy": {
    tag: "AI",
    order: 4,
    title: "AI Strategy",
    coords: {
      leftXPct: 0,
      leftYPct: 0,
      rightXPct: 0.66,
      rightYPct: 0,
      middleXPct: 0.33,
      middleYPct: 0,
      leftFlipped: false,
      leftWidthPct: 0.33,
      rightFlipped: true,
      middleFlipped: false,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753570/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_8dda30ee-71d6-4b24-80c7-a8499a5b25c6_uacvgk.png"
  },
  rationality: {
    tag: "Rationality",
    order: 0,
    title: "Rationality",
    coords: {
      leftXPct: 0.12,
      leftYPct: 0,
      rightXPct: 0.72,
      rightYPct: 0,
      middleXPct: 0.42,
      middleYPct: 0,
      leftFlipped: false,
      leftWidthPct: 0.3,
      rightFlipped: true,
      rightWidthPct: 0.3,
      middleWidthPct: 0.3
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753260/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_09275054-eb84-43c4-9cfa-4a05e1818c9e_rmov5i.png"
  },
  optimization: {
    tag: "World Optimization",
    order: 1,
    title: "Optimization",
    coords: {
      leftXPct: 0.1,
      leftYPct: 0.2,
      rightXPct: 0.7,
      rightYPct: 0.2,
      middleXPct: 0.4,
      middleYPct: 0.2,
      leftWidthPct: 0.33,
      rightFlipped: true,
      middleFlipped: false,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753382/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_242eda7f-95a9-4c3b-8090-991a1b11286f_xcjhxq.png"
  }
};
export const reviewWinnerYearGroupsInfo: Partial<Record<ReviewYear, ReviewYearGroupInfo>> = {
  2018: {
    coords: {
      leftXPct: 0.01,
      leftYPct: 0.1,
      rightXPct: 0.72,
      rightYPct: 0.1,
      middleXPct: 0.34,
      middleYPct: 0.1,
      leftFlipped: false,
      leftWidthPct: 0.33,
      rightFlipped: false,
      middleFlipped: false,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008323/ruby37_green_on_white_aquarelle_sketch_by_thomas_schaller_of_ri_7a3fa89a-ac7a-466f-929f-b396cb4d9bd5_p8rh9t.png"
  },
  2019: {
    coords: {
      leftXPct: 0.01,
      leftYPct: 0.1,
      rightXPct: 0.72,
      rightYPct: 0.1,
      middleXPct: 0.34,
      middleYPct: 0.1,
      leftFlipped: false,
      leftWidthPct: 0.33,
      rightFlipped: false,
      middleFlipped: false,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008331/ruby37_blue_on_white_aquarelle_sketch_by_thomas_schaller_of_gre_f421cc99-2bb5-4357-b164-d05c2f4fe84e_aib1co.png"
  },
  2020: {
    coords: {
      leftXPct: 0.01,
      leftYPct: 0.01,
      rightXPct: 0.72,
      rightYPct: 0.01,
      middleXPct: 0.34,
      middleYPct: 0.01,
      leftFlipped: false,
      leftWidthPct: 0.33,
      rightFlipped: false,
      middleFlipped: false,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008346/ruby37_aquarelle_sketch_of_futuristic_landscape_by_thomas_schal_f07d5805-9fb0-4dcc-9295-7f063624e28c_slcokh.png"
  },
  2021: {
    coords: {
      leftXPct: 0.01,
      leftYPct: 0.1,
      rightXPct: 0.545,
      rightYPct: 0.1,
      middleXPct: 0.278,
      middleYPct: 0.1,
      leftFlipped: false,
      leftWidthPct: 0.267,
      rightFlipped: false,
      middleFlipped: false,
      rightWidthPct: 0.267,
      middleWidthPct: 0.267
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/a_270/q_auto,f_auto/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
  },
  2022: {
    coords: {
      leftXPct: 0,
      leftYPct: 0.1,
      rightXPct: 0.79,
      rightYPct: 0.1,
      middleXPct: 0.43,
      middleYPct: 0.1,
      leftFlipped: false,
      leftWidthPct: 0.33,
      rightFlipped: true,
      rightWidthPct: 0.33,
      middleWidthPct: 0.33
    },
    imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008351/ruby37_aquarelle_sketch_of_a_woman_focusing_hard_studying_in_an_2ac568ef-408e-4561-acc8-84c76bb42fba_gwt8uq.png"
  }
};
