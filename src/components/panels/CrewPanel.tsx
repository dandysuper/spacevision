import { HUMAN_PRESETS } from '../../data/humanPresets';
import {
  formatClo,
  formatEnergy,
  formatForce,
  formatGravityEarth,
  formatMass,
  formatNumber,
  formatPower,
  formatPressure,
} from '../../lib/format';
import { useConfigStore } from '../../state/useConfigStore';
import { PresetRail } from '../ui/PresetRail';
import { SliderField } from '../ui/SliderField';
import { StatBlock, StatRow } from '../ui/StatBlock';
import type { HumanParams } from '../../types/human';

export function CrewPanel() {
  const human = useConfigStore((state) => state.human);
  const humanPresetId = useConfigStore((state) => state.humanPresetId);
  const model = useConfigStore((state) => state.model);
  const setHuman = useConfigStore((state) => state.setHuman);
  const selectHumanPreset = useConfigStore((state) => state.selectHumanPreset);

  const patch = (next: Partial<HumanParams>) => setHuman(next);

  return (
    <div className="sv-sheet-body">
      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Crew configuration</span>
          <span className="sv-label">{HUMAN_PRESETS.length} loadouts</span>
        </div>
        <PresetRail
          label="Crew presets"
          items={HUMAN_PRESETS.map((item) => ({
            id: item.id,
            name: item.name,
            sub: `${formatNumber(item.bodyMassKg, 0)} kg`,
          }))}
          activeId={humanPresetId}
          onSelect={selectHumanPreset}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Body</span>
        </div>
        <SliderField
          label="Body mass"
          value={human.bodyMassKg}
          min={35}
          max={140}
          step={1}
          display={formatNumber(human.bodyMassKg, 0)}
          unit="kg"
          onChange={(value) => patch({ bodyMassKg: value })}
        />
        <SliderField
          label="Height"
          value={human.heightM}
          min={1.4}
          max={2.15}
          step={0.01}
          display={formatNumber(human.heightM, 2)}
          unit="m"
          sub={`leg length ${formatNumber(model.human.legLengthM, 2)} m · frontal area ${formatNumber(
            model.human.frontalAreaM2,
            2
          )} m²`}
          onChange={(value) => patch({ heightM: value })}
        />
        <SliderField
          label="Leg energy"
          value={human.legEnergyJ}
          min={80}
          max={700}
          step={5}
          display={formatNumber(human.legEnergyJ, 0)}
          unit="J"
          sub="Mechanical work one maximal jump can deliver"
          onChange={(value) => patch({ legEnergyJ: value })}
        />
        <SliderField
          label="Leg strength"
          value={human.legStrengthRatio}
          min={1}
          max={6}
          step={0.1}
          display={formatNumber(human.legStrengthRatio, 1)}
          unit="× BW"
          sub="Peak force as a multiple of body weight on Earth"
          onChange={(value) => patch({ legStrengthRatio: value })}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Suit</span>
        </div>
        <SliderField
          label="Suit mass"
          value={human.suitMassKg}
          min={0}
          max={150}
          step={1}
          display={formatNumber(human.suitMassKg, 0)}
          unit="kg"
          sub={`total ${formatNumber(model.human.totalMassKg, 0)} kg`}
          onChange={(value) => patch({ suitMassKg: value })}
        />
        <SliderField
          label="Suit pressure"
          value={human.suitPressureKpa}
          min={0}
          max={140}
          step={0.5}
          display={formatNumber(human.suitPressureKpa, 1)}
          unit="kPa"
          sub={`${formatNumber(model.pressure.deltaKpa, 0)} kPa differential · mobility ${formatNumber(
            model.pressure.mobilityFactor * 100,
            0
          )}%`}
          onChange={(value) => patch({ suitPressureKpa: value })}
        />
        <SliderField
          label="Insulation"
          value={human.suitInsulationClo}
          min={0.2}
          max={8}
          step={0.1}
          display={formatNumber(human.suitInsulationClo, 1)}
          unit="clo"
          onChange={(value) => patch({ suitInsulationClo: value })}
        />
        <SliderField
          label="Drag coefficient"
          value={human.dragCoefficient}
          min={0.4}
          max={1.6}
          step={0.01}
          display={formatNumber(human.dragCoefficient, 2)}
          unit=""
          onChange={(value) => patch({ dragCoefficient: value })}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Life support</span>
        </div>
        <SliderField
          label="Metabolic rate"
          value={human.metabolicRateW}
          min={80}
          max={900}
          step={5}
          display={formatNumber(human.metabolicRateW, 0)}
          unit="W"
          onChange={(value) => patch({ metabolicRateW: value })}
        />
        <SliderField
          label="Thermal control"
          value={human.thermalControlW}
          min={50}
          max={1200}
          step={10}
          display={formatNumber(human.thermalControlW, 0)}
          unit="W"
          sub="Peak heat the suit can move out of the body"
          onChange={(value) => patch({ thermalControlW: value })}
        />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Derived on this world</span>
        </div>
        <StatBlock title="Load" aside={`${formatNumber(model.human.loadFactor, 2)} g`}>
          <StatRow label="Total mass" metric={formatMass(model.human.totalMassKg)} />
          <StatRow label="Weight here" metric={formatForce(model.human.weightN)} />
          <StatRow label="Earth weight" metric={formatForce(model.human.earthWeightN)} />
          <StatRow
            label="Load factor"
            metric={formatGravityEarth(model.human.loadFactor)}
            highlight
          />
          <StatRow
            label="Body surface"
            metric={{ value: formatNumber(model.human.bodySurfaceAreaM2, 2), unit: 'm²' }}
          />
        </StatBlock>

        <div className="sv-gap" />

        <StatBlock title="Gait">
          <StatRow
            label="Style"
            metric={{ value: model.human.gait.style.toUpperCase(), unit: '' }}
            highlight
          />
          <StatRow
            label="Ground speed"
            metric={{ value: formatNumber(model.human.gait.speedMs, 2), unit: 'm/s' }}
          />
          <StatRow
            label="Cadence"
            metric={{ value: formatNumber(model.human.gait.strideFrequencyHz, 2), unit: 'Hz' }}
          />
          <StatRow
            label="Stride"
            metric={{ value: formatNumber(model.human.gait.strideLengthM, 2), unit: 'm' }}
          />
          <StatRow
            label="Contact"
            metric={{ value: formatNumber(model.human.gait.contactTimeS, 2), unit: 's' }}
          />
          <StatRow
            label="Flight fraction"
            metric={{ value: formatNumber(model.human.gait.flightFraction * 100, 0), unit: '%' }}
          />
        </StatBlock>

        <div className="sv-gap" />

        <StatBlock title="Suit envelope">
          <StatRow label="Suit pressure" metric={formatPressure(human.suitPressureKpa)} />
          <StatRow label="Ambient" metric={formatPressure(model.params.planet.surfacePressureKpa)} />
          <StatRow label="Differential" metric={formatPressure(model.pressure.deltaKpa)} highlight />
          <StatRow
            label="Mobility"
            metric={{ value: formatNumber(model.pressure.mobilityFactor * 100, 0), unit: '%' }}
          />
          <StatRow label="Insulation" metric={formatClo(human.suitInsulationClo)} />
          <StatRow label="Control capacity" metric={formatPower(model.thermal.controlCapacityW)} />
          <StatRow
            label="Usable jump energy"
            metric={formatEnergy(human.legEnergyJ * model.pressure.mobilityFactor)}
          />
        </StatBlock>
      </section>
    </div>
  );
}
