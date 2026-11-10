/**
 * Desenho do campo em WebGL. field.ts decide onde tudo está; aqui se desenha:
 * uma folha transparente de linhas amarelas uniformes, como o diagrama do
 * buraco negro, que passa da vista por todos os lados e some na névoa lá no
 * fundo, e esferas de link sentadas nos afundados. Quando o último link pousa
 * a vista se aproxima: a folha vira um recorte quadrado em volta dos
 * afundados, ganha linhas mais finas, e gira.
 *
 * Portado de `links-amarelos/app/components/taste/scene.ts`. Diferenças pro
 * vídeo: cores chegam por parâmetro (não há CSS da página pra ler), o tamanho
 * é fixo, e não há botões DOM sobre as esferas nem `startHeight` — o roteiro
 * solta os links de `dropHeight`.
 *
 * As coordenadas da simulação passam direto, menos o z (distância da câmera),
 * que aponta pro -z do three.js.
 */
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
import { FIELD_DEFAULTS, framingAmount, orbitAngle, sagAmount } from "./field";

// ── Ajuste ───────────────────────────────────────────────────────────────────
export const VIEW_DEFAULTS = {
  // A câmera orbita o centro do poço: a essa distância, tantos graus acima
  // da folha, e inclinada pra cima por `cameraAim` pra o poço ficar baixo no
  // quadro.
  cameraDistance: 5,
  cameraElevation: 15,
  cameraAim: 2.5,
  fovLandscape: 36,
  fovPortrait: 44,

  gridCell: 0.19, // tamanho de um quadrado da grade, no mundo
  lineWidth: 1.2, // px — num frame de 1080 vale subir
  lineOpacity: 1,

  fogNear: 3.2,
  fogFar: 11,

  // Plano final: a câmera chega perto dos afundados e circula eles.
  endDistance: 7.5,
  endElevation: 32,
  endAim: 0,
  // Na landing o recorte ia pro lado pra dar lugar ao texto do final. No
  // quadrado do post não tem texto do lado, então fica no centro.
  endShift: 0,
  endDivisions: 2, // cada quadrado da grade se divide em tantos por lado
  patchCells: 5, // metade do lado do recorte, em quadrados (grossos)
  // Quanto do fundo dos afundados o alvo da câmera acompanha. A landing usa
  // metade, pra borda e os links caberem; com um link só, 0 deixa a câmera
  // parada enquanto a folha afunda.
  pivotDepthShare: 0.5,

  // Vista de lado: a câmera desce pra perto do plano da folha e mira mais
  // pro fundo, pra a profundidade dos afundados aparecer de perfil. Quem
  // desenha diz quanto (0 → 1) a cada frame; a landing nunca usa.
  sideElevation: 16,
  sidePivotDepthShare: 0.5,
};
export type ViewTuning = typeof VIEW_DEFAULTS;

export type FieldColors = {
  /** Fundo e névoa. */
  paper: string;
  /** Linhas da grade e esferas. */
  line: string;
  /** Contorno das esferas. */
  ink: string;
};

// Bem além da vista por todos os lados, atrás da câmera inclusive, pra borda
// nunca aparecer: lê como infinita.
const SHEET_WIDTH = 30;
const SHEET_DEPTH = 40;
const SHEET_NEAR_Z = -12; // z da sim; a câmera fica umas unidades atrás do 0
// 0,05 de mundo por segmento: fino o bastante pra ponta de um funil estreito
// não sair facetada.
const SHEET_SEGMENTS_X = 600;
const SHEET_SEGMENTS_Z = 800;
// Tamanho dos arrays de uniform; a sim nunca tem mais poços ou ondas que links.
const MAX_WELLS = 8;
// Metade do lado do recorte antes de fechar, em quadrados: bem além da vista,
// então começa lendo como a folha infinita.
const OPEN_PATCH_CELLS = 200;

const OUTLINE_SCALE = 1.14; // contorno por casca invertida, como as bordas de tinta do site
// ─────────────────────────────────────────────────────────────────────────────

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

// O depthAt do field.ts em GLSL, pra GPU curvar a folha a cada frame e a CPU
// só fazer a física. p é (x, z da sim). Os parâmetros chegam como uniforms;
// mantenha as duas fórmulas iguais.
const SHEET_GLSL = /* glsl */ `
uniform vec3 uWells[${MAX_WELLS}];   // x, z, massa
uniform int uWellCount;
uniform vec4 uRipples[${MAX_WELLS}]; // x, z, amplitude, idade
uniform int uRippleCount;
uniform float uSag;
uniform float uWellSigma;
uniform float uWellPower;
uniform float uWellTip;
uniform vec3 uSheet;  // centro z, sag sigma, profundidade máxima
uniform vec4 uRipple; // velocidade, vida / 3, largura², comprimento de onda

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
    float d2 = dot(d, d);
    float tip2 = uWellTip * uWellTip;
    float r2 = sqrt(d2 * d2 + tip2 * tip2);
    wells += uWells[i].z * exp(-pow(r2 / (2.0 * uWellSigma * uWellSigma), uWellPower / 2.0));
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

// Coordenadas locais da malha: x, altura, -z da sim.
float sheetHeight(vec2 local) {
  return -sheetDepth(vec2(local.x, -local.y));
}

varying vec2 vSim;
`;

