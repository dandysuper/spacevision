import type { ReactNode } from 'react';
import type { Metric } from '../../lib/format';

interface StatRowProps {
  label: string;
  metric: Metric;
  highlight?: boolean;
}

export function StatRow({ label, metric, highlight }: StatRowProps) {
  return (
    <div className="sv-row">
      <span className="sv-row-k">{label}</span>
      <span className="sv-row-v" data-highlight={highlight ? 'true' : undefined}>
        {metric.value}
        {metric.unit ? <small>{metric.unit}</small> : null}
      </span>
    </div>
  );
}

interface StatBlockProps {
  title: string;
  aside?: string;
  children: ReactNode;
}

export function StatBlock({ title, aside, children }: StatBlockProps) {
  return (
    <div className="sv-block">
      <div className="sv-block-head">
        <span className="sv-block-title">{title}</span>
        {aside ? <span className="sv-label">{aside}</span> : null}
      </div>
      {children}
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  unit: string;
}

export function Tile({ label, value, unit }: TileProps) {
  return (
    <div className="sv-tile">
      <span className="sv-label">{label}</span>
      <span className="sv-tile-v">
        {value}
        {unit ? <small>{unit}</small> : null}
      </span>
    </div>
  );
}

interface TileGridProps {
  children: ReactNode;
}

export function TileGrid({ children }: TileGridProps) {
  return <div className="sv-tiles">{children}</div>;
}
