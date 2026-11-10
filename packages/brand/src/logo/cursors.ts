import type { CursorId } from "./types.ts";
import type { PixelGrid } from "./pixels.ts";

// The cursors the mark can click with. "The web evolved bringing different
// cursors; the brand embraces all of them." Pixel cursors are grids (see
// pixels.ts); the modern arrow is a vector path. Both are in cursor-pixel
// units, so `cursor.size` scales them the same way.
//
// `hotspot` is the point that clicks, in the same units: what sits on the
// orbit.

export type Cursor =
  | { kind: "pixel"; label: string; grid: PixelGrid; hotspot: [number, number] }
  | {
      kind: "vector";
      label: string;
      /** Closed path, filled with ink and stroked with paper. */
      path: string;
      /** Stroke width, in cursor pixels. */
      stroke: number;
      hotspot: [number, number];
    };

export const CURSORS = {
  // Today's logo cursor (crayola's Cursor.tsx, website icon.svg): 12×19.
  arrow: {
    kind: "pixel",
    label: "pixel arrow",
    hotspot: [0, 0],
    grid: [
      "#",
      "##",
      "#.#",
      "#..#",
      "#...#",
      "#....#",
      "#.....#",
      "#......#",
      "#.......#",
      "#........#",
      "#.........#",
      "#..........#",
      "#......#####",
      "#...#..#",
      "#..# #..#",
      "#.#  #..#",
      "##    #..#",
      "      #..#",
      "       ##",
    ],
  },
  // The link-hover hand: index finger up, the tip of it clicks.
  hand: {
    kind: "pixel",
    label: "pixel hand",
    hotspot: [6, 0],
    grid: [
      "     ##",
      "    #..#",
      "    #..#",
      "    #..#",
      "    #..#",
      "    #..##",
      "    #..#..###",
      "    #..#..#..##",
      " ## #..#..#..#.#",
      "#..##..#..#..#.#",
      " #..#..........#",
      "  #............#",
      "  #...........#",
      "   #..........#",
      "   #.........#",
      "    #........#",
      "    #........#",
      "    ##########",
    ],
  },
  // Today's system arrow: smooth, black with a white border.
  "vector-arrow": {
    kind: "vector",
    label: "modern arrow",
    hotspot: [0, 0],
    stroke: 1.4,
    path: "M0 0V16.6L4 12.8L6.7 18.8L9.4 17.6L6.8 11.7H12.2Z",
  },
  // The I-beam that appears over text: reading, selecting. Ink beam with a
  // paper halo so it stays visible on the sun. Clicks at the middle.
  text: {
    kind: "pixel",
    label: "text",
    hotspot: [3.5, 9],
    grid: [
      " ..... ",
      ".##.##.",
      " ..#.. ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      "  .#.  ",
      " ..#.. ",
      ".##.##.",
      " ..... ",
    ],
  },
  // ⊘: what can't be clicked. Ring and slash in ink, a paper halo around.
  "not-allowed": {
    kind: "pixel",
    label: "not allowed",
    hotspot: [9, 9],
    grid: [
      "     ........",
      "   ..########..",
      "  ..##########..",
      " ..####....####..",
      " .###.......####.",
      ".###.......######.",
      ".###......###.###.",
      ".##......###...##.",
      ".##.....###....##.",
      ".##....###.....##.",
      ".##...###......##.",
      ".###.###......###.",
      ".######.......###.",
      " .####.......###.",
      " ..####....####..",
      "  ..##########..",
      "   ..########..",
      "     ........",
    ],
  },
  // The old hourglass: wait, it's working.
  busy: {
    kind: "pixel",
    label: "busy",
    hotspot: [5.5, 6.5],
    grid: [
      "###########",
      "#.........#",
      " #.......#",
      " #.#####.#",
      "  #.###.#",
      "   #.#.#",
      "    #.#",
      "   #...#",
      "  #..#..#",
      " #...#...#",
      " #.#####.#",
      "#.........#",
      "###########",
    ],
  },
} satisfies Record<CursorId, Cursor>;
