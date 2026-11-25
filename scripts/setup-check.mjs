#!/usr/bin/env node
/**
 * Non-blocking post-install sanity check. Never fails install.
 */
import { existsSync } from 'node:fs';

const major = Number(process.versions.node.split('.')[0]);
if (Number.isFinite(major) && major < 22) {
  console.warn(
    `\n[aerospace-rwa] Node ${process.versions.node} detected. Node 22+ is required for development.\n`,
  );
}
if (!existsSync('contracts/Cargo.toml')) {
  console.warn('[aerospace-rwa] contracts/Cargo.toml not found — contract commands will not work.');
}
