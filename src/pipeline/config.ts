import { resolve } from 'node:path'

// process.cwd() is the repo root both locally and on Vercel (/var/task).
// import.meta.url points to the compiled bundle path in production, so it
// cannot be used to locate the repo root after Next.js bundling.
export const REPO_ROOT = process.cwd()
export const DATA_ROOT = resolve(REPO_ROOT, 'data')
export const INPUT_ROOT = resolve(DATA_ROOT, 'input')
export const PRIMARY_CSV_PATH = resolve(INPUT_ROOT, 'primary.csv')
export const GENERATED_ROOT = resolve(DATA_ROOT, 'generated')
