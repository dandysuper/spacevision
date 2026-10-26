import { formatDistance, formatDuration, formatNumber } from '../lib/format';
import { useConfigStore } from '../state/useConfigStore';
import { useTelemetryStore } from '../state/useTelemetryStore';
import { DropIcon, JumpIcon, WalkIcon } from './ui/Icons';
import type { SceneAction } from '../state/useConfigStore';

/** The readouts that float over the world. Pure text, no chrome. */
export function HudOverlay() {
  const model = useConfigStore((state) => state.model);
  const planet = useConfigStore((state) => state.planet);
  const action = useConfigStore((state) => state.action);
  const setAction = useConfigStore((state) => state.setAction);

  const altitudeM = useTelemetryStore((state) => state.altitudeM);
  const speedMs = useTelemetryStore((state) => state.speedMs);
  const airborne = useTelemetryStore((state) => state.airborne);

  const jump = formatDistance(model.human.jumpHeightM);
  const airtime = formatDuration(model.human.airtimeS);
  const walking = action === 'walk';

  const toggle = (next: SceneAction) => {
    setAction(action === next ? 'idle' : next);
  };

  return (
    <>
      <div className="sv-hud">
        <div className="sv-hud-row">
          <div className="sv-hud-block">
            <span className="sv-hud-k">{planet.designation}</span>
            <span className="sv-hud-v sv-hud-v--lg">
              {formatNumber(model.planet.gravityEarth, 2)}
              <span className="sv-hud-k"> g</span>
            </span>
            <span className="sv-hud-k">
              {planet.name} · {formatNumber(planet.surfaceTempC, 0)} °C
            </span>
          </div>

          <div className="sv-hud-block sv-hud-block--right">
            <span className="sv-hud-k">Jump apex</span>
            <span className="sv-hud-v">
              {jump.value} {jump.unit}
            </span>
            <span className="sv-hud-k">Airtime</span>
            <span className="sv-hud-v">
              {airtime.value} {airtime.unit}
            </span>
          </div>
        </div>

        <div className="sv-hud-row">
          <div className="sv-hud-block">
            <span className="sv-hud-k">{airborne ? 'airborne' : 'on surface'}</span>
            <span className="sv-hud-v">
              {formatNumber(altitudeM, 2)} m · {formatNumber(speedMs, 2)} m/s
            </span>
            <span className="sv-hud-k">{model.human.gait.style} gait</span>
          </div>
        </div>
      </div>

      <div className="sv-actions">
        <button
          type="button"
          className="sv-act"
          data-active={walking}
          onClick={() => toggle('walk')}
          aria-label="Toggle walking"
          aria-pressed={walking}
        >
          <WalkIcon size={15} />
          Walk
        </button>
        <button
          type="button"
          className="sv-act"
          onClick={() => setAction('jump')}
          aria-label="Jump"
        >
          <JumpIcon size={15} />
          Jump
        </button>
        <button
          type="button"
          className="sv-act"
          onClick={() => setAction('drop')}
          aria-label="Drop from height"
        >
          <DropIcon size={15} />
          Drop
        </button>
      </div>
    </>
  );
}
