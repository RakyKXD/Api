import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export function saveBase64Image(
  dataUri: unknown,
  folder: 'icons' | 'banners' | 'splashes' | 'avatars' | 'emojis' | 'stickers',
  subId: string
): string | null {
  if (dataUri === null) return null
  if (typeof dataUri !== 'string') return null

  // If already a hash or URL, return it
  if (!dataUri.startsWith('data:image/')) {
    return dataUri
  }

  try {
    const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
    if (!match) return null

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const hash = crypto.createHash('md5').update(buffer).digest('hex')

    // Save to public/<folder>/<subId>/<hash>.<ext> and <hash>.png
    const targetDir = path.resolve('public', folder, subId)
    fs.mkdirSync(targetDir, { recursive: true })

    const filePath = path.join(targetDir, `${hash}.png`)
    fs.writeFileSync(filePath, buffer)

    if (ext !== 'png') {
      const extPath = path.join(targetDir, `${hash}.${ext}`)
      fs.writeFileSync(extPath, buffer)
    }

    return hash
  } catch (err) {
    console.error(`[saveBase64Image] Error saving image to ${folder}/${subId}:`, err)
    return null
  }
}
