// WebGL rendering for the taste section. field.ts decides where everything
// is; this draws it: a see-through sheet of uniform yellow grid lines, after
// the black-hole diagram, that runs past the view on every side and melts
// into fog at the back, and link spheres that sit in its dents. Once the
// last link lands the view closes in: the sheet is cut down to a square
// patch around the dents, gains finer grid lines, and turns in the left of
// the stage. Sim coordinates map straight across, except that sim z
// (distance from the camera) points down three.js's -z.
import {
  BackSide,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import type { Sim } from "./field";
import { FIELD_DEFAULTS, framingAmount, orbitAngle } from "./field";

// ── Tuning ───────────────────────────────────────────────────────────────────
// How the field is seen. Swappable live through `setView`, like the sim's
// tuning, so the dev panel can drive both.
export const VIEW_DEFAULTS = {
  // The camera orbits the well's centre: this far away, this many degrees
  // above the sheet, then tilted up by `cameraAim` so the well sits low in
  // the frame.
  cameraDistance: 5,
  cameraElevation: 15,
  cameraAim: 2.5,
  fovLandscape: 36,
  fovPortrait: 44,

  gridCell: 0.19, // world size of one grid square
  lineWidth: 1.2, // px
  lineOpacity: 1,

  fogNear: 3.2,
  fogFar: 11,

  // The final shot: the camera closes in on the dents and circles them.
  endDistance: 7.5,
  endElevation: 32,
  endAim: 0,
  // The patch's centre moves this share of the stage off centre: left on a
  // wide stage, up on a tall one, leaving room for the ending's copy.
  endShift: 0.18,
  endDivisions: 2, // each grid cell splits into this many per side
  patchCells: 5, // half the patch's side, in (coarse) grid cells
};
export type ViewTuning = typeof VIEW_DEFAULTS;

// Far past the view on every side, behind the camera included, so no edge
// is ever in frame: it reads as endless. About 0.1 world units a segment,
// fine enough for the narrowest funnel.
const SHEET_WIDTH = 30;
const SHEET_DEPTH = 40;
const SHEET_NEAR_Z = -12; // sim z; the camera sits a few units behind 0
const SHEET_SEGMENTS_X = 300;
const SHEET_SEGMENTS_Z = 400;
// Uniform array sizes; the sim never has more wells or ripples than links.
const MAX_WELLS = 8;
// Half the patch's side before it closes in, in grid cells: far past the
// view, so it starts out reading as the endless sheet.
const OPEN_PATCH_CELLS = 200;

const OUTLINE_SCALE = 1.14; // inverted-hull outline, matching the site's ink borders
// ─────────────────────────────────────────────────────────────────────────────

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

// field.ts's depthAt, in GLSL, so the GPU bends the sheet every frame and
// the CPU only does the physics. p is (x, sim z). The shape parameters come
// in as uniforms from the sim's tuning; keep the two formulas in step.
const SHEET_GLSL = /* glsl */ `
uniform vec3 uWells[${MAX_WELLS}];   // x, z, mass
uniform int uWellCount;
uniform vec4 uRipples[${MAX_WELLS}]; // x, z, amplitude, age
uniform int uRippleCount;
uniform float uSag;
uniform float uWellSigma;
uniform vec3 uSheet;  // centre z, sag sigma, max link depth
uniform vec4 uRipple; // speed, life / 3, width², wavelength

float sheetGauss(float d2, float sigma) {
  return exp(-d2 / (2.0 * sigma * sigma));
}

float sheetDepth(vec2 p) {
  vec2 c = p - vec2(0.0, uSheet.x);
  float cd2 = dot(c, c);
  float wells = uSag * sheetGauss(cd2, uSheet.y);
  for (int i = 0; i < ${MAX_WELLS}; i++) {
    if (i >= uWellCount) break;
    vec2 d = p - uWells[i].xy;
    wells += uWells[i].z * sheetGauss(dot(d, d), uWellSigma);
  }
  float depth = uSheet.z * tanh(wells / uSheet.z);
  for (int i = 0; i < ${MAX_WELLS}; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipples[i];
    float front = length(p - r.xy) - uRipple.x * r.w;
    float envelope = exp(-r.w / uRipple.y) * exp(-(front * front) / uRipple.z);
    depth += r.z * envelope * cos(front / uRipple.w * 6.2831853);
  }
  return depth;
}

// Local mesh coordinates run x, height, -sim z.
float sheetHeight(vec2 local) {
  return -sheetDepth(vec2(local.x, -local.y));
}

varying vec2 vSim;
`;

// The sheet's surface is only its lines: one colour, nothing between them.
// Drawn from the flat sheet's sim coordinates, so the grid bends with the
// dents like the diagram's does.
const GRID_GLSL = /* glsl */ `
varying vec2 vSim;
uniform vec3 uGrid; // cell, line width px, line opacity
uniform vec2 uDetail; // divisions per cell, how far the finer lines are in
uniform vec3 uPatch;  // centre x, centre sim z, half side in cells

// 1 on a line through each integer value of the coordinate, 0 between, with
// the width held in pixels by the coordinate's screen-space derivative.
float lineAt(float coord, float width) {
  float g = abs(fract(coord - 0.5) - 0.5) / max(width, 1e-5);
  return 1.0 - min(g / uGrid.y, 1.0);
}
`;

// The finer grid keeps every line of the coarse one and fades in the ones
// between, so nothing slides while the cells multiply. The patch is a square
// whose edges sit on coarse lines, so the sheet ends on a line of its own.
const GRID_FRAGMENT = /* glsl */ `
vec2 cell = vSim / uGrid.x;
vec2 cellWidth = fwidth(cell);
vec2 fromPatch = abs(vSim - uPatch.xy) / uGrid.x;
if (max(fromPatch.x, fromPatch.y) > uPatch.z + max(cellWidth.x, cellWidth.y) * uGrid.y) discard;
float line = max(lineAt(cell.x, cellWidth.x), lineAt(cell.y, cellWidth.y));
vec2 fine = cell * uDetail.x;
vec2 fineWidth = cellWidth * uDetail.x;
float fineLine = max(lineAt(fine.x, fineWidth.x), lineAt(fine.y, fineWidth.y));
line = max(line, fineLine * uDetail.y);
diffuseColor.a *= line * uGrid.z;
// Between the lines writes no depth, so it never hides a link behind it.
if (diffuseColor.a < 0.01) discard;
`;

/** Where a link's sphere is on screen: centre, radius in pixels, and its
 *  distance from the camera, for stacking the DOM dots. */
export type DotPlacement = { sx: number; sy: number; sr: number; depth: number };

function readColor(name: string, fallback: string): Color {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new Color(value || fallback);
}

type Ball = {
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
  outline: Mesh<SphereGeometry, MeshBasicMaterial>;
};

export type TasteScene = {
  resize: (width: number, height: number) => void;
  /** Draws the sim and says where each link's sphere landed on screen. */
  render: (sim: Sim, visited: ReadonlySet<string>) => Map<string, DotPlacement>;
  /** A height above the top of the view at (x, z), to drop a link from. */
  startHeight: (x: number, z: number) => number;
  setView: (view: ViewTuning) => void;
  dispose: () => void;
};

export function createTasteScene(
  canvas: HTMLCanvasElement,
  initialView: ViewTuning = VIEW_DEFAULTS,
): TasteScene {
  let view = initialView;
  const paper = readColor("--sun-lighter", "#fef3c7");
  const ink = readColor("--brand-black", "#110a03");
  const sun = readColor("--sun", "#ffcc00");
  const code = readColor("--code", "#3b82f6");

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(paper);

  const fog = new Fog(paper, view.fogNear, view.fogFar);
  const scene = new Scene();
  scene.fog = fog;

  const camera = new PerspectiveCamera(view.fovLandscape, 1, 0.05, 40);

  // Light for the link spheres; the sheet is unlit, so its lines stay one
  // yellow however they bend. It stays put while the view circles, so the
  // highlights on the spheres travel round as the patch turns.
  scene.add(new HemisphereLight(0xffffff, 0xfff4d6, 1.9));
  const sunLight = new DirectionalLight(0xffffff, 1.4);
  const aimLight = (centerZ: number) => {
    sunLight.position.set(1.2, 4, -centerZ + 1.4);
    sunLight.target.position.set(0, 0, -centerZ);
  };
  aimLight(FIELD_DEFAULTS.centerZ);
  scene.add(sunLight, sunLight.target);

  const sheetGeometry = new PlaneGeometry(
    SHEET_WIDTH,
    SHEET_DEPTH,
    SHEET_SEGMENTS_X,
    SHEET_SEGMENTS_Z,
  );
  sheetGeometry.rotateX(-Math.PI / 2);
  sheetGeometry.translate(0, 0, -(SHEET_NEAR_Z + SHEET_DEPTH / 2));
  // Unlit: the material's colour is the line colour, as is.
  const sheetMaterial = new MeshBasicMaterial({
    color: sun,
    transparent: true,
  });

  const uniforms = {
    uWells: { value: Array.from({ length: MAX_WELLS }, () => new Vector3()) },
    uWellCount: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_WELLS }, () => new Vector4()) },
    uRippleCount: { value: 0 },
    uSag: { value: 0 },
    uWellSigma: { value: FIELD_DEFAULTS.wellSigma },
    uSheet: { value: new Vector3() },
    uRipple: { value: new Vector4() },
    uGrid: { value: new Vector3() },
    uDetail: { value: new Vector2() },
    uPatch: { value: new Vector3() },
  };
  sheetMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SHEET_GLSL}`)
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position.x, sheetHeight(position.xz), position.z);
        vSim = vec2(position.x, -position.z);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GRID_GLSL}`)
      .replace("#include <map_fragment>", GRID_FRAGMENT);
  };

  const sheet = new Mesh(sheetGeometry, sheetMaterial);
  // The GPU moves the vertices, so the CPU-side bounds are meaningless.
  sheet.frustumCulled = false;
  scene.add(sheet);

  // Where the view closes in: the middle of the dents, snapped to a coarse
  // grid line so the patch's edges land on lines too.
  const pivot = new Vector3();
  function findPivot(sim: Sim) {
    const cell = view.gridCell;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const body of sim.bodies) {
      x += body.x;
      y += body.y;
      z += body.z;
    }
    const count = Math.max(1, sim.bodies.length);
    // Halfway down the dents, so the rim and the links both stay in frame.
    pivot.set(
      Math.round(x / count / cell) * cell,
      y / count / 2,
      sim.bodies.length > 0
        ? Math.round(z / count / cell) * cell
        : sim.tune.centerZ,
    );
  }

  function feedSheet(sim: Sim, framing: number) {
    const tune = sim.tune;
    let wells = 0;
    for (const body of sim.bodies) {
      if (body.kind === "falling" || wells >= MAX_WELLS) continue;
      uniforms.uWells.value[wells]?.set(body.x, body.z, tune.linkMass);
      wells++;
    }
    uniforms.uWellCount.value = wells;

    let ripples = 0;
    for (const ripple of sim.ripples) {
      if (ripples >= MAX_WELLS) break;
      uniforms.uRipples.value[ripples]?.set(ripple.x, ripple.z, ripple.amp, ripple.age);
      ripples++;
    }
    uniforms.uRippleCount.value = ripples;

    uniforms.uSag.value = tune.sagPerLink * sim.bodies.length;
    uniforms.uWellSigma.value = tune.wellSigma;
    uniforms.uSheet.value.set(tune.centerZ, tune.sagSigma, tune.maxLinkDepth);
    uniforms.uRipple.value.set(
      tune.rippleSpeed,
      tune.rippleLife / 3,
      tune.rippleWidth * tune.rippleWidth,
      tune.rippleWavelength,
    );
    aimLight(tune.centerZ);
    uniforms.uGrid.value.set(view.gridCell, view.lineWidth, view.lineOpacity);
    uniforms.uDetail.value.set(Math.max(1, Math.round(view.endDivisions)), framing);
    // Shrinks through log space, so the far-off edges sweep in at an even
    // pace instead of arriving all at the end.
    const patch = Math.exp(
      lerp(Math.log(OPEN_PATCH_CELLS), Math.log(view.patchCells), framing),
    );
    uniforms.uPatch.value.set(pivot.x, pivot.z, patch);
  }

  const target = new Vector3();
  // The camera circles `target` at this distance and elevation, starting
  // from straight in front; while framing it slides from the tasting view to
  // the final one.
  function placeCamera(sim: Sim, framing: number) {
    const degrees = Math.PI / 180;
    const distance = lerp(view.cameraDistance, view.endDistance, framing);
    const elevation =
      lerp(view.cameraElevation, view.endElevation, framing) * degrees;
    const aim = lerp(view.cameraAim, view.endAim, framing) * degrees;
    const azimuth = orbitAngle(sim);
    target.set(
      lerp(0, pivot.x, framing),
      lerp(0, pivot.y, framing),
      -lerp(sim.tune.centerZ, pivot.z, framing),
    );
    const flat = distance * Math.cos(elevation);
    camera.position.set(
      target.x + flat * Math.sin(azimuth),
      target.y + distance * Math.sin(elevation),
      target.z + flat * Math.cos(azimuth),
    );
    camera.lookAt(target);
    camera.rotateX(aim);

    camera.fov = camera.aspect < 1 ? view.fovPortrait : view.fovLandscape;
    // Slide the picture, not the camera, so the patch turns in place off
    // centre: left of the copy on a wide stage, above it on a tall one.
    const shift = view.endShift * framing;
    if (camera.aspect < 1) {
      camera.setViewOffset(width, height, 0, shift * height, width, height);
    } else {
      camera.setViewOffset(width, height, shift * width, 0, width, height);
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // The fog backs off with the camera, so the patch reads as clearly
    // from the final distance as the sheet did up close.
    const backOff = distance - view.cameraDistance;
    fog.near = view.fogNear + backOff;
    fog.far = view.fogFar + backOff;
  }

  // A unit sphere, scaled to the tuned link radius each frame.
  const sphere = new SphereGeometry(1, 40, 24);
  let radius = FIELD_DEFAULTS.linkRadius;
  const balls = new Map<string, Ball>();

  function ballFor(id: string): Ball {
    const existing = balls.get(id);
    if (existing) return existing;
    const mesh = new Mesh(
      sphere,
      new MeshStandardMaterial({
        color: sun,
        roughness: 0.38,
        metalness: 0,
        transparent: true,
      }),
    );
    const outline = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: ink, side: BackSide, transparent: true }),
    );
    outline.scale.setScalar(OUTLINE_SCALE);
    mesh.add(outline);
    scene.add(mesh);
    const ball = { mesh, outline };
    balls.set(id, ball);
    return ball;
  }

  let width = 1;
  let height = 1;
  const probe = new Vector3();

  function toScreen(x: number, y: number, z: number) {
    probe.set(x, y, z).project(camera);
    return {
      sx: ((probe.x + 1) / 2) * width,
      sy: ((1 - probe.y) / 2) * height,
    };
  }

  /** Pixels per world unit at (x, y, z). */
  function pixelScale(x: number, y: number, z: number): number {
    const distance = camera.position.distanceTo(probe.set(x, y, z));
    const focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
    return focal / distance;
  }

  return {
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
    },

    render(sim, visited) {
      const framing = framingAmount(sim);
      findPivot(sim);
      placeCamera(sim, framing);
      feedSheet(sim, framing);
      radius = sim.tune.linkRadius;

      const placements = new Map<string, DotPlacement>();
      const alive = new Set<string>();
      for (const body of sim.bodies) {
        alive.add(body.id);
        const { mesh } = ballFor(body.id);
        // The sim tracks where a link touches the sheet; the sphere's centre
        // sits one radius above that.
        const cy = body.y + radius;
        mesh.position.set(body.x, cy, -body.z);
        mesh.scale.setScalar(radius);
        mesh.material.color.copy(visited.has(body.id) ? code : sun);

        const { sx, sy } = toScreen(body.x, cy, -body.z);
        placements.set(body.id, {
          sx,
          sy,
          sr: pixelScale(body.x, cy, -body.z) * radius,
          depth: camera.position.distanceTo(probe.set(body.x, cy, -body.z)),
        });
      }
      for (const [id, ball] of balls) {
        if (alive.has(id)) continue;
        scene.remove(ball.mesh);
        ball.mesh.material.dispose();
        ball.outline.material.dispose();
        balls.delete(id);
      }

      renderer.render(scene, camera);
      return placements;
    },

    startHeight(x, z) {
      // Screen height grows with world height along a vertical line in front
      // of the camera, so bisect for the lowest start that is fully above
      // the top edge.
      let low = 0;
      let high = 12;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        const top = toScreen(x, mid + radius * 3, -z).sy;
        if (top < 0) high = mid;
        else low = mid;
      }
      return high;
    },

    setView(next) {
      view = next;
    },

    dispose() {
      for (const ball of balls.values()) {
        ball.mesh.material.dispose();
        ball.outline.material.dispose();
      }
      sphere.dispose();
      sheetGeometry.dispose();
      sheetMaterial.dispose();
      renderer.dispose();
    },
  };
}
