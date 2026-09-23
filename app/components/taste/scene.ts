// WebGL rendering for the taste section. field.ts decides where everything
// is; this draws it: a lit, gridded sheet that runs off both sides and melts
// into fog at the back, and link spheres that sit in their dents and cast
// shadows on them. Sim coordinates map straight across, except that sim z
// (distance from the camera) points down three.js's -z.
import {
  BackSide,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import type { Sim } from "./field";
import {
  CENTER_Z,
  FUNNEL_DEPTH,
  FUNNEL_SIGMA_SHRINK,
  FUNNEL_SIGMA_START,
  LINK_MASS,
  LINK_RADIUS,
  MAX_LINK_DEPTH,
  RIPPLE_LIFE,
  RIPPLE_SPEED,
  RIPPLE_WAVELENGTH,
  RIPPLE_WIDTH,
  SAG_PER_LINK,
  SAG_SIGMA,
  WELL_SIGMA,
  collapseAmount,
  dissolve,
} from "./field";

// ── Tuning ───────────────────────────────────────────────────────────────────
const CAMERA_HEIGHT = 1;
const CAMERA_BACK = 1; // camera sits this far behind sim z = 0
// Aims so the landing zone sits about two-thirds down the view.
const CAMERA_PITCH = (11 * Math.PI) / 180;
const FOV_LANDSCAPE = 38;
const FOV_PORTRAIT = 50;

const SHEET_WIDTH = 30; // far past the view on both sides: reads as endless
const SHEET_DEPTH = 18;
const SHEET_NEAR_Z = 0.2;
const SHEET_SEGMENTS_X = 300;
const SHEET_SEGMENTS_Z = 170;
// Uniform array sizes; the sim never has more wells or ripples than links.
const MAX_WELLS = 8;
const GRID_CELL = 0.22; // world size of one grid square

const FOG_NEAR = 3.2;
const FOG_FAR = 11;

const OUTLINE_SCALE = 1.14; // inverted-hull outline, matching the site's ink borders
// ─────────────────────────────────────────────────────────────────────────────

// field.ts's depthAt, in GLSL, so the GPU bends the sheet every frame and
// the CPU only does the physics. p is (x, sim z). The same constants feed
// both; keep the two formulas in step.
const SHEET_GLSL = /* glsl */ `
uniform vec3 uWells[${MAX_WELLS}];   // x, z, mass
uniform int uWellCount;
uniform vec4 uRipples[${MAX_WELLS}]; // x, z, amplitude, age
uniform int uRippleCount;
uniform float uSag;
uniform float uWellSigma;
uniform float uCollapse;
uniform float uDrop;

float sheetGauss(float d2, float sigma) {
  return exp(-d2 / (2.0 * sigma * sigma));
}

float sheetDepth(vec2 p) {
  vec2 c = p - vec2(0.0, ${CENTER_Z.toFixed(4)});
  float cd2 = dot(c, c);
  float wells = uSag * sheetGauss(cd2, ${SAG_SIGMA.toFixed(4)});
  for (int i = 0; i < ${MAX_WELLS}; i++) {
    if (i >= uWellCount) break;
    vec2 d = p - uWells[i].xy;
    wells += uWells[i].z * sheetGauss(dot(d, d), uWellSigma);
  }
  float depth = ${MAX_LINK_DEPTH.toFixed(4)} * tanh(wells / ${MAX_LINK_DEPTH.toFixed(4)});
  if (uCollapse > 0.0) {
    float funnelSigma = ${FUNNEL_SIGMA_START.toFixed(4)} - ${FUNNEL_SIGMA_SHRINK.toFixed(4)} * uCollapse;
    depth += ${FUNNEL_DEPTH.toFixed(4)} * uCollapse * sheetGauss(cd2, funnelSigma);
  }
  for (int i = 0; i < ${MAX_WELLS}; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipples[i];
    float front = length(p - r.xy) - ${RIPPLE_SPEED.toFixed(4)} * r.w;
    float envelope = exp(-r.w / ${(RIPPLE_LIFE / 3).toFixed(4)})
      * exp(-(front * front) / ${(RIPPLE_WIDTH * RIPPLE_WIDTH).toFixed(4)});
    depth += r.z * envelope * cos(front / ${RIPPLE_WAVELENGTH.toFixed(4)} * 6.2831853);
  }
  return depth;
}

// Local mesh coordinates run x, height, -sim z.
float sheetHeight(vec2 local) {
  return -sheetDepth(vec2(local.x, -local.y)) - uDrop;
}
`;

export type DotPlacement = { sx: number; sy: number; sr: number; opacity: number };

function readColor(name: string, fallback: string): Color {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new Color(value || fallback);
}

/** A tileable grid square: paper fill, ink line on two edges. */
function gridTexture(paper: Color, ink: Color): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = `#${paper.getHexString()}`;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = `#${ink.getHexString()}`;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, size, 3);
    ctx.fillRect(0, 0, 3, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(SHEET_WIDTH / GRID_CELL, SHEET_DEPTH / GRID_CELL);
  return texture;
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
  dispose: () => void;
};

