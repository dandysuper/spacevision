interface PresetItem {
  id: string;
  name: string;
  sub: string;
}

interface PresetRailProps {
  items: PresetItem[];
  activeId: string;
  onSelect: (id: string) => void;
  label: string;
}

/** Horizontally scrolling preset picker. Keep every chip above 44 px tall. */
export function PresetRail({ items, activeId, onSelect, label }: PresetRailProps) {
  return (
    <div className="sv-rail" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === activeId}
          className="sv-chip"
          data-active={item.id === activeId}
          onClick={() => onSelect(item.id)}
        >
          {item.name}
          <small>{item.sub}</small>
        </button>
      ))}
    </div>
  );
}
