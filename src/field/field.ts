/**
 * O campo de espaço-tempo do "caiu na rede": uma folha que cada link pousado
 * afunda com a própria massa. Simulação pura — sem React, sem desenho.
 *
 * Portado de `links-amarelos/app/components/taste/field.ts` (seção "prove os
 * links" da landing). Diferenças pro vídeo:
 * - o sorteio de onde cada link cai vem de um gerador com semente, então o
 *   mesmo frame sempre mostra a mesma coisa (o Remotion renderiza frames fora
 *   de ordem, em abas paralelas);
 * - sem `reducedMotion` nem `holdOrbit` — no vídeo ninguém abre card.
 *
 * Unidades do mundo: x é esquerda/direita, z é distância da câmera, e a folha
 * descansa na altura 0. `depthAt` é quanto a folha afunda em (x, z); a altura
 * da superfície ali é o negativo disso.
 */

// ── Ajuste ───────────────────────────────────────────────────────────────────
// Todos os botões num objeto só, lido também pelo scene.ts pra alimentar a
// cópia da forma da folha que roda na GPU (SHEET_GLSL lá).
export const FIELD_DEFAULTS = {
  // Forma da folha
  wellSigma: 0.42, // largura do afundado de um link
  // Perfil do afundado: 2 é o sino (gaussiana) da landing; perto de 1 vira
  // funil, de ponta fina e paredes quase retas.
  wellPower: 2,
  // Troca a ponta do funil por um fundo quase chato desse raio, pra o link
  // caber. 0 deixa a ponta como o perfil manda.
  wellTip: 0,
  linkMass: 0.2, // profundidade que um link carrega, já assentado
  sagPerLink: 0.03, // a folha toda cede pro centro
  sagSigma: 0.65,
  centerZ: 2, // pra onde a folha cede
  // Os poços se somam, mas a folha só estica até aqui: a soma tende a esse
  // teto, então links empilhados continuam em quadro.
  maxLinkDepth: 1.2,

  // Links
  linkRadius: 0.06, // raio de uma esfera de link, no mundo
  spawnSpreadX: 1.4, // largura da zona de queda
  spawnSpreadZ: 1, // profundidade da zona de queda
  spacing: 2.5, // distância mínima entre dois links, em raios
  dropHeight: 3, // altura de onde cada link é solto

  // Movimento
  gravity: 9,
  bounce: 0.01,
  minBounceSpeed: 1,
  slopePull: 7, // quanto a inclinação puxa um link deslizando
  slideDamping: 3.2,
  settleSpeed: 0.03,
  settleSeconds: 0.35,
  // Um link empurrado pelos vizinhos pode nunca sossegar de vez; depois de
  // tanto tempo na folha ele para onde estiver.
  maxSlideSeconds: 2.5,

  // Cama elástica: o poço de um link não aparece pronto. A folha é uma mola
  // que o link empurra ao cair — passa do fundo, volta um pouco e assenta.
  // Rígida e amortecida por padrão, como na landing, onde o poço quase
  // aparece de uma vez.
  sinkStiffness: 400, // quanto a folha puxa de volta pro fundo de repouso
  sinkDamping: 40, // quanto a folha segura o balanço
  impactPush: 0, // quanto da velocidade da queda vira velocidade do afundado

  // Ondulações
  rippleAmp: 0.01,
  rippleSpeed: 0.7,
  rippleWidth: 0.05,
  rippleWavelength: 0.05,
  rippleLife: 0.2,

  // Final: a câmera se aproxima dos afundados (scene.ts lê o progresso em
  // `framingAmount`), e depois o recorte gira sem parar.
  framingSeconds: 1.6,
  orbitSeconds: 48, // uma volta inteira
};
export type FieldTuning = typeof FIELD_DEFAULTS;
// ─────────────────────────────────────────────────────────────────────────────

type Common = {
  id: string;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  /** Profundidade do poço agora (tende a `linkMass`) e a velocidade dela. */
  load: number;
  loadV: number;
};

// Um link está no ar, deslizando na folha, ou parado. Só os dois primeiros
// carregam contabilidade de movimento, então as fases são tipos separados.
type Falling = Common & { kind: "falling"; vy: number; bounced: boolean };
type Sliding = Common & { kind: "sliding"; calmFor: number; slidFor: number };
type Resting = Common & { kind: "resting" };
export type Body = Falling | Sliding | Resting;

type Ripple = { x: number; z: number; amp: number; age: number };

// Depois do último link, a vista enquadra os afundados e começa a girar em
// volta deles. `spin` é o giro até aqui, em radianos.
type Stage =
  | { kind: "tasting" }
  | { kind: "framing"; t: number; spin: number }
  | { kind: "orbiting"; spin: number };

