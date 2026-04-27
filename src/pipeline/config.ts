import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PIPELINE_DIR = dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = resolve(PIPELINE_DIR, '..', '..')
export const DATA_ROOT = resolve(REPO_ROOT, 'data')
export const INPUT_ROOT = resolve(DATA_ROOT, 'input')
export const PRIMARY_CSV_PATH = resolve(INPUT_ROOT, 'primary.csv')
export const GENERATED_ROOT = resolve(DATA_ROOT, 'generated')
