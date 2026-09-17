import path from 'node:path'

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
