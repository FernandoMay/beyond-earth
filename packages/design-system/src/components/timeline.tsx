import type { AssetMilestone } from '@aerospace/shared-types';

export function Timeline({ milestones }: { milestones: AssetMilestone[] }) {
  return (
    <ol className="ar-timeline">
      {milestones.map((milestone) => (
        <li key={milestone.id} className={`ar-timeline__item is-${milestone.status}`}>
          <span className="ar-timeline__marker" aria-hidden="true" />
          <div className="ar-timeline__body">
            <div className="ar-timeline__top">
              <strong>{milestone.label}</strong>
              <time className="ar-mono" dateTime={milestone.date}>
                {milestone.date}
              </time>
            </div>
            <p>{milestone.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
