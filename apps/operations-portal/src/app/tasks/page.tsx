import type { Metadata } from 'next';
import { Badge, DataTable, type Column } from '@aerospace/design-system';
import { demoSnapshot, getDemoAssetById, type OperationsTask } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Task queue' };

export default function TasksPage() {
  const columns: Column<OperationsTask>[] = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--ar-ink)', fontSize: 9.5 }}>{row.title}</strong>
          <small style={{ display: 'block', color: 'var(--ar-faint)', fontSize: 7.5 }}>
            {getDemoAssetById(row.assetId)?.shortName} · {row.id}
          </small>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <span className="ar-mono">{row.type}</span> },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.dueDate}</span>,
    },
    { key: 'owner', header: 'Owner', render: (row) => row.owner },
    {
      key: 'priority',
      header: 'Priority',
      align: 'right',
      render: (row) => (
        <Badge
          tone={row.priority === 'high' ? 'red' : row.priority === 'medium' ? 'amber' : 'green'}
          dot
        >
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => (
        <Badge tone={row.status === 'done' ? 'green' : row.status === 'blocked' ? 'red' : 'blue'}>
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Task queue"
      subtitle="Synthetic lease, maintenance, insurance, valuation and distribution work items."
    >
      <div className="p-page">
        <div className="p-banner">
          <Badge tone="amber" dot>
            Illustrative
          </Badge>
          <div>
            <strong>Task data is generated.</strong>
            <p>
              Owners, dates and priorities are fabricated. No notification is sent and no workflow
              engine is connected.
            </p>
          </div>
        </div>

        <div className="o-gauge">
          <div>
            <span>Open</span>
            <strong>{demoSnapshot.tasks.filter((task) => task.status === 'open').length}</strong>
            <small>Not started</small>
          </div>
          <div>
            <span>In progress</span>
            <strong>
              {demoSnapshot.tasks.filter((task) => task.status === 'in_progress').length}
            </strong>
            <small>Assigned</small>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{demoSnapshot.tasks.filter((task) => task.status === 'blocked').length}</strong>
            <small>Requires escalation</small>
          </div>
        </div>

        <section className="p-card p-card--flush">
          <DataTable
            columns={columns}
            rows={demoSnapshot.tasks}
            getKey={(row) => row.id}
            caption="Illustrative operations tasks"
          />
        </section>

        <div className="p-callout">
          <Badge tone="amber">Demo</Badge>
          <span>
            A production operations queue would be backed by the API, with role-based assignment,
            audit history and notification delivery.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
