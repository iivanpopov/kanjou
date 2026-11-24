import type { Options as PrettierOptions } from 'prettier'

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

export interface DtsOptions {
  outDir?: string
}

export interface CompileOptions {
  outDir?: string
}

export interface Config {
  baseLocale: string
  localesDir: string
  compile: { outDir: string }
  dts: false | { outDir: string }
  prettier: boolean | Partial<PrettierOptions>
}

export interface ConfigInput {
  baseLocale?: string
  localesDir?: string
  compile?: CompileOptions
  dts?: false | DtsOptions
  prettier?: boolean | Partial<PrettierOptions>
}

const DtsOptionsSchema = z.object({
  outDir: z.string().optional().default('./generated'),
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

export function getConfig(inlineConfig: ConfigInput = {}): Config {
  const configFilePath = path.resolve(CONFIG_FILENAME)
  const exists = existsSync(configFilePath)

  let base: unknown = {}
  if (exists) {
    const raw = readFileSync(configFilePath, 'utf-8').replace(/^\uFEFF/, '')
    try {
      base = JSON.parse(raw)
    } catch (err) {
      throw new Error(
        `Invalid ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      )
    }
    if (base === null || typeof base !== 'object' || Array.isArray(base)) {
      throw new Error(`Invalid ${CONFIG_FILENAME}: config must be a JSON object`)
    }
  }

  try {
    return ConfigSchema.parse({ ...(base as Record<string, unknown>), ...inlineConfig })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues
        .map((issue) => `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid ${CONFIG_FILENAME}: ${details}`, { cause: err })
    }
    throw new Error(
      `Invalid ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    )
  }
}
