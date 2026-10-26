import {
  formatAngle,
  formatDensity,
  formatDistance,
  formatDuration,
  formatEnergy,
  formatForce,
  formatGravityEarth,
  formatLongDistance,
  formatNumber,
  formatPower,
  formatPressure,
  formatSpeed,
  formatSurvival,
  formatTemperature,
} from '../../lib/format';
import { useConfigStore } from '../../state/useConfigStore';
import { useTelemetryStore } from '../../state/useTelemetryStore';
import { StatBlock, StatRow, Tile, TileGrid } from '../ui/StatBlock';
import { VerdictBanner } from '../ui/VerdictBanner';

export function DataPanel() {
  const model = useConfigStore((state) => state.model);
  const altitudeM = useTelemetryStore((state) => state.altitudeM);
  const speedMs = useTelemetryStore((state) => state.speedMs);
  const verticalMs = useTelemetryStore((state) => state.verticalMs);
  const airborne = useTelemetryStore((state) => state.airborne);

  const { planet, human, wind, thermal, pressure } = model;

  const jump = formatDistance(human.jumpHeightM);
  const airtime = formatDuration(human.airtimeS);
  const terminal = Number.isFinite(human.terminalVelocityMs)
    ? formatSpeed(human.terminalVelocityMs)
    : { value: 'NONE', unit: '' };

  return (
    <div className="sv-sheet-body">
      <section className="sv-sect">
        <VerdictBanner verdict={model.verdict} />
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Mobility envelope</span>
          <span className="sv-label">{human.gait.style}</span>
        </div>
        <TileGrid>
          <Tile label="Jump apex" value={jump.value} unit={jump.unit} />
          <Tile label="Airtime" value={airtime.value} unit={airtime.unit} />
          <Tile label="Terminal velocity" value={terminal.value} unit={terminal.unit} />
          <Tile
            label="10 m fall"
            value={formatNumber(human.fallTime10mS, 2)}
            unit="s"
          />
        </TileGrid>
        <div className="sv-gap" />
        <StatBlock title="Impulse">
          <StatRow
            label="Take-off speed"
            metric={{ value: formatNumber(human.jumpVelocityMs, 2), unit: 'm/s' }}
          />
          <StatRow label="Impact after 10 m" metric={formatSpeed(human.impactSpeed10mS)} />
          <StatRow label="Drag at walk" metric={formatForce(human.dragAtWalkN)} />
          <StatRow
            label="Peak stride force"
            metric={formatForce(
              human.totalMassKg *
                planet.gravityEarth *
                9.80665 *
                (1 + human.gait.flightFraction * 0.9)
            )}
          />
        </StatBlock>
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Live telemetry</span>
          <span className="sv-label">{airborne ? 'airborne' : 'grounded'}</span>
        </div>
        <TileGrid>
          <Tile label="Altitude" value={formatNumber(altitudeM, 2)} unit="m" />
          <Tile label="Horizontal" value={formatNumber(speedMs, 2)} unit="m/s" />
          <Tile label="Vertical" value={formatNumber(verticalMs, 2)} unit="m/s" />
          <Tile label="Stride rate" value={formatNumber(human.gait.strideFrequencyHz, 2)} unit="Hz" />
        </TileGrid>
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Atmosphere</span>
        </div>
        <StatBlock title="Air" aside={planet.isVacuum ? 'vacuum' : 'modelled'}>
          <StatRow label="Density" metric={formatDensity(planet.atmosphereDensity)} />
          <StatRow
            label="Scale height"
            metric={{ value: formatNumber(planet.scaleHeightKm, 1), unit: 'km' }}
          />
          <StatRow
            label="Speed of sound"
            metric={{ value: formatNumber(planet.speedOfSoundMs, 0), unit: 'm/s' }}
          />
          <StatRow label="Water boils at" metric={formatTemperature(planet.waterBoilingC)} />
          <StatRow label="Pressure" metric={formatPressure(planet.pressureKpa)} />
          <StatRow
            label="Earth atmospheres"
            metric={{ value: formatNumber(planet.pressureAtm, 3), unit: 'atm' }}
          />
        </StatBlock>
        <div className="sv-gap" />
        <StatBlock title="Wind">
          <StatRow label="Dynamic pressure" metric={formatPressure(wind.dynamicPressurePa / 1000)} />
          <StatRow label="Force on body" metric={formatForce(wind.forceN)} />
          <StatRow label="Lean required" metric={formatAngle(wind.leanDeg)} highlight />
          <StatRow
            label="Lateral accel"
            metric={{ value: formatNumber(wind.accelerationMs2, 2), unit: 'm/s²' }}
          />
        </StatBlock>
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Thermal balance</span>
          <span className="sv-label">{thermal.risk}</span>
        </div>
        <StatBlock title="Heat paths">
          <StatRow label="Radiated away" metric={formatPower(thermal.radiativeLossW)} />
          <StatRow label="Convected away" metric={formatPower(thermal.convectiveLossW)} />
          <StatRow label="Conducted to ground" metric={formatPower(thermal.conductiveLossW)} />
          <StatRow label="Total loss" metric={formatPower(thermal.totalLossW)} />
          <StatRow label="Metabolic input" metric={formatPower(model.params.human.metabolicRateW)} />
          <StatRow
            label="Net balance"
            metric={formatPower(thermal.netW)}
            highlight
          />
        </StatBlock>
        <div className="sv-gap" />
        <StatBlock title="Suit thermal control">
          <StatRow label="Demand" metric={formatPower(thermal.controlDemandW)} />
          <StatRow label="Capacity" metric={formatPower(thermal.controlCapacityW)} />
          <StatRow
            label="Load"
            metric={{
              value: formatNumber(
                (thermal.controlDemandW / Math.max(thermal.controlCapacityW, 1)) * 100,
                0
              ),
              unit: '%',
            }}
            highlight
          />
          <StatRow label="Unassisted equilibrium" metric={formatTemperature(thermal.equilibriumC)} />
          <StatRow label="Time to limit" metric={formatSurvival(thermal.survivalMinutes)} />
        </StatBlock>
      </section>

      <section className="sv-sect">
        <div className="sv-sect-head">
          <span className="sv-sect-title">Body & orbit</span>
        </div>
        <StatBlock title="Planet">
          <StatRow
            label="Radius"
            metric={formatLongDistance(planet.radiusM)}
          />
          <StatRow
            label="Bulk density"
            metric={{ value: formatNumber(planet.bulkDensity / 1000, 2), unit: 'g/cm³' }}
          />
          <StatRow
            label="Escape velocity"
            metric={{ value: formatNumber(planet.escapeVelocityMs / 1000, 2), unit: 'km/s' }}
          />
          <StatRow
            label="Orbital velocity"
            metric={{ value: formatNumber(planet.orbitalVelocityMs / 1000, 2), unit: 'km/s' }}
          />
          <StatRow label="Surface gravity" metric={formatGravityEarth(planet.gravityEarth)} />
          <StatRow
            label="Irradiance"
            metric={{
              value: formatNumber(model.params.planet.solarIrradianceWm2, 1),
              unit: 'W/m²',
            }}
          />
        </StatBlock>
        <div className="sv-gap" />
        <StatBlock title="Power budget">
          <StatRow
            label="Jump energy available"
            metric={formatEnergy(
              model.params.human.legEnergyJ * pressure.mobilityFactor
            )}
          />
          <StatRow
            label="Kinetic at take-off"
            metric={formatEnergy(
              0.5 * human.totalMassKg * human.jumpVelocityMs * human.jumpVelocityMs
            )}
          />
        </StatBlock>
      </section>
    </div>
  );
}
