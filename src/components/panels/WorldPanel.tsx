import { PLANET_PRESETS } from '../../data/planetPresets';
import { formatGravityEarth, formatNumber } from '../../lib/format';
import { useConfigStore } from '../../state/useConfigStore';
import { PresetRail } from '../ui/PresetRail';
import { RerollIcon, ResetIcon } from '../ui/Icons';
import { SliderField } from '../ui/SliderField';
import { ToggleRow } from '../ui/ToggleRow';
import type { PlanetParams, SkyKind, TerrainKind } from '../../types/planet';

const TERRAIN_OPTIONS: Array<{ id: TerrainKind; label: string }> = [
  { id: 'regolith', label: 'Regolith' },
  { id: 'dune', label: 'Dune' },
  { id: 'basalt', label: 'Basalt' },
  { id: 'cratered', label: 'Cratered' },
  { id: 'volcanic', label: 'Volcanic' },
  { id: 'ice', label: 'Ice' },
  { id: 'methane', label: 'Methane' },
  { id: 'grass', label: 'Biome' },
  { id: 'gas', label: 'Gas' },
];

const SKY_OPTIONS: Array<{ id: SkyKind; label: string }> = [
  { id: 'vacuum', label: 'Vacuum' },
  { id: 'thin', label: 'Thin' },
  { id: 'dense', label: 'Dense' },
  { id: 'haze', label: 'Haze' },
];

const logFromValue = (value: number, floor: number): number =>
  Math.log10(value + floor);

const valueFromLog = (log: number, floor: number): number =>
  Math.max(0, Math.pow(10, log) - floor);

export function WorldPanel() {
  const planet = useConfigStore((state) => state.planet);
  const planetPresetId = useConfigStore((state) => state.planetPresetId);
  const model = useConfigStore((state) => state.model);
  const setPlanet = useConfigStore((state) => state.setPlanet);
  const selectPlanetPreset = useConfigStore((state) => state.selectPlanetPreset);
  const rerollWorld = useConfigStore((state) => state.rerollWorld);
  const resetToDefault = useConfigStore((state) => state.resetToDefault);

  const patch = (next: Partial<PlanetParams>) => setPlanet(next);

  return (
    <div className="sv-sheet-body">
      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Survey target</span>
          <span className="sv-label">{PLANET_PRESETS.length} bodies</span>
        </div>
        <PresetRail
          label="Planet presets"
          items={PLANET_PRESETS.map((item) => ({
            id: item.id,
            name: item.name,
            sub: `${formatNumber(item.surfaceGravityMs2, 2)} m/s²`,
          }))}
          activeId={planetPresetId}
          onSelect={selectPlanetPreset}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">{planet.name}</span>
          <span className="sv-label">{planet.designation}</span>
        </div>
        <p className="sv-hint">{planet.notes}</p>
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Surface physics</span>
        </div>

        <SliderField
          label="Surface gravity"
          value={planet.surfaceGravityMs2}
          min={0.05}
          max={30}
          step={0.01}
          display={formatNumber(planet.surfaceGravityMs2, 2)}
          unit="m/s²"
          sub={`${formatGravityEarth(model.planet.gravityEarth).value} g · escape ${formatNumber(
            model.planet.escapeVelocityMs / 1000,
            2
          )} km/s`}
          onChange={(value) => patch({ surfaceGravityMs2: value })}
        />

        <SliderField
          label="Body mass"
          value={logFromValue(planet.massKg, 1)}
          min={19}
          max={28}
          step={0.01}
          display={formatNumber(planet.massKg, 2)}
          unit="kg"
          sub={`radius ${formatNumber(model.planet.radiusM / 1000, 0)} km · density ${formatNumber(
            model.planet.bulkDensity / 1000,
            2
          )} g/cm³`}
          onChange={(log) => patch({ massKg: valueFromLog(log, 1) })}
        />

        <SliderField
          label="Surface temperature"
          value={planet.surfaceTempC}
          min={-250}
          max={700}
          step={1}
          display={formatNumber(planet.surfaceTempC, 0)}
          unit="°C"
          sub={`${formatNumber(planet.surfaceTempC + 273.15, 0)} K · water boils at ${formatNumber(
            model.planet.waterBoilingC,
            0
          )} °C here`}
          onChange={(value) => patch({ surfaceTempC: value })}
        />

        <SliderField
          label="Surface pressure"
          value={logFromValue(planet.surfacePressureKpa, 1)}
          min={0}
          max={4}
          step={0.005}
          display={formatNumber(planet.surfacePressureKpa, planet.surfacePressureKpa < 10 ? 3 : 1)}
          unit="kPa"
          sub={`${formatNumber(model.planet.atmosphereDensity, 3)} kg/m³ · ${
            model.planet.isVacuum ? 'vacuum' : `scale height ${formatNumber(model.planet.scaleHeightKm, 1)} km`
          }`}
          onChange={(log) => patch({ surfacePressureKpa: valueFromLog(log, 1) })}
        />

        <SliderField
          label="Wind speed"
          value={planet.windSpeedMs}
          min={0}
          max={200}
          step={0.5}
          display={formatNumber(planet.windSpeedMs, 1)}
          unit="m/s"
          sub={`${formatNumber(model.wind.forceN, 0)} N of drag · ${
            formatNumber(model.wind.leanDeg, 0)
          }° lean`}
          onChange={(value) => patch({ windSpeedMs: value })}
        />

        <SliderField
          label="Wind bearing"
          value={planet.windDirectionDeg}
          min={0}
          max={359}
          step={1}
          display={formatNumber(planet.windDirectionDeg, 0)}
          unit="°"
          onChange={(value) => patch({ windDirectionDeg: value })}
        />

        <SliderField
          label="Solar irradiance"
          value={logFromValue(planet.solarIrradianceWm2, 0.1)}
          min={-1}
          max={4.2}
          step={0.01}
          display={formatNumber(planet.solarIrradianceWm2, 1)}
          unit="W/m²"
          sub={`${formatNumber(planet.solarIrradianceWm2 / 1361, 2)}× Earth · blackbody ${formatNumber(
            model.planet.blackbodyEquilibriumC,
            0
          )} °C`}
          onChange={(log) => patch({ solarIrradianceWm2: Math.max(0.1, valueFromLog(log, 0.1)) })}
        />

        <SliderField
          label="Ground thermal inertia"
          value={planet.thermalInertia}
          min={0.02}
          max={1}
          step={0.01}
          display={formatNumber(planet.thermalInertia, 2)}
          unit=""
          sub="How strongly the surface stores and returns heat"
          onChange={(value) => patch({ thermalInertia: value })}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Appearance</span>
        </div>
        <ToggleRow
          label="Terrain"
          options={TERRAIN_OPTIONS}
          value={planet.terrain}
          onChange={(id) => patch({ terrain: id })}
        />
        <div className="sv-gap" />
        <ToggleRow
          label="Sky model"
          options={SKY_OPTIONS}
          value={planet.sky}
          onChange={(id) => patch({ sky: id })}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-stack">
          <button type="button" className="sv-btn sv-btn--block" onClick={rerollWorld}>
            <RerollIcon size={14} />
            Generate random world
          </button>
          <button type="button" className="sv-btn sv-btn--block sv-btn--ghost" onClick={resetToDefault}>
            <ResetIcon size={14} />
            Reset to defaults
          </button>
        </div>
      </section>
    </div>
  );
}