export type Sim = {
  bodies: Body[];
  ripples: Ripple[];
  stage: Stage;
  time: number;
  tune: FieldTuning;
  /** Estado do gerador com semente — avança a cada sorteio. */
  seed: number;
};

export type SimEvent = { kind: "settled"; id: string } | { kind: "framed" };

/** `framed` começa já no plano final, com o recorte girando — é como o post
 *  abre, ao contrário da landing, que só chega lá depois do último link. */
export function createSim(
  seed: number,
  tune: FieldTuning = FIELD_DEFAULTS,
  framed = false,
): Sim {
  return {
    bodies: [],
    ripples: [],
    stage: framed ? { kind: "orbiting", spin: 0 } : { kind: "tasting" },
    time: 0,
    tune,
    seed,
  };
}

/** mulberry32: um número em [0, 1) e o gerador um passo adiante. */
function random(sim: Sim): number {
  sim.seed = (sim.seed + 0x6d2b79f5) | 0;
  let t = sim.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── Forma do campo ───────────────────────────────────────────────────────────

const gaussian = (d2: number, sigma: number) =>
  Math.exp(-d2 / (2 * sigma * sigma));

/** O poço de um link: a gaussiana com o expoente trocado por `power`. Perto
 *  do centro a distância² vira √(d⁴ + tip⁴), que não desce de tip²: a ponta
 *  dá lugar a um fundo quase chato desse raio, e longe dele as paredes ficam
 *  onde estavam. */
const wellFalloff = (d2: number, sigma: number, power: number, tip: number) => {
  const r2 = Math.sqrt(d2 * d2 + tip ** 4);
  return Math.exp(-Math.pow(r2 / (2 * sigma * sigma), power / 2));
};

/** Quanto a folha afunda em (x, z). `skip` deixa de fora o poço de um corpo,
 *  pra um link deslizando sentir a inclinação dos outros e não a própria. */
export function depthAt(sim: Sim, x: number, z: number, skip?: Body): number {
  const tune = sim.tune;

  const dcx = x;
  const dcz = z - tune.centerZ;
  const centerD2 = dcx * dcx + dcz * dcz;
  let wells = sagAmount(sim) * gaussian(centerD2, tune.sagSigma);

  for (const body of sim.bodies) {
    if (body === skip || body.kind === "falling") continue;
    const dx = x - body.x;
    const dz = z - body.z;
    wells += body.load * wellFalloff(dx * dx + dz * dz, tune.wellSigma, tune.wellPower, tune.wellTip);
  }
  let depth = tune.maxLinkDepth * Math.tanh(wells / tune.maxLinkDepth);

  for (const ripple of sim.ripples) {
    const dx = x - ripple.x;
    const dz = z - ripple.z;
    const r = Math.sqrt(dx * dx + dz * dz);
    const front = r - tune.rippleSpeed * ripple.age;
    const envelope =
      Math.exp(-ripple.age / (tune.rippleLife / 3)) *
      Math.exp(-(front * front) / (tune.rippleWidth * tune.rippleWidth));
    depth +=
      ripple.amp *
      envelope *
      Math.cos((front / tune.rippleWavelength) * Math.PI * 2);
  }

  return depth;
}

/** Quanto a folha toda cede pro centro: cresce com o peso que já pousou. */
export function sagAmount(sim: Sim): number {
  let links = 0;
  for (const body of sim.bodies) links += body.load / sim.tune.linkMass;
  return sim.tune.sagPerLink * links;
}

// ── Links ────────────────────────────────────────────────────────────────────

/** Solta um link novo de `dropHeight`, num ponto sorteado da zona de queda. */
export function spawnBody(sim: Sim, id: string): void {
  const tune = sim.tune;
  const x = (random(sim) - 0.5) * tune.spawnSpreadX;
  const z = tune.centerZ + (random(sim) - 0.5) * tune.spawnSpreadZ;
  sim.bodies.push({
    id,
    x,
    z,
    y: tune.dropHeight,
    vx: 0,
    vz: 0,
    load: 0,
    loadV: 0,
    kind: "falling",
    vy: 0,
    bounced: false,
  });
}

export function startFraming(sim: Sim): void {
  if (sim.stage.kind !== "tasting") return;
  sim.stage = { kind: "framing", t: 0, spin: 0 };
}

/** Avança a simulação `dt` segundos. */
export function step(sim: Sim, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  const tune = sim.tune;
  sim.time += dt;

  sim.ripples = sim.ripples.filter((ripple) => {
    ripple.age += dt;
    return ripple.age < tune.rippleLife;
  });

  const stage = sim.stage;
  if (stage.kind === "framing") {
    stage.t = Math.min(1, stage.t + dt / tune.framingSeconds);
    // O giro ganha velocidade junto com o enquadramento, então nunca se vê
    // ele começar.
    stage.spin += spinStep(sim, stage.t, dt);
    if (stage.t >= 1) {
      sim.stage = { kind: "orbiting", spin: stage.spin };
      events.push({ kind: "framed" });
    }
  } else if (stage.kind === "orbiting") {
    stage.spin += spinStep(sim, 1, dt);
  }

  sim.bodies = sim.bodies.map((body) => {
    const next = sink(sim, advanceBody(sim, body, dt), dt);
    if (body.kind === "sliding" && next.kind === "resting") {
      events.push({ kind: "settled", id: next.id });
    }
    return next;
  });

  return events;
}

/** Um passo da mola do poço de um link pousado. */
function sink(sim: Sim, body: Body, dt: number): Body {
  if (body.kind === "falling") return body;
  const tune = sim.tune;
  const pull = tune.sinkStiffness * (tune.linkMass - body.load) - tune.sinkDamping * body.loadV;
  const loadV = body.loadV + pull * dt;
  const load = body.load + loadV * dt;
  return { ...body, load, loadV };
}

/** Radianos girados em `dt` a `speed` (0 → 1) da velocidade cheia. */
function spinStep(sim: Sim, speed: number, dt: number): number {
  return ((Math.PI * 2) / sim.tune.orbitSeconds) * speed * dt;
}

function advanceBody(sim: Sim, body: Body, dt: number): Body {
  const tune = sim.tune;
  switch (body.kind) {
    case "falling": {
      const vy = body.vy - tune.gravity * dt;
      const y = body.y + vy * dt;
      const surface = -depthAt(sim, body.x, body.z);
      if (y > surface) return { ...body, y, vy };

      if (!body.bounced) {
        sim.ripples.push({
          x: body.x,
          z: body.z,
          amp: tune.rippleAmp * Math.min(2, -vy / 3),
          age: 0,
        });
      }
      if (-vy > tune.minBounceSpeed) {
        return { ...body, y: surface, vy: -vy * tune.bounce, bounced: true };
      }
      // O que sobra da queda empurra a folha pra baixo.
      return {
        ...body,
        kind: "sliding",
        y: surface,
        loadV: -vy * tune.impactPush,
        calmFor: 0,
        slidFor: 0,
      };
    }

    case "sliding": {
      // Ladeira abaixo é pra mais fundo, então o puxão segue +∇depth de todos
      // os poços menos o do próprio link.
      const e = 0.01;
      const gx =
        (depthAt(sim, body.x + e, body.z, body) -
          depthAt(sim, body.x - e, body.z, body)) /
        (2 * e);
      const gz =
        (depthAt(sim, body.x, body.z + e, body) -
          depthAt(sim, body.x, body.z - e, body)) /
        (2 * e);
      const damping = Math.exp(-tune.slideDamping * dt);
      let vx = (body.vx + gx * tune.slopePull * dt) * damping;
      let vz = (body.vz + gz * tune.slopePull * dt) * damping;
      let x = body.x + vx * dt;
      let z = body.z + vz * dt;

      // Links nunca se sobrepõem: sai de dentro do vizinho e perde a
      // velocidade que ia na direção dele.
      for (const other of sim.bodies) {
        if (other === body || other.kind === "falling") continue;
        const dx = x - other.x;
        const dz = z - other.z;
        const dist = Math.hypot(dx, dz);
        const min = tune.linkRadius * tune.spacing;
        if (dist > 0 && dist < min) {
          const nx = dx / dist;
          const nz = dz / dist;
          x = other.x + nx * min;
          z = other.z + nz * min;
          const into = vx * nx + vz * nz;
          if (into < 0) {
            vx -= into * nx;
            vz -= into * nz;
          }
        }
      }

      const y = -depthAt(sim, x, z);
      const speed = Math.hypot(vx, vz);
      const calmFor = speed < tune.settleSpeed ? body.calmFor + dt : 0;
      const slidFor = body.slidFor + dt;
      if (calmFor >= tune.settleSeconds || slidFor >= tune.maxSlideSeconds) {
        return { ...body, kind: "resting", x, z, y, vx: 0, vz: 0 };
      }
      return { ...body, x, z, y, vx, vz, calmFor, slidFor };
    }

    case "resting":
      return { ...body, y: -depthAt(sim, body.x, body.z) };
  }
}

// ── Pro renderizador ─────────────────────────────────────────────────────────

/** Progresso 0 → 1 da aproximação pro plano final, com ease in-out. */
export function framingAmount(sim: Sim): number {
  switch (sim.stage.kind) {
    case "tasting":
      return 0;
    case "framing": {
      const t = sim.stage.t;
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    case "orbiting":
      return 1;
  }
}

/** Quanto a vista já girou em volta dos afundados, em radianos. */
export function orbitAngle(sim: Sim): number {
  return sim.stage.kind === "tasting" ? 0 : sim.stage.spin;
}
