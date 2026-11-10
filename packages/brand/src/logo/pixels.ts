// Pixel art as SVG. A grid is drawn as strings, one per row, so it can be read
// and edited by eye; each character is one pixel and names its paint.

/** Grid characters: "#" outline (ink), "." fill (paper), anything else empty. */
export type PixelGrid = readonly string[];

/**
 * One `<path>` for every pixel of `paint` in the grid, in grid units (one
 * pixel = 1×1). Horizontal runs merge into a single rectangle, so a 19-row
 * cursor is ~40 subpaths instead of ~150 squares.
 */
export function gridPath(grid: PixelGrid, paint: string): string {
  const parts: string[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== paint) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x] === paint) x += 1;
      parts.push(`M${start} ${y}h${x - start}v1h${start - x}z`);
    }
  });
  return parts.join("");
}

/** Width of the widest row. */
export const gridWidth = (grid: PixelGrid): number =>
  grid.reduce((widest, row) => Math.max(widest, row.length), 0);
