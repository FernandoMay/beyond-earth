import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  documentManifestSchema,
  type DocumentManifest,
} from '@aerospace/validation';
import { z } from 'zod';

export interface EvidenceFile {
  name: string;
  mediaType: string;
  bytes?: Uint8Array;
  path?: string;
  ipfsCid?: string;
}

export interface CreateManifestInput {
  assetId: string;
  version: string;
  issuer: string;
  files: EvidenceFile[];
  issuedAt?: Date;
}

export interface VerificationIssue {
  file: string;
  code: 'MISSING' | 'UNEXPECTED' | 'DIGEST_MISMATCH' | 'DUPLICATE_NAME';
  message: string;
}

export interface VerificationResult {
  ok: boolean;
  manifest: DocumentManifest;
  checked: number;
  issues: VerificationIssue[];
}

const evidenceFileSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    mediaType: z.string().trim().min(3).max(120),
    bytes: z.instanceof(Uint8Array).optional(),
    path: z.string().min(1).optional(),
    ipfsCid: z.string().trim().min(10).max(200).optional(),
  })
  .refine((file) => file.bytes !== undefined || file.path !== undefined, {
    message: 'Evidence file requires bytes or a path',
  });

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function sha256File(path: string): Promise<string> {
  return sha256Hex(await readFile(path));
}

async function digestFile(file: z.infer<typeof evidenceFileSchema>): Promise<string> {
  if (file.bytes) return sha256Hex(file.bytes);
  return sha256File(file.path as string);
}

/**
 * Builds a deterministic evidence manifest. The digest covers the exact bytes of
 * each document; names and media types are stored alongside so a reviewer can
 * reproduce the bundle.
 */
export async function createManifest(input: CreateManifestInput): Promise<DocumentManifest> {
  const files = z.array(evidenceFileSchema).min(1).max(100).parse(input.files);
  const names = new Set<string>();
  const manifestFiles = [];

  for (const file of files) {
    if (names.has(file.name)) {
      throw new Error(`Duplicate evidence file name: ${file.name}`);
    }
    names.add(file.name);
    manifestFiles.push({
      name: file.name,
      digest: await digestFile(file),
      mediaType: file.mediaType,
      ...(file.ipfsCid ? { ipfsCid: file.ipfsCid } : {}),
    });
  }

  return documentManifestSchema.parse({
    assetId: input.assetId,
    version: input.version,
    issuer: input.issuer,
    issuedAt: input.issuedAt ?? new Date(),
    files: manifestFiles,
  });
}

/**
 * Verifies that a supplied evidence bundle matches a manifest byte-for-byte.
 * Extra files are reported rather than ignored, because an unexpected document
 * in an evidence package is a review event.
 */
export async function verifyManifest(
  manifestInput: unknown,
  supplied: EvidenceFile[],
): Promise<VerificationResult> {
  const manifest = documentManifestSchema.parse(manifestInput);
  const issues: VerificationIssue[] = [];
  const byName = new Map<string, EvidenceFile>();

  for (const file of supplied) {
    if (byName.has(file.name)) {
      issues.push({
        file: file.name,
        code: 'DUPLICATE_NAME',
        message: 'The same evidence file name appears more than once.',
      });
      continue;
    }
    byName.set(file.name, file);
  }

  let checked = 0;
  for (const entry of manifest.files) {
    const file = byName.get(entry.name);
    if (!file) {
      issues.push({ file: entry.name, code: 'MISSING', message: 'File is missing from the bundle.' });
      continue;
    }
    byName.delete(entry.name);
    const parsed = evidenceFileSchema.safeParse(file);
    if (!parsed.success) {
      issues.push({
        file: entry.name,
        code: 'MISSING',
        message: parsed.error.issues[0]?.message ?? 'File has no bytes or path.',
      });
      continue;
    }
    const digest = await digestFile(parsed.data);
    checked += 1;
    if (digest !== entry.digest) {
      issues.push({
        file: entry.name,
        code: 'DIGEST_MISMATCH',
        message: 'SHA-256 digest does not match the manifest.',
      });
    }
  }

  for (const name of byName.keys()) {
    issues.push({
      file: name,
      code: 'UNEXPECTED',
      message: 'File is present in the bundle but absent from the manifest.',
    });
  }

  return { ok: issues.length === 0, manifest, checked, issues };
}
