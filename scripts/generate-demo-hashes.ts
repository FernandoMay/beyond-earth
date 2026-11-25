import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { demoSnapshot } from '@aerospace/shared-types';

const fixtureDir = resolve(process.cwd(), 'fixtures/demo');

async function main() {
  const files = (await readdir(fixtureDir)).filter((file) => !file.startsWith('.')).sort();
  const hashes = new Map<string, string>();

  for (const file of files) {
    const digest = createHash('sha256')
      .update(await readFile(join(fixtureDir, file)))
      .digest('hex');
    hashes.set(digest, file);
    console.log(`${digest}  fixtures/demo/${file}`);
  }

  const documents = demoSnapshot.assets.flatMap((asset) =>
    asset.documents.map((document) => ({ asset: asset.name, ...document })),
  );
  let missing = 0;
  for (const document of documents) {
    if (!hashes.has(document.digest)) {
      missing += 1;
      console.error(
        `[demo:hash] ${document.asset} references digest ${document.digest} with no matching fixture`,
      );
    }
  }

  console.log(
    `\n[demo:hash] ${files.length} fixture files, ${documents.length} demo document references, ${missing} unmatched.`,
  );
  if (missing > 0) process.exit(1);
}

main().catch((error) => {
  console.error('[demo:hash] failed:', error);
  process.exit(1);
});
