'use client';

import { useState } from 'react';
import { Check, Info, ShieldCheck } from 'lucide-react';
import { Badge, Button, ProgressBar } from '@aerospace/design-system';
import { WalletButton } from '@aerospace/wallet';

const STEPS = ['Profile', 'Eligibility', 'Wallet', 'Review'] as const;

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [jurisdiction, setJurisdiction] = useState('Illustrative EU jurisdiction');
  const [category, setCategory] = useState('Professional investor');
  const [experience, setExperience] = useState('Aerospace / infrastructure');
  const [ack, setAck] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="i-onboard">
      <div className="i-form">
        <div className="p-card__head" style={{ marginBottom: 0 }}>
          <div>
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7, letterSpacing: '0.1em' }}>
              DEMO ELIGIBILITY REVIEW
            </span>
            <h3 style={{ marginTop: 6, fontSize: 18 }}>{STEPS[step]}</h3>
            <p>Step {step + 1} of {STEPS.length} · no real identity data is collected.</p>
          </div>
          <Badge tone="amber">Synthetic</Badge>
        </div>

        <ProgressBar value={((step + 1) / STEPS.length) * 100} label="Onboarding progress" />

        {step === 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="i-form__row">
              <label>
                <span>Display name</span>
                <input defaultValue="Demo Institutional Investor" />
              </label>
              <label>
                <span>Investor type</span>
                <select defaultValue="institution">
                  <option value="institution">Institution</option>
                  <option value="professional">Professional investor</option>
                  <option value="corporate">Corporate treasury</option>
                </select>
              </label>
            </div>
            <label>
              <span>Illustrative jurisdiction</span>
              <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
                <option>Illustrative EU jurisdiction</option>
                <option>Illustrative UK jurisdiction</option>
                <option>Illustrative Singapore jurisdiction</option>
                <option>Other jurisdiction (not admitted)</option>
              </select>
            </label>
            <div className="p-callout">
              <Info size={13} />
              <span>
                This is a product-state demonstration. A production flow would collect identity
                evidence through a regulated provider, not this form.
              </span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <span>Eligibility category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Professional investor</option>
                <option>Institutional investor</option>
                <option>Accredited investor</option>
              </select>
            </label>
            <label>
              <span>Relevant experience</span>
              <select value={experience} onChange={(event) => setExperience(event.target.value)}>
                <option>Aerospace / infrastructure</option>
                <option>Private markets</option>
                <option>Real assets</option>
                <option>None / limited</option>
              </select>
            </label>
            <div className="i-steps">
              {[
                ['Identity evidence', 'Synthetic record only', true],
                ['Sanctions screening', 'Demo pass state', true],
                ['Source of funds', 'Review due 2027-06-30', false],
              ].map(([title, detail, done]) => (
                <div className={`i-steps__item ${done ? 'is-done' : ''}`} key={title as string}>
                  <span className="i-steps__index">{done ? <Check size={11} /> : '·'}</span>
                  <div>
                    <strong>{title as string}</strong>
                    <p>{detail as string}</p>
                  </div>
                  <Badge tone={done ? 'green' : 'amber'}>{done ? 'pass' : 'pending'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ color: 'var(--ar-muted)', fontSize: 10, lineHeight: 1.7 }}>
              A live Testnet flow would require a Freighter wallet connected to Stellar Testnet. The
              wallet address would be checked against the compliance contract before a subscription
              could be prepared.
            </p>
            <WalletButton />
            <div className="p-callout">
              <ShieldCheck size={13} />
              <span>
                The portal never asks for a seed phrase or secret key. Connecting a wallet only
                reveals a public address.
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="i-review">
              <div>
                <span>Investor</span>
                <b>Demo Institutional Investor</b>
              </div>
              <div>
                <span>Jurisdiction</span>
                <b>{jurisdiction}</b>
              </div>
              <div>
                <span>Eligibility</span>
                <b>{category}</b>
              </div>
              <div>
                <span>Experience</span>
                <b>{experience}</b>
              </div>
              <div>
                <span>Wallet</span>
                <b>Not required in demo</b>
              </div>
            </div>
            <label className="ar-checkbox">
              <input
                type="checkbox"
                checked={ack}
                onChange={(event) => {
                  setAck(event.target.checked);
                  setSubmitted(false);
                }}
              />
              <span>
                I understand this review is synthetic, does not complete KYC and does not make me
                eligible for any real offering.
              </span>
            </label>
            {submitted && (
              <div className="ar-alert ar-alert--amber" role="status">
                <Info size={13} />
                <span>
                  Demo complete. No verification provider was called, no compliance record was
                  created and no wallet was authorised.
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
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" size="sm" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}>
              Continue
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={!ack} onClick={() => setSubmitted(true)}>
              Finish demo review
            </Button>
          )}
        </div>
      </div>

      <div className="p-stack">
        <section className="p-card p-card--accent">
          <div className="p-card__head">
            <div>
              <h3>What a live review requires</h3>
              <p>Reference operating model</p>
            </div>
          </div>
          <div className="p-list">
            {[
              ['Regulated KYC/AML provider', 'Identity document, liveness and beneficial ownership checks.'],
              ['Compliance officer decision', 'Tier, jurisdiction, restrictions and expiry are recorded.'],
              ['Source-of-funds review', 'Evidence retained and periodically refreshed.'],
              ['On-chain eligibility record', 'The compliance contract stores the wallet authorisation.'],
            ].map(([title, detail]) => (
              <div className="p-list__item" key={title}>
                <span className="p-list__icon">
                  <ShieldCheck size={14} />
                </span>
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
              <h3>Current demo state</h3>
              <p>Read-only profile</p>
            </div>
            <Badge tone="green" dot>
              Verified
            </Badge>
          </div>
          <div className="i-eligibility">
            {[
              ['Verification', 'verified · tier 2'],
              ['Expiry', '2027-06-30'],
              ['Jurisdiction', 'illustrative'],
              ['Transfer permission', 'demo only'],
            ].map(([label, value]) => (
              <div className="i-eligibility__item" key={label}>
                <span className="i-eligibility__icon">
                  <Check size={12} />
                </span>
                <div>
                  <strong>{label}</strong>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