// A superfície da folha é só as linhas: uma cor, nada entre elas. Desenhadas
// a partir das coordenadas da folha plana, então a grade curva com os
// afundados como no diagrama.
const GRID_GLSL = /* glsl */ `
varying vec2 vSim;
uniform vec3 uGrid; // quadrado, largura da linha em px, opacidade
uniform vec2 uDetail; // divisões por quadrado, quanto as linhas finas já entraram
uniform vec3 uPatch;  // centro x, centro z da sim, meio lado em quadrados

// 1 numa linha em cada inteiro da coordenada, 0 entre elas, com a largura
// presa em pixels pela derivada da coordenada na tela.
float lineAt(float coord, float width) {
  float g = abs(fract(coord - 0.5) - 0.5) / max(width, 1e-5);
  return 1.0 - min(g / uGrid.y, 1.0);
}
`;

// A grade fina mantém todas as linhas da grossa e faz as do meio aparecerem,
// então nada escorrega enquanto os quadrados se multiplicam. O recorte é um
// quadrado com bordas em linhas grossas, então a folha termina numa linha.
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
// Entre as linhas não grava profundidade, pra nunca esconder um link atrás.
if (diffuseColor.a < 0.01) discard;
`;

// Pra onde a vista fecha: o meio dos afundados, alinhado a uma linha grossa
// pra as bordas do recorte caírem em linhas também.
function findPivot(pivot: Vector3, sim: Sim, view: ViewTuning, side: number) {
  const cell = view.gridCell;
  let x = 0;
  let y = 0;
  let z = 0;
  let landed = 0;
  // Link no ar fica de fora: senão a câmera subiria atrás dele.
  for (const body of sim.bodies) {
    if (body.kind === "falling") continue;
    x += body.x;
    y += body.y;
    z += body.z;
    landed++;
  }
  const count = Math.max(1, landed);
  pivot.set(
    Math.round(x / count / cell) * cell,
    (y / count) * lerp(view.pivotDepthShare, view.sidePivotDepthShare, side),
    landed > 0 ? Math.round(z / count / cell) * cell : sim.tune.centerZ,
  );
}

const target = new Vector3();
/** Põe a câmera onde a vista manda neste momento da sim e devolve a
 *  distância dela ao alvo. A câmera circula o alvo a essa distância e
 *  elevação, começando de frente; durante o enquadramento ela desliza da
 *  vista inicial pra final. Fora da cena pra servir também a `linkOnScreen`,
 *  que projeta sem desenhar. */
function aimCamera(
  camera: PerspectiveCamera,
  pivot: Vector3,
  sim: Sim,
  view: ViewTuning,
  side: number,
  width: number,
  height: number,
): number {
  const framing = framingAmount(sim);
  findPivot(pivot, sim, view, side);
  const degrees = Math.PI / 180;
  const distance = lerp(view.cameraDistance, view.endDistance, framing);
  const elevation =
    lerp(
      lerp(view.cameraElevation, view.endElevation, framing),
      view.sideElevation,
      side,
    ) * degrees;
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

  camera.aspect = width / height;
  camera.fov = camera.aspect < 1 ? view.fovPortrait : view.fovLandscape;
  // Desliza a imagem, não a câmera, pra o recorte girar no lugar fora do
  // centro.
  const shift = view.endShift * framing;
  if (camera.aspect < 1) {
    camera.setViewOffset(width, height, 0, shift * height, width, height);
  } else {
    camera.setViewOffset(width, height, shift * width, 0, width, height);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return distance;
}

const probeCamera = new PerspectiveCamera(VIEW_DEFAULTS.fovLandscape, 1, 0.05, 40);
const probePivot = new Vector3();
const probe = new Vector3();

/** Onde o centro da esfera de um link aparece no canvas, em px, na mesma
 *  vista que `render` desenharia — pra pôr coisas do DOM em cima dele. */
export function linkOnScreen(
  sim: Sim,
  id: string,
  size: { width: number; height: number },
  view: ViewTuning = VIEW_DEFAULTS,
  side = 0,
): { x: number; y: number } | undefined {
  const body = sim.bodies.find((candidate) => candidate.id === id);
  if (!body) return undefined;
  aimCamera(probeCamera, probePivot, sim, view, side, size.width, size.height);
  probe.set(body.x, body.y + sim.tune.linkRadius, -body.z).project(probeCamera);
  return {
    x: ((probe.x + 1) / 2) * size.width,
    y: ((1 - probe.y) / 2) * size.height,
  };
}

type Ball = {
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
  outline: Mesh<SphereGeometry, MeshBasicMaterial>;
};

export type FieldScene = {
  /** `side` (0 → 1): quanto da vista de lado já entrou. */
  render: (sim: Sim, side?: number) => void;
  dispose: () => void;
};

export function createFieldScene(
  canvas: HTMLCanvasElement,
  size: { width: number; height: number },
  colors: FieldColors,
  view: ViewTuning = VIEW_DEFAULTS,
): FieldScene {
  const paper = new Color(colors.paper);
  const line = new Color(colors.line);
  const ink = new Color(colors.ink);
  const { width, height } = size;

  // preserveDrawingBuffer: o Remotion tira o print do frame depois do
  // render, e sem isso o buffer pode já ter sido limpo.
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(paper);

  const fog = new Fog(paper, view.fogNear, view.fogFar);
  const scene = new Scene();
  scene.fog = fog;

  const camera = new PerspectiveCamera(view.fovLandscape, width / height, 0.05, 40);

  // Luz pras esferas; a folha não é iluminada, então as linhas ficam num
  // amarelo só como quer que curvem. A luz fica parada enquanto a vista
  // circula, então o brilho nas esferas dá a volta junto.
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
  // Sem luz: a cor do material é a cor da linha, como está.
  const sheetMaterial = new MeshBasicMaterial({ color: line, transparent: true });

  const uniforms = {
    uWells: { value: Array.from({ length: MAX_WELLS }, () => new Vector3()) },
    uWellCount: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_WELLS }, () => new Vector4()) },
    uRippleCount: { value: 0 },
    uSag: { value: 0 },
    uWellSigma: { value: FIELD_DEFAULTS.wellSigma },
    uWellPower: { value: FIELD_DEFAULTS.wellPower },
    uWellTip: { value: FIELD_DEFAULTS.wellTip },
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
  // A GPU move os vértices, então os limites do lado da CPU não valem nada.
  sheet.frustumCulled = false;
  scene.add(sheet);

  const pivot = new Vector3();

  function feedSheet(sim: Sim, framing: number) {
    const tune = sim.tune;
    let wells = 0;
    for (const body of sim.bodies) {
      if (body.kind === "falling" || wells >= MAX_WELLS) continue;
      uniforms.uWells.value[wells]?.set(body.x, body.z, body.load);
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

    uniforms.uSag.value = sagAmount(sim);
    uniforms.uWellSigma.value = tune.wellSigma;
    uniforms.uWellPower.value = tune.wellPower;
    uniforms.uWellTip.value = tune.wellTip;
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
    // Encolhe no espaço log, pra as bordas distantes chegarem num ritmo
    // constante em vez de todas no fim.
    const patch = Math.exp(
      lerp(Math.log(OPEN_PATCH_CELLS), Math.log(view.patchCells), framing),
    );
    uniforms.uPatch.value.set(pivot.x, pivot.z, patch);
  }

  // Uma esfera unitária, escalada pro raio do link a cada frame.
  const sphere = new SphereGeometry(1, 40, 24);
  const balls = new Map<string, Ball>();

  function ballFor(id: string): Ball {
    const existing = balls.get(id);
    if (existing) return existing;
    const mesh = new Mesh(
      sphere,
      new MeshStandardMaterial({ color: line, roughness: 0.38, metalness: 0 }),
    );
    const outline = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: ink, side: BackSide }),
    );
    outline.scale.setScalar(OUTLINE_SCALE);
    mesh.add(outline);
    scene.add(mesh);
    const ball = { mesh, outline };
    balls.set(id, ball);
    return ball;
  }

  return {
    render(sim, side = 0) {
      const framing = framingAmount(sim);
      const distance = aimCamera(camera, pivot, sim, view, side, width, height);
      // A névoa recua junto com a câmera, pra o recorte ler tão claro da
      // distância final quanto a folha de perto.
      const backOff = distance - view.cameraDistance;
      fog.near = view.fogNear + backOff;
      fog.far = view.fogFar + backOff;
      feedSheet(sim, framing);
      const radius = sim.tune.linkRadius;

      const alive = new Set<string>();
      for (const body of sim.bodies) {
        alive.add(body.id);
        const { mesh } = ballFor(body.id);
        // A sim guarda onde o link toca a folha; o centro da esfera fica um
        // raio acima.
        mesh.position.set(body.x, body.y + radius, -body.z);
        mesh.scale.setScalar(radius);
      }
      for (const [id, ball] of balls) {
        if (alive.has(id)) continue;
        scene.remove(ball.mesh);
        ball.mesh.material.dispose();
        ball.outline.material.dispose();
        balls.delete(id);
      }

      renderer.render(scene, camera);
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
