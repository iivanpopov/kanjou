import path from 'node:path'

export function onlyExt(files: string[], ext: string): string[] {
  return files.filter((file) => file.endsWith(ext))
}

export function basenames(files: string[], ext: string): string[] {
  return onlyExt(files, ext).map((file) => path.basename(file, ext))
}