export function createTasteScene(canvas: HTMLCanvasElement): TasteScene {
  const paper = readColor("--sun-lighter", "#fef3c7");
  const ink = readColor("--brand-black", "#110a03");
  const sun = readColor("--sun", "#ffcc00");
  const code = readColor("--code", "#3b82f6");

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(paper);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.fog = new Fog(paper, FOG_NEAR, FOG_FAR);

  const camera = new PerspectiveCamera(FOV_LANDSCAPE, 1, 0.05, 40);
  camera.position.set(0, CAMERA_HEIGHT, CAMERA_BACK);
  camera.rotation.x = -CAMERA_PITCH;

  // Lambert divides by π, so ambient + direct·cosθ ≈ π keeps a flat, lit
  // sheet at exactly the paper colour: it meets the fog and the page without
  // a seam, and only the dents (and shadows) read darker.
  scene.add(new HemisphereLight(0xffffff, 0xfff4d6, 1.9));
  const sunLight = new DirectionalLight(0xffffff, 1.4);
  sunLight.position.set(1.2, 4, -CENTER_Z + 1.4);
  sunLight.target.position.set(0, 0, -CENTER_Z);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.radius = 6;
  sunLight.shadow.bias = -0.0005;
  const bounds = 1.8;
  sunLight.shadow.camera.left = -bounds;
  sunLight.shadow.camera.right = bounds;
  sunLight.shadow.camera.top = bounds;
  sunLight.shadow.camera.bottom = -bounds;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 10;
  scene.add(sunLight, sunLight.target);

  const sheetGeometry = new PlaneGeometry(
    SHEET_WIDTH,
    SHEET_DEPTH,
    SHEET_SEGMENTS_X,
    SHEET_SEGMENTS_Z,
  );
  sheetGeometry.rotateX(-Math.PI / 2);
  sheetGeometry.translate(0, 0, -(SHEET_NEAR_Z + SHEET_DEPTH / 2));
  const texture = gridTexture(paper, ink);
  const sheetMaterial = new MeshLambertMaterial({
    map: texture,
    transparent: true,
  });

  const uniforms = {
    uWells: { value: Array.from({ length: MAX_WELLS }, () => new Vector3()) },
    uWellCount: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_WELLS }, () => new Vector4()) },
    uRippleCount: { value: 0 },
    uSag: { value: 0 },
    uWellSigma: { value: WELL_SIGMA },
    uCollapse: { value: 0 },
    uDrop: { value: 0 },
  };
  sheetMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SHEET_GLSL}`)
      // Normals from the bent surface, by central differences, so the
      // dents catch the light.
      .replace(
        "#include <beginnormal_vertex>",
        `float e = 0.01;
        float dx = sheetHeight(position.xz + vec2(e, 0.0)) - sheetHeight(position.xz - vec2(e, 0.0));
        float dz = sheetHeight(position.xz + vec2(0.0, e)) - sheetHeight(position.xz - vec2(0.0, e));
        vec3 objectNormal = normalize(vec3(-dx / (2.0 * e), 1.0, -dz / (2.0 * e)));`,
      )
      .replace(
        "#include <begin_vertex>",
        "vec3 transformed = vec3(position.x, sheetHeight(position.xz), position.z);",
      );
  };

  const sheet = new Mesh(sheetGeometry, sheetMaterial);
  sheet.receiveShadow = true;
  // The GPU moves the vertices, so the CPU-side bounds are meaningless.
  sheet.frustumCulled = false;
  scene.add(sheet);

  function feedSheet(sim: Sim) {
    let wells = 0;
    for (const body of sim.bodies) {
      if (body.kind === "falling" || wells >= MAX_WELLS) continue;
      uniforms.uWells.value[wells]?.set(body.x, body.z, LINK_MASS);
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
    uniforms.uSag.value = SAG_PER_LINK * sim.bodies.length;
    uniforms.uWellSigma.value = WELL_SIGMA * (1 - 0.5 * collapse);
    uniforms.uCollapse.value = collapse;
  }

  const sphere = new SphereGeometry(LINK_RADIUS, 40, 24);
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
    mesh.castShadow = true;
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

  function pixelRadius(x: number, y: number, z: number): number {
    const distance = camera.position.distanceTo(probe.set(x, y, z));
    const focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
    return (LINK_RADIUS / distance) * focal;
  }

  return {
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 1 ? FOV_PORTRAIT : FOV_LANDSCAPE;
      camera.updateProjectionMatrix();
    },

    render(sim, visited) {
      feedSheet(sim);
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
        const cy = body.y + LINK_RADIUS;
        mesh.position.set(body.x, cy, -body.z);
        mesh.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * body.opacity));
        mesh.material.color.copy(visited.has(body.id) ? code : sun);
        mesh.material.opacity = body.opacity;
        outline.material.opacity = body.opacity;
        mesh.visible = body.opacity > 0.01;

        const { sx, sy } = toScreen(body.x, cy, -body.z);
        placements.set(body.id, {
          sx,
          sy,
          sr: pixelRadius(body.x, cy, -body.z) * mesh.scale.x,
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
        const top = toScreen(x, mid + LINK_RADIUS * 3, -z).sy;
        if (top < 0) high = mid;
        else low = mid;
      }
      return high;
    },

    dispose() {
      for (const ball of balls.values()) {
        ball.mesh.material.dispose();
        ball.outline.material.dispose();
      }
      sphere.dispose();
      sheetGeometry.dispose();
      sheetMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
