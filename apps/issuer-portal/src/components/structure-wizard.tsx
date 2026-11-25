'use client';

import { useState } from 'react';
import { Check, Info, Plus, ShieldCheck } from 'lucide-react';
import { Badge, Button, ProgressBar } from '@aerospace/design-system';

const STEPS = ['Asset', 'Evidence', 'Structure', 'Review'] as const;

export function StructureWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Reference Engine Lease II');
  const [vertical, setVertical] = useState('aviation');
  const [jurisdiction, setJurisdiction] = useState('Delaware, US · illustrative');
  const [structure, setStructure] = useState('SPV lease participation');
  const [tokenRights, setTokenRights] = useState('Pro-rata share of distributable lease receipts');
  const [ack, setAck] = useState(false);
  const [created, setCreated] = useState(false);

  return (
    <div className="s-wizard">
      <div className="s-wizard__form">
        <div className="s-wizard__progress">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`s-wizard__step ${index === step ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`}
            >
              <i>{index < step ? <Check size={10} /> : index + 1}</i>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <ProgressBar value={((step + 1) / STEPS.length) * 100} label="Draft progress" />

        {step === 0 && (
          <div className="s-wizard__grid">
            <label className="s-wizard__full">
              <span>Structure name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>Vertical</span>
              <select value={vertical} onChange={(event) => setVertical(event.target.value)}>
                <option value="aviation">Aviation</option>
                <option value="space">Space</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="drones">Drones</option>
              </select>
            </label>
            <label>
              <span>Asset category</span>
              <select defaultValue="engine">
                <option value="engine">Engine</option>
                <option value="aircraft">Aircraft</option>
                <option value="satellite">Satellite</option>
                <option value="tooling">Tooling</option>
                <option value="drone-fleet">Drone fleet</option>
              </select>
            </label>
            <label className="s-wizard__full">
              <span>Jurisdiction</span>
              <input value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)} />
            </label>
            <label className="s-wizard__full">
              <span>Description</span>
              <textarea
                rows={3}
                defaultValue="Reference structure for defined economic participation in lease receivables. Synthetic record for interface testing."
              />
            </label>
            <div className="p-callout s-wizard__full">
              <Info size={13} />
              <span>
                Only reference structures can be created here. No form submission leaves the
                browser, and no registry transaction is produced.
              </span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="s-evidence">
              {[
                ['Ownership / title record', 'Required', true],
                ['Registration or serial record', 'Required', true],
                ['Maintenance / inspection summary', 'Required', false],
                ['Insurance certificate', 'Required', false],
                ['Independent valuation', 'Required', false],
              ].map(([label, requirement, attached]) => (
                <div className="s-evidence__item" key={label as string}>
                  <ShieldCheck size={15} />
                  <div>
                    <strong>{label as string}</strong>
                    <code>sha256: pending synthetic digest</code>
                  </div>
                  <Badge tone={attached ? 'green' : 'amber'}>
                    {attached ? 'demo attached' : 'required'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm">
              <Plus size={12} /> Add demo document
            </Button>
            <div className="p-callout">
              <Info size={13} />
              <span>
                File uploads are intentionally disabled. The repository ships synthetic evidence
                files and their real SHA-256 digests for demonstration.
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="s-wizard__grid">
            <label className="s-wizard__full">
              <span>Legal structure</span>
              <select value={structure} onChange={(event) => setStructure(event.target.value)}>
                <option>SPV lease participation</option>
                <option>Service-receipt participation</option>
                <option>Equipment SPV participation</option>
                <option>Inventory / production proceeds</option>
              </select>
            </label>
            <label className="s-wizard__full">
              <span>Token represents</span>
              <textarea rows={3} value={tokenRights} onChange={(event) => setTokenRights(event.target.value)} />
            </label>
            <label>
              <span>Token symbol</span>
              <input defaultValue="rENG2" maxLength={10} />
            </label>
            <label>
              <span>Total units</span>
              <input type="number" defaultValue={12000} />
            </label>
            <label>
              <span>Unit price (USDC)</span>
              <input type="number" defaultValue={1000} />
            </label>
            <label>
              <span>Transfer restriction</span>
              <select defaultValue="eligible">
                <option value="eligible">Eligible investors only</option>
                <option value="lockup">Eligible + lock-up</option>
                <option value="institutional">Institutional only</option>
              </select>
            </label>
            <div className="p-callout s-wizard__full">
              <ShieldCheck size={13} />
              <span>
                <strong>Legal boundary.</strong> The token must not be described as automatic title
                to the engine. The rights field is stored as a product description, not a legal
                opinion.
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="s-summary">
              <div><span>Name</span><b>{name}</b></div>
              <div><span>Vertical</span><b>{vertical}</b></div>
              <div><span>Jurisdiction</span><b>{jurisdiction}</b></div>
              <div><span>Structure</span><b>{structure}</b></div>
              <div><span>Token rights</span><b>{tokenRights}</b></div>
              <div><span>Evidence</span><b>2 of 5 demo files attached</b></div>
              <div><span>Publication</span><b>Blocked · evidence incomplete</b></div>
            </div>
            <label className="ar-checkbox">
              <input
                type="checkbox"
                checked={ack}
                onChange={(event) => {
                  setAck(event.target.checked);
                  setCreated(false);
                }}
              />
              <span>
                I understand this creates nothing. No asset is registered, no token is deployed and
                no offering is published.
              </span>
            </label>
            {created && (
              <div className="ar-alert ar-alert--amber" role="status">
                <Info size={13} />
                <span>
                  Demo draft validated in the browser. API persistence is disabled in demo mode; no
                  database row or Soroban transaction was created.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-actions" style={{ justifyContent: 'space-between' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" size="sm" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}>
              Continue
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={!ack} onClick={() => setCreated(true)}>
              Validate demo draft
            </Button>
          )}
        </div>
      </div>

      <div className="p-stack">
        <section className="p-card p-card--accent">
          <div className="p-card__head">
            <div>
              <h3>Publication gates</h3>
              <p>Nothing publishes automatically</p>
            </div>
          </div>
          <div className="p-list">
            {[
              ['Evidence complete', 'All required digests attached and reviewed.'],
              ['Compliance approved', 'Jurisdictions and eligibility confirmed by an officer.'],
              ['Legal sign-off', 'SPV documents and token-rights wording reviewed.'],
              ['Technical review', 'Contract parameters match the offering terms.'],
              ['Registry verification', 'Asset state advanced on the registry contract.'],
            ].map(([title, detail]) => (
              <div className="p-list__item" key={title}>
                <div className="p-list__body">
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-card">
          <div className="p-card__head">
            <div>
              <h3>Structure boundary</h3>
              <p>What the token is not</p>
            </div>
            <Badge tone="amber">Read</Badge>
          </div>
          <p style={{ color: 'var(--ar-muted)', fontSize: 9, lineHeight: 1.7 }}>
            The token does not automatically convey title, possession, registration, airworthiness
            authority, spectrum rights, operational control or any right not expressly granted in the
            applicable documents. Production structures require jurisdiction-specific counsel.
          </p>
        </section>
      </div>
    </div>
  );
}
