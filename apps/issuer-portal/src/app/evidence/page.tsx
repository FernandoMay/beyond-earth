import type { Metadata } from 'next';
import { FileCheck2, Info, ShieldCheck } from 'lucide-react';
import { Badge, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Evidence register' };

export default function EvidencePage() {
  return (
    <PortalFrame
      title="Evidence register"
      subtitle="Versioned document digests linked to each illustrative asset record."
    >
      <div className="p-page">
        <div className="p-banner">
          <FileCheck2 size={16} />
          <div>
            <strong>Digests prove file integrity, not truth.</strong>
            <p>
              A matching SHA-256 digest shows that a file has not changed. It does not establish
              ownership, airworthiness or legal enforceability.
            </p>
          </div>
        </div>

        {demoSnapshot.assets.map((asset) => (
          <section className="p-card" key={asset.id}>
            <div className="p-card__head">
              <div>
                <h3>{asset.name}</h3>
                <p>
                  {asset.registryId} · {asset.documents.length} demo documents · {asset.evidenceCompleteness}% complete
                </p>
              </div>
              <Badge tone={asset.evidenceCompleteness >= 90 ? 'green' : 'amber'} dot>
                {asset.evidenceCompleteness >= 90 ? 'Complete' : 'In review'}
              </Badge>
            </div>
            <ProgressBar
              value={asset.evidenceCompleteness}
              label="Evidence completeness"
              tone={asset.evidenceCompleteness >= 90 ? 'green' : 'amber'}
            />
            <div className="s-evidence" style={{ marginTop: 16 }}>
              {asset.documents.map((document) => (
                <div className="s-evidence__item" key={document.id}>
                  <ShieldCheck size={15} />
                  <div>
                    <strong>{document.name}</strong>
                    <code>sha256:{document.digest}</code>
                    <small>
                      {document.kind} · {document.version} · added {document.addedAt}
                    </small>
                  </div>
                  <Badge tone={document.verified ? 'green' : 'amber'} dot>
                    {document.verified ? 'verified' : 'review'}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="p-callout">
          <Info size={13} />
          <span>
            Demo evidence files live in <code>fixtures/demo/</code>. The stored SHA-256 values were
            computed from those exact files. They are synthetic and must not be represented as
            production evidence.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
