import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createManifest, sha256Hex, verifyManifest } from '../src/index';

const hello = Buffer.from('hello');
const appraisal = Buffer.from('# Synthetic appraisal\n\nReference only.\n');

describe('sha256Hex', () => {
  it('matches a known SHA-256 digest', () => {
    expect(sha256Hex(hello)).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});

describe('createManifest', () => {
  it('records digests, media types and versions', async () => {
    const manifest = await createManifest({
      assetId: 'ast_eng_001',
      version: 'v1',
      issuer: 'Demo Evidence Custodian',
      issuedAt: new Date('2026-06-01T00:00:00Z'),
      files: [
        { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
        {
          name: 'lease.txt',
          mediaType: 'text/plain',
          bytes: hello,
          ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        },
      ],
    });

    expect(manifest.files).toHaveLength(2);
    expect(manifest.files[0]).toMatchObject({
      name: 'appraisal.md',
      digest: sha256Hex(appraisal),
      mediaType: 'text/markdown',
    });
    expect(manifest.files[1]?.ipfsCid).toContain('bafybei');
    expect(manifest.issuedAt.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('reads digests from file paths', async () => {
    const manifest = await createManifest({
      assetId: 'ast_eng_001',
      version: 'v1',
      issuer: 'Demo Evidence Custodian',
      files: [
        {
          name: 'engine-lease-evidence.md',
          mediaType: 'text/markdown',
          path: fileURLToPath(
            new URL('../../../fixtures/demo/engine-lease-evidence.md', import.meta.url),
          ),
        },
      ],
    });
    expect(manifest.files[0]?.digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects duplicate names and empty bundles', async () => {
    await expect(
      createManifest({
        assetId: 'ast_eng_001',
        version: 'v1',
        issuer: 'Issuer',
        files: [
          { name: 'same.txt', mediaType: 'text/plain', bytes: hello },
          { name: 'same.txt', mediaType: 'text/plain', bytes: appraisal },
        ],
      }),
    ).rejects.toThrow(/Duplicate evidence file name/);

    await expect(
      createManifest({
        assetId: 'ast_eng_001',
        version: 'v1',
        issuer: 'Issuer',
        files: [],
      }),
    ).rejects.toThrow();
  });

  it('requires bytes or a path', async () => {
    await expect(
      createManifest({
        assetId: 'ast_eng_001',
        version: 'v1',
        issuer: 'Issuer',
        files: [{ name: 'empty.txt', mediaType: 'text/plain' }],
      }),
    ).rejects.toThrow(/bytes or a path/);
  });
});

describe('verifyManifest', () => {
  async function fixture() {
    return createManifest({
      assetId: 'ast_eng_001',
      version: 'v1',
      issuer: 'Demo Evidence Custodian',
      files: [
        { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
        { name: 'lease.txt', mediaType: 'text/plain', bytes: hello },
      ],
    });
  }

  it('accepts an exact byte-for-byte bundle', async () => {
    const manifest = await fixture();
    const result = await verifyManifest(manifest, [
      { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
      { name: 'lease.txt', mediaType: 'text/plain', bytes: hello },
    ]);

    expect(result.ok).toBe(true);
    expect(result.checked).toBe(2);
    expect(result.issues).toEqual([]);
  });

  it('detects modified evidence', async () => {
    const manifest = await fixture();
    const result = await verifyManifest(manifest, [
      { name: 'appraisal.md', mediaType: 'text/markdown', bytes: Buffer.from('altered') },
      { name: 'lease.txt', mediaType: 'text/plain', bytes: hello },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ file: 'appraisal.md', code: 'DIGEST_MISMATCH' }),
    ]);
  });

  it('reports missing and unexpected files', async () => {
    const manifest = await fixture();
    const result = await verifyManifest(manifest, [
      { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
      { name: 'extra.pdf', mediaType: 'application/pdf', bytes: hello },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code).sort()).toEqual(['MISSING', 'UNEXPECTED']);
  });

  it('reports duplicate supplied names', async () => {
    const manifest = await fixture();
    const result = await verifyManifest(manifest, [
      { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
      { name: 'appraisal.md', mediaType: 'text/markdown', bytes: appraisal },
      { name: 'lease.txt', mediaType: 'text/plain', bytes: hello },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_NAME' }));
  });

  it('rejects an invalid manifest', async () => {
    await expect(verifyManifest({ assetId: 'short' }, [])).rejects.toThrow();
  });
});
