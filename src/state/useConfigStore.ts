import { create } from 'zustand';
import { DEFAULT_HUMAN_ID, HUMAN_PRESETS, findHumanPreset } from '../data/humanPresets';
import { DEFAULT_PLANET_ID, PLANET_PRESETS, findPlanetPreset } from '../data/planetPresets';
import { buildModel } from '../physics';
import type { HumanParams } from '../types/human';
import type { PlanetParams } from '../types/planet';
import type { PhysicsModel } from '../types/simulation';

export type DockView = 'world' | 'crew' | 'data' | 'ar';
export type SceneAction = 'idle' | 'walk' | 'jump' | 'drop';

interface ConfigState {
  planet: PlanetParams;
  human: HumanParams;
  planetPresetId: string;
  humanPresetId: string;
  /** Physics is recomputed on every edit so the UI can never read stale data. */
  model: PhysicsModel;
  view: DockView;
  sheetOpen: boolean;
  action: SceneAction;
  /** Bumped whenever the world should be re-seeded (preset change / reroll). */
  seed: number;

  setPlanet: (patch: Partial<PlanetParams>) => void;
  selectPlanetPreset: (id: string) => void;
  setHuman: (patch: Partial<HumanParams>) => void;
  selectHumanPreset: (id: string) => void;
  setView: (view: DockView) => void;
  setSheetOpen: (open: boolean) => void;
  setAction: (action: SceneAction) => void;
  rerollWorld: () => void;
  resetToDefault: () => void;
}

const basePlanet: PlanetParams =
  findPlanetPreset(DEFAULT_PLANET_ID) ?? PLANET_PRESETS[0];
const baseHuman: HumanParams = findHumanPreset(DEFAULT_HUMAN_ID) ?? HUMAN_PRESETS[0];

/** Wipe the identity fields so a hand-edited world stops claiming to be a preset. */
function markCustom(planet: PlanetParams): PlanetParams {
  if (planet.id.startsWith('custom')) return planet;
  return { ...planet, id: `custom-${planet.id}`, designation: 'CUSTOM' };
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  planet: basePlanet,
  human: baseHuman,
  planetPresetId: basePlanet.id,
  humanPresetId: baseHuman.id,
  model: buildModel(basePlanet, baseHuman),
  view: 'world',
  sheetOpen: false,
  action: 'idle',
  seed: 1,

  setPlanet: (patch) =>
    set((state) => {
      const planet = markCustom({ ...state.planet, ...patch });
      return {
        planet,
        planetPresetId: '',
        model: buildModel(planet, state.human),
        seed: state.seed + 1,
      };
    }),

  selectPlanetPreset: (id) => {
    const preset = findPlanetPreset(id);
    if (!preset) return;
    set((state) => ({
      planet: preset,
      planetPresetId: id,
      model: buildModel(preset, state.human),
      seed: state.seed + 1,
      action: 'idle',
    }));
  },

  setHuman: (patch) =>
    set((state) => {
      const human = { ...state.human, ...patch, id: 'custom-human' };
      return {
        human,
        humanPresetId: '',
        model: buildModel(state.planet, human),
      };
    }),

  selectHumanPreset: (id) => {
    const preset = findHumanPreset(id);
    if (!preset) return;
    set((state) => ({
      human: preset,
      humanPresetId: id,
      model: buildModel(state.planet, preset),
      action: 'idle',
    }));
  },

  setView: (view) =>
    set((state) => ({
      view,
      sheetOpen: view !== 'world',
      action: view === 'world' ? state.action : 'idle',
    })),

  setSheetOpen: (sheetOpen) => set({ sheetOpen }),

  setAction: (action) => set({ action }),

  rerollWorld: () => {
    const { planet, human } = get();
    const jitter = (value: number, spread: number): number =>
      value * (1 + (Math.random() - 0.5) * spread);
    const next: PlanetParams = {
      ...planet,
      id: 'custom-reroll',
      designation: 'UNSURVEYED',
      surfaceGravityMs2: Math.min(30, Math.max(0.05, jitter(planet.surfaceGravityMs2, 0.9))),
      surfaceTempC: Math.min(700, Math.max(-250, planet.surfaceTempC + (Math.random() - 0.4) * 260)),
      surfacePressureKpa: Math.max(
        0,
        Math.min(9200, jitter(planet.surfacePressureKpa + 0.4, 2.2))
      ),
      windSpeedMs: Math.abs(jitter(planet.windSpeedMs + 1.5, 2.4)),
      solarIrradianceWm2: Math.max(0.4, jitter(planet.solarIrradianceWm2, 1.6)),
    };
    set((state) => ({
      planet: next,
      planetPresetId: '',
      model: buildModel(next, human),
      seed: state.seed + 1,
    }));
  },

  resetToDefault: () =>
    set((state) => ({
      planet: basePlanet,
      human: baseHuman,
      planetPresetId: basePlanet.id,
      humanPresetId: baseHuman.id,
      model: buildModel(basePlanet, baseHuman),
      seed: state.seed + 1,
      action: 'idle',
    })),
}));

/** Convenience selector — the derived physical model of the current world. */
export const selectModel = (state: ConfigState): PhysicsModel => state.model;
