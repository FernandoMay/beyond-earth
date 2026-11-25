import { ButtonLink, PublicPage } from '@aerospace/design-system';

export default function NotFound() {
  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="ar-eyebrow">
            <span className="ar-eyebrow__line" />
            404 / REGISTRY LOOKUP
          </div>
          <h1>
            Record not found.
            <br />
            <span className="w-silver">No fabricated assets.</span>
          </h1>
          <p>
            This registry does not contain the requested structure. Return to the marketplace or
            review the protocol asset models.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            <ButtonLink href="/marketplace">Return to marketplace</ButtonLink>
            <ButtonLink href="/protocol#asset-models" variant="secondary">
              Asset models
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
