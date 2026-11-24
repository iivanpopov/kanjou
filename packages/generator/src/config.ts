import type { Options as PrettierOptions } from 'prettier'

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

import { KanjouConfigError } from './errors'

export type DtsModule = '@kanjou/react' | '@kanjou/core'

export interface DtsOptions {
  outDir?: string | undefined
  module?: DtsModule | undefined
}

export interface CompileOptions {
  outDir?: string | undefined
}

export interface Config {
  baseLocale: string
  localesDir: string
  compile: { outDir: string }
  dts: false | { outDir: string; module: DtsModule }
  prettier: boolean | Partial<PrettierOptions>
}

export interface ConfigInput {
  baseLocale?: string | undefined
  localesDir?: string | undefined
  compile?: CompileOptions | undefined
  dts?: false | DtsOptions | undefined
  prettier?: boolean | Partial<PrettierOptions> | undefined
}

const DtsOptionsSchema = z.object({
  outDir: z.string().optional().default('./generated'),
  module: z.enum(['@kanjou/react', '@kanjou/core']).optional().default('@kanjou/react'),
})

const CompileOptionsSchema = z.object({
  outDir: z.string().optional().default('./generated'),
})

export const ConfigSchema: z.ZodType<Config, z.ZodTypeDef, ConfigInput> = z.object({
  baseLocale: z.string().optional().default('en'),
  localesDir: z.string().optional().default('./src/assets/locales'),
  compile: CompileOptionsSchema.optional().default({}),
  dts: z
    .union([z.literal(false), DtsOptionsSchema])
    .optional()
    .default({}),
  prettier: z
    .union([z.boolean(), z.record(z.any())])
    .optional()
    .default(true),
})

export const CONFIG_FILENAME = 'kanjou.config.json'

function omitUndefined(input: ConfigInput): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

export function getConfig(inlineConfig: ConfigInput = {}, rootDir?: string): Config {
  const baseDir = rootDir ? path.resolve(rootDir) : undefined
  const configFilePath = baseDir
    ? path.resolve(baseDir, CONFIG_FILENAME)
    : path.resolve(CONFIG_FILENAME)
  const exists = existsSync(configFilePath)

  let base: unknown = {}
  if (exists) {
    let raw: string
    try {
      raw = readFileSync(configFilePath, 'utf-8').replace(/^\uFEFF/, '')
    } catch (err) {
      throw new KanjouConfigError(
        `Failed to read ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
        configFilePath,
        { cause: err },
      )
    }

    try {
      base = JSON.parse(raw)
    } catch (err) {
      throw new KanjouConfigError(
        `Invalid ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
        configFilePath,
        { cause: err },
      )
    }

    if (base === null || typeof base !== 'object' || Array.isArray(base)) {
      throw new KanjouConfigError(
        `Invalid ${CONFIG_FILENAME}: config must be a JSON object`,
        configFilePath,
      )
    }
  }

  try {
    const parsed = ConfigSchema.parse({
      ...(base as Record<string, unknown>),
      ...omitUndefined(inlineConfig),
    })
    if (!baseDir) return parsed
    return {
      ...parsed,
      localesDir: path.resolve(baseDir, parsed.localesDir),
      compile: { outDir: path.resolve(baseDir, parsed.compile.outDir) },
      dts:
        parsed.dts === false
          ? false
          : { ...parsed.dts, outDir: path.resolve(baseDir, parsed.dts.outDir) },
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues
        .map((issue) => `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`)
        .join('; ')
      throw new KanjouConfigError(`Invalid ${CONFIG_FILENAME}: ${details}`, configFilePath, {
        cause: err,
      })
    }
    throw new KanjouConfigError(
      `Invalid ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
      configFilePath,
      { cause: err },
    )
  }
}
