import type { Verdict } from '../../types/simulation';

interface VerdictBannerProps {
  verdict: Verdict;
  compact?: boolean;
}

/** The one-line call on whether this crew can operate on this world. */
export function VerdictBanner({ verdict, compact }: VerdictBannerProps) {
  return (
    <div className="sv-verdict" data-level={verdict.level}>
      <span className="sv-verdict-mark" />
      <div>
        <div className="sv-verdict-text">
          <b>{verdict.headline}</b>
        </div>
        {compact ? null : <p className="sv-hint" style={{ marginTop: 4 }}>{verdict.detail}</p>}
      </div>
    </div>
  );
}
