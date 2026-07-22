import path from 'node:path'

export function basename(file: string | path.ParsedPath): string {
  if (typeof file === 'string') return path.basename(file, path.extname(file))
  return file.name
}

export function basenames(files: (string | path.ParsedPath)[]): string[] {
  return files.map(basename)
}

export type ParsedFile = path.ParsedPath & {
  /** Absolute path to file: path.resolve(dir, parsed.base) */
  absolute: string
}

export function parse(file: string) {
  const parsed = path.parse(file)
  Object.assign(parsed, { absolute: path.resolve(parsed.dir, parsed.base) })
  return parsed as ParsedFile
}
