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
  prettier: boolean | Record<string, any>
}

export interface ConfigInput {
  baseLocale?: string
  localesDir?: string
  compile?: CompileOptions
  dts?: false | DtsOptions
  prettier?: boolean | Record<string, any>
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

  if (exists) {
    const fileConfig = JSON.parse(readFileSync(configFilePath, 'utf-8'))
    const merged = { ...fileConfig, ...inlineConfig }
    return ConfigSchema.parse(merged)
  }

  return ConfigSchema.parse(inlineConfig)
}
