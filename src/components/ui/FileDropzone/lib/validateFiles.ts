export type ValidationResult = { files: File[]; error: null } | { files: null; error: string }

export function validateFiles(files: File[], accept: string, maxSizeMb: number): ValidationResult {
  const maxBytes     = maxSizeMb * 1024 * 1024
  const acceptedExts = accept.split(',').map(s => s.trim().toLowerCase())

  const invalid = files.find(f => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    return !acceptedExts.includes(ext)
  })
  if (invalid) return { files: null, error: `Format non accepté : ${invalid.name}` }

  const tooBig = files.find(f => f.size > maxBytes)
  if (tooBig) return { files: null, error: `Fichier trop lourd (max ${maxSizeMb} Mo) : ${tooBig.name}` }

  return { files, error: null }
}
