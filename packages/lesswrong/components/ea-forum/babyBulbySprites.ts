export type BabyBulbySpritePixel = "." | "#" | "h" | "s" | "w" | "p" | "k";
export type BabyBulbyAnimationMode = "idle" | "eating" | "happy" | "refuse" | "dead";

export type BabyBulbyAnimation = {
  frameDurationMs: number,
  frames: BabyBulbySpritePixel[][][],
  playOrder: readonly number[],
  loop: boolean,
  nextMode?: BabyBulbyAnimationMode,
};

export const babyBulbySpritePalette = {
  body: "#121212",
  fill: "#ffffff",
  heart: "#e24b4a",
  sparkle: "#efaf00",
} as const;

const parseSpriteChar = (char: string, rowIndex: number, columnIndex: number): BabyBulbySpritePixel => {
  if (![".", "#", "h", "s", "w", "p", "k"].includes(char)) {
    throw new Error(`Unknown Baby Bulby sprite pixel "${char}" at row ${rowIndex + 1}, column ${columnIndex + 1}`);
  }

  return char as BabyBulbySpritePixel;
};

const parseSpriteFrame = (rows: readonly string[]): BabyBulbySpritePixel[][] => rows.map((row, rowIndex) =>
  row.split("").map((char, columnIndex) => parseSpriteChar(char, rowIndex, columnIndex))
);

const parseSpriteFrames = (frames: readonly (readonly string[])[]): BabyBulbySpritePixel[][][] => frames.map(parseSpriteFrame);

const getDefaultPlayOrder = (frameCount: number) => Array.from({ length: frameCount }, (_, index) => index);

const defineAnimation = ({
  frameDurationMs,
  frameRows,
  playOrder,
  loop = false,
  nextMode,
}: {
  frameDurationMs: number,
  frameRows: readonly (readonly string[])[],
  playOrder?: readonly number[],
  loop?: boolean,
  nextMode?: BabyBulbyAnimationMode,
}): BabyBulbyAnimation => {
  const frames = parseSpriteFrames(frameRows);
  const resolvedPlayOrder = [...(playOrder ?? getDefaultPlayOrder(frames.length))];

  if (resolvedPlayOrder.length === 0) {
    throw new Error("Baby Bulby animations must define at least one frame in playOrder");
  }

  resolvedPlayOrder.forEach((frameIndex) => {
    if (frameIndex < 0 || frameIndex >= frames.length) {
      throw new Error(`Invalid Baby Bulby playOrder frame index ${frameIndex} for animation with ${frames.length} frame(s)`);
    }
  });

  return {
    frameDurationMs,
    frames,
    playOrder: resolvedPlayOrder,
    loop,
    ...(nextMode ? { nextMode } : {}),
  };
};

/*
 * The egg sprite data stays in the registry during the admin-only soft launch so the
 * full-release PR can restore the logged-out experience without having to recreate art.
 * The current runtime gate means these frames are dormant for now.
 */
const eggIdleFrames = [
  [
    "..................",
    "..................",
    "..................",
    "..................",
    ".......####.......",
    "......#wwww#......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "....#wwwwwwww#....",
    "...#wwwwhhhwww#...",
    "...#wwwwhhhwww#...",
    "...#wwwwwhwwww#...",
    "...#wwwwwwwwww#...",
    "....#wwwwwwww#....",
    "....##########....",
    "..................",
    "..................",
    "..................",
  ],
  [
    "..................",
    "..................",
    "..................",
    "..................",
    "........####......",
    ".......#wwww#.....",
    "......#wwwwww#....",
    ".....#wwwwwww#....",
    "....#wwwwwwwww#...",
    "....#wwwwhhhww#...",
    "...#wwwwhhhwww#...",
    "...#wwwwwhwwww#...",
    "...#wwwwwwwwww#...",
    "....#wwwwwwww#....",
    "....##########....",
    "..................",
    "..................",
    "..................",
  ],
] as const;

const bulbyIdleFrames = [
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
] as const;

const bulbySickFrames = [
  [
    "..................",
    ".kkk..............",
    "k.k.k.............",
    "kkkkk.............",
    ".k.k..######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..............kkk.",
    ".............k.k.k",
    "......######.kkkkk",
    ".....#wwwwww#.k.k.",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
] as const;

const bulbyEatingFrames = [
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#.p.",
    "...#wwww##wwww#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#.p.",
    "...#wwwww#wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwwww#wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
] as const;

const bulbyHappyFrames = [
  [
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
    "..................",
  ],
  [
    "..................",
    "..................",
    "...............s..",
    "..................",
    ".s....######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..s...######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#..s.",
    "...#www#ww#www#...",
    "...#wwww##wwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
    "..................",
  ],
] as const;

const bulbyRefuseFrames = [
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#ww#ww#wwww#.p.",
    "...#www##wwwww#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#wwww#ww#ww#.p.",
    "...#wwwww##www#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#ww#ww#wwww#.p.",
    "...#www##wwwww#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
  [
    "..................",
    "..................",
    "..................",
    "......######......",
    ".....#wwwwww#.....",
    "....#wwwwwwww#....",
    "...#wwww#ww#ww#.p.",
    "...#wwwww##www#.p.",
    "...#wwwwwwwwww#...",
    "...#wwwwwwwwww#...",
    "...#wwwhwhhwww#...",
    "...#wwwhhhhwww#...",
    "....#wwwhhwww#....",
    "....#wwwwhwww#....",
    ".....#wwwwww#.....",
    "......######......",
    ".......#ww#.......",
    ".......####.......",
  ],
] as const;

const bulbyDeadFrames = [
  [
    "..................",
    "..................",
    "..................",
    "..................",
    "..................",
    "..................",
    "..................",
    "..................",
    "..................",
    "...#########......",
    "..#ww#wwwwww###...",
    "..#www##whhw#w#...",
    "..#www##whhh#w#...",
    "..#ww#wwwwww###...",
    "...#########......",
    "..................",
    "..................",
    "..................",
  ],
] as const;

export const babyBulbyAnimations = {
  egg: {
    idle: defineAnimation({
      frameDurationMs: 800,
      frameRows: eggIdleFrames,
      loop: true,
    }),
  },
  babyBulby: {
    idle: defineAnimation({
      frameDurationMs: 800,
      frameRows: bulbyIdleFrames,
      loop: true,
    }),
    sick: defineAnimation({
      frameDurationMs: 800,
      frameRows: bulbySickFrames,
      loop: true,
    }),
    eating: defineAnimation({
      frameDurationMs: 500,
      frameRows: bulbyEatingFrames,
      nextMode: "happy",
    }),
    happy: defineAnimation({
      frameDurationMs: 400,
      frameRows: bulbyHappyFrames,
      playOrder: [0, 1, 2, 1, 2],
      nextMode: "idle",
    }),
    refuse: defineAnimation({
      frameDurationMs: 750,
      frameRows: bulbyRefuseFrames,
      nextMode: "idle",
    }),
    dead: defineAnimation({
      frameDurationMs: 800,
      frameRows: bulbyDeadFrames,
    }),
  },
} as const satisfies {
  egg: Record<string, BabyBulbyAnimation>,
  babyBulby: Record<string, BabyBulbyAnimation>,
};
