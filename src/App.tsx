import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { ARView } from './components/ar/ARView';
import { HudOverlay } from './components/HudOverlay';
import { CrewPanel } from './components/panels/CrewPanel';
import { DataPanel } from './components/panels/DataPanel';
import { WorldPanel } from './components/panels/WorldPanel';
import { CameraIcon, ChartIcon, CloseIcon, GlobeIcon, SuitIcon } from './components/ui/Icons';
import { formatNumber } from './lib/format';
import { deriveScenePalette } from './scene/palette';
import { Scene } from './scene/Scene';
import { useConfigStore } from './state/useConfigStore';
import type { DockView } from './state/useConfigStore';

interface DockEntry {
  id: DockView;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

const DOCK: DockEntry[] = [
  { id: 'world', label: 'World', Icon: GlobeIcon },
  { id: 'crew', label: 'Crew', Icon: SuitIcon },
  { id: 'data', label: 'Data', Icon: ChartIcon },
  { id: 'ar', label: 'AR', Icon: CameraIcon },
];

const VIEW_TITLES: Record<DockView, string> = {
  world: 'World parameters',
  crew: 'Crew parameters',
  data: 'Telemetry',
  ar: 'Augmented overlay',
};

function Intro({ onDismiss }: { onDismiss: () => void }) {
  const model = useConfigStore((state) => state.model);
  return (
    <div className="sv-intro">
      <div className="sv-intro-card">
        <span className="sv-label">Spacevision · environment model</span>
        <h1 className="sv-intro-title">
          Set the planet.
          <br />
          See what the body does.
        </h1>
        <p className="sv-hint" style={{ marginTop: 12 }}>
          Gravity, atmosphere, wind and temperature are real equations, not
          decoration. Dial the world, set the crew, then watch the figure walk,
          jump and fall under those numbers.
        </p>

        <div className="sv-intro-stats">
          <div>
            <span className="sv-label">Gravity</span>
            <span className="sv-intro-stat">{formatNumber(model.planet.gravityEarth, 2)} g</span>
          </div>
          <div>
            <span className="sv-label">Jump apex</span>
            <span className="sv-intro-stat">{formatNumber(model.human.jumpHeightM, 2)} m</span>
          </div>
          <div>
            <span className="sv-label">Airtime</span>
            <span className="sv-intro-stat">{formatNumber(model.human.airtimeS, 2)} s</span>
          </div>
        </div>

        <button type="button" className="sv-btn sv-btn--primary sv-btn--block" onClick={onDismiss}>
          Begin survey
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const view = useConfigStore((state) => state.view);
  const sheetOpen = useConfigStore((state) => state.sheetOpen);
  const action = useConfigStore((state) => state.action);
  const seed = useConfigStore((state) => state.seed);
  const model = useConfigStore((state) => state.model);
  const setView = useConfigStore((state) => state.setView);
  const setSheetOpen = useConfigStore((state) => state.setSheetOpen);
  const setAction = useConfigStore((state) => state.setAction);

  const [introOpen, setIntroOpen] = useState(true);

  const palette = useMemo(
    () => deriveScenePalette(model.params.planet, model.planet),
    [model]
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    if (view !== 'ar') setView('world');
  }, [setSheetOpen, setView, view]);

  useEffect(() => {
    if (view === 'ar') setSheetOpen(false);
  }, [view, setSheetOpen]);

  const onActionConsumed = useCallback(() => setAction('idle'), [setAction]);

  const panel =
    view === 'crew' ? <CrewPanel /> : view === 'data' ? <DataPanel /> : <WorldPanel />;

  return (
    <div className="sv-app">
      <div className="sv-stage">
        {view === 'ar' ? (
          <ARView />
        ) : (
          <>
            <Scene
              model={model}
              palette={palette}
              seed={seed}
              action={action}
              onActionConsumed={onActionConsumed}
            />
            <HudOverlay />
          </>
        )}

        <header className="sv-top">
          <div className="sv-brand">
            <span className="sv-brand-mark" />
            Spacevision
          </div>
          <div className="sv-seg" role="tablist" aria-label="Mode">
            <button
              type="button"
              role="tab"
              aria-selected={view !== 'ar'}
              className="sv-seg-item"
              data-active={view !== 'ar'}
              onClick={() => setView('world')}
            >
              Sim
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'ar'}
              className="sv-seg-item"
              data-active={view === 'ar'}
              onClick={() => setView('ar')}
            >
              AR
            </button>
          </div>
        </header>

        {introOpen ? <Intro onDismiss={() => setIntroOpen(false)} /> : null}
      </div>

      {view !== 'ar' ? (
        <section
          className="sv-sheet"
          data-open={sheetOpen}
          aria-label={VIEW_TITLES[view]}
        >
          <div className="sv-sheet-head">
            <span className="sv-sheet-title">{VIEW_TITLES[view]}</span>
            <button
              type="button"
              className="sv-icon-btn sv-mobile-only"
              onClick={closeSheet}
              aria-label="Close panel"
            >
              <CloseIcon size={14} />
            </button>
          </div>
          {panel}
        </section>
      ) : null}

      <nav className="sv-dock" aria-label="Sections">
        {DOCK.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="sv-dock-item"
            data-active={view === id}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
