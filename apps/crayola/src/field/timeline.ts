import type { FieldTuning, Sim } from "./field";
import { FIELD_DEFAULTS, createSim, spawnBody, startFraming, step } from "./field";

/**
 * Roteiro do campo: quando cada link cai e quanto esperar entre o último
 * pousar e a câmera se aproximar. Na landing isso vinha de quem segurava o
 * botão; aqui é fixo, e o estado num frame qualquer sai de rodar a simulação
 * do zero até ele.
 */
export type FieldScript = {
  seed: number;
  /** Segundos em que cada link é solto, em ordem. */
  drops: readonly number[];
  /** Pausa entre o último link parar e o enquadramento final começar. */
  framingDelaySeconds: number;
  /** Começa no plano final, girando, em vez da vista aberta da landing. */
  startFramed?: boolean;
  tune?: FieldTuning;
};

// Passos fixos, independentes do fps, pra física dar o mesmo resultado no
// Studio e no render.
const STEP_SECONDS = 1 / 120;

type Run = {
  key: string;
  script: FieldScript;
  sim: Sim;
  steps: number;
  nextDrop: number;
  settled: number;
  framingAt: number;
};

function freshRun(script: FieldScript, key: string): Run {
  return {
    key,
    script,
    sim: createSim(script.seed, script.tune ?? FIELD_DEFAULTS, script.startFramed),
    steps: 0,
    nextDrop: 0,
    settled: 0,
    framingAt: Infinity,
  };
}

function advance(run: Run): void {
  const { script, sim } = run;
  const now = run.steps * STEP_SECONDS;
  while (run.nextDrop < script.drops.length && (script.drops[run.nextDrop] ?? Infinity) <= now) {
    spawnBody(sim, `link-${run.nextDrop}`);
    run.nextDrop++;
  }
  if (now >= run.framingAt) startFraming(sim);

  for (const event of step(sim, STEP_SECONDS)) {
    if (event.kind !== "settled") continue;
    run.settled++;
    if (run.settled === script.drops.length) {
      run.framingAt = now + script.framingDelaySeconds;
    }
  }
  run.steps++;
}

// Uma aba de render pede frames em sequência; guardar a última corrida evita
// refazer tudo do zero a cada frame. Voltar no tempo (Studio) ou mudar o
// roteiro recomeça. A chave é o conteúdo, não a identidade do objeto: o Studio
// recria as props a cada edição.
let last: Run | undefined;

/** Estado da simulação aos `seconds` segundos do roteiro. */
export function simulateAt(script: FieldScript, seconds: number): Sim {
  const target = Math.round(seconds / STEP_SECONDS);
  const key = JSON.stringify(script);
  if (!last || last.key !== key || last.steps > target) {
    last = freshRun(script, key);
  }
  while (last.steps < target) advance(last);
  return last.sim;
}

/** Momentos do roteiro que a composition usa pra marcar as próprias batidas. */
export type FieldMoments = {
  /** Primeiro link toca a folha. */
  landedAt: number;
  /** Todos os links pousados e a folha parada no fundo de repouso. */
  sunkAt: number;
};

const SUNK_TOLERANCE = 0.015; // fração de `linkMass`
const SUNK_SPEED = 0.02; // da profundidade, por segundo

const momentsCache = new Map<string, FieldMoments>();

/** Roda o roteiro à parte (até `limitSeconds`) e diz quando cada coisa
 *  acontece. As batidas da composition saem daqui, e não de segundos
 *  chutados: mudar a física move a animação junto. */
export function fieldMoments(script: FieldScript, limitSeconds = 20): FieldMoments {
  const key = JSON.stringify(script);
  const cached = momentsCache.get(key);
  if (cached) return cached;

  const run = freshRun(script, key);
  const moments = { landedAt: Infinity, sunkAt: Infinity };
  const limit = Math.round(limitSeconds / STEP_SECONDS);
  while (run.steps < limit && moments.sunkAt === Infinity) {
    advance(run);
    const now = run.steps * STEP_SECONDS;
    const { bodies, tune } = run.sim;
    const landed = bodies.filter((body) => body.kind !== "falling");
    if (landed.length === 0) continue;
    if (moments.landedAt === Infinity) moments.landedAt = now;

    const allIn = run.nextDrop === script.drops.length && landed.length === bodies.length;
    const still = landed.every(
      (body) =>
        Math.abs(body.load - tune.linkMass) < tune.linkMass * SUNK_TOLERANCE &&
        Math.abs(body.loadV) < SUNK_SPEED,
    );
    if (allIn && still) moments.sunkAt = now;
  }
  momentsCache.set(key, moments);
  return moments;
}
