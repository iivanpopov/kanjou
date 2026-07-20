import path from 'node:path'

export function basenames(files: string[], ext: string): string[] {
  return files.reduce((acc, file) => {
    if (file.endsWith(ext)) acc.push(path.basename(file, ext))
    return acc
  }, [] as string[])
}
