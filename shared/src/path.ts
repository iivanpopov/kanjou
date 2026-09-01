import path from 'node:path'

export function basename(file: string | path.ParsedPath): string {
  if (typeof file === 'string') return path.basename(file, path.extname(file))
  return file.name
}

export interface ParsedFile extends path.ParsedPath {
  absolute: string
  relative: string
}

export function parse(file: string): ParsedFile {
  const parsed = path.parse(file)
  return {
    ...parsed,
    absolute: path.resolve(parsed.dir, parsed.base),
    relative: path.join(parsed.dir, parsed.base),
  }
}
