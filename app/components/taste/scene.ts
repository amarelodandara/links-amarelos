// WebGL rendering for the taste section. field.ts decides where everything
// is; this draws it: a see-through sheet of uniform yellow grid lines, after
// the black-hole diagram, that runs past the view on every side and melts
// into fog at the back, and link spheres that sit in its dents. Sim coordinates map straight across, except that sim z
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
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import type { Sim } from "./field";
import { FIELD_DEFAULTS, collapseAmount, dissolve } from "./field";

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

const OUTLINE_SCALE = 1.14; // inverted-hull outline, matching the site's ink borders
// ─────────────────────────────────────────────────────────────────────────────

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
uniform float uCollapse;
uniform float uDrop;
uniform vec3 uSheet;  // centre z, sag sigma, max link depth
uniform vec3 uFunnel; // depth, sigma at start, sigma shrink
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
  if (uCollapse > 0.0) {
    float funnelSigma = uFunnel.y - uFunnel.z * uCollapse;
    depth += uFunnel.x * uCollapse * sheetGauss(cd2, funnelSigma);
  }
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
  return -sheetDepth(vec2(local.x, -local.y)) - uDrop;
}

varying vec2 vSim;
`;

// The sheet's surface is only its lines: one colour, nothing between them.
// Drawn from the flat sheet's sim coordinates, so the grid bends with the
// dents like the diagram's does.
const GRID_GLSL = /* glsl */ `
varying vec2 vSim;
uniform vec3 uGrid; // cell, line width px, line opacity

// 1 on a line through each integer value of the coordinate, 0 between, with
// the width held in pixels by the coordinate's screen-space derivative.
float lineAt(float coord, float width) {
  float g = abs(fract(coord - 0.5) - 0.5) / max(width, 1e-5);
  return 1.0 - min(g / uGrid.y, 1.0);
}
`;

const GRID_FRAGMENT = /* glsl */ `
vec2 cell = vSim / uGrid.x;
vec2 cellWidth = fwidth(cell);
float line = max(lineAt(cell.x, cellWidth.x), lineAt(cell.y, cellWidth.y));
diffuseColor.a *= line * uGrid.z;
// Between the lines writes no depth, so it never hides a link behind it.
if (diffuseColor.a < 0.01) discard;
`;

export type DotPlacement = { sx: number; sy: number; sr: number; opacity: number };

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
  // yellow however they bend.
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
    uCollapse: { value: 0 },
    uDrop: { value: 0 },
    uSheet: { value: new Vector3() },
    uFunnel: { value: new Vector3() },
    uRipple: { value: new Vector4() },
    uGrid: { value: new Vector3() },
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

  function feedSheet(sim: Sim) {
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

    const collapse = collapseAmount(sim);
    uniforms.uSag.value = tune.sagPerLink * sim.bodies.length;
    uniforms.uWellSigma.value =
      tune.wellSigma * (1 - tune.wellNarrowing * collapse);
    uniforms.uCollapse.value = collapse;
    uniforms.uSheet.value.set(tune.centerZ, tune.sagSigma, tune.maxLinkDepth);
    uniforms.uFunnel.value.set(
      tune.funnelDepth,
      tune.funnelSigmaStart,
      tune.funnelSigmaShrink,
    );
    uniforms.uRipple.value.set(
      tune.rippleSpeed,
      tune.rippleLife / 3,
      tune.rippleWidth * tune.rippleWidth,
      tune.rippleWavelength,
    );
    aimLight(tune.centerZ);
    uniforms.uGrid.value.set(view.gridCell, view.lineWidth, view.lineOpacity);
  }

  const target = new Vector3();
  function placeCamera(centerZ: number) {
    const elevation = (view.cameraElevation * Math.PI) / 180;
    target.set(0, 0, -centerZ);
    camera.position.set(
      0,
      view.cameraDistance * Math.sin(elevation),
      -centerZ + view.cameraDistance * Math.cos(elevation),
    );
    camera.lookAt(target);
    camera.rotateX((view.cameraAim * Math.PI) / 180);
    const fov = camera.aspect < 1 ? view.fovPortrait : view.fovLandscape;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    fog.near = view.fogNear;
    fog.far = view.fogFar;
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
      camera.fov = camera.aspect < 1 ? view.fovPortrait : view.fovLandscape;
      camera.updateProjectionMatrix();
    },

    render(sim, visited) {
      placeCamera(sim.tune.centerZ);
      feedSheet(sim);
      radius = sim.tune.linkRadius;
      const { fade, drop } = dissolve(sim);
      sheetMaterial.opacity = fade;
      uniforms.uDrop.value = drop;
      sheet.visible = fade > 0;

      const placements = new Map<string, DotPlacement>();
      const alive = new Set<string>();
      for (const body of sim.bodies) {
        alive.add(body.id);
        const { mesh, outline } = ballFor(body.id);
        // The sim tracks where a link touches the sheet; the sphere's centre
        // sits one radius above that.
        const cy = body.y + radius;
        mesh.position.set(body.x, cy, -body.z);
        mesh.scale.setScalar(
          radius * Math.max(0.001, 0.4 + 0.6 * body.opacity),
        );
        mesh.material.color.copy(visited.has(body.id) ? code : sun);
        mesh.material.opacity = body.opacity;
        outline.material.opacity = body.opacity;
        mesh.visible = body.opacity > 0.01;

        const { sx, sy } = toScreen(body.x, cy, -body.z);
        placements.set(body.id, {
          sx,
          sy,
          sr: pixelScale(body.x, cy, -body.z) * mesh.scale.x,
          opacity: body.opacity,
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
