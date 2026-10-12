import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { clipProblem } from '../src/pitch/clip-plausible'

/**
 * Same duration and voicing bar as the shipped-clip test.
 * Usage: tsx tools/check-clips.ts <list.txt>
 * Each line is a path. The name after `public/audio/` is what the bar sees.
 */

const listPath = process.argv[2]
if (!listPath) {
  console.error('usage: tsx tools/check-clips.ts <list.txt>')
  process.exit(2)
}

function pcm(raw: Buffer): Float32Array {
  const bytes = Uint8Array.from(raw)
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4))
}

const files = readFileSync(listPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0)

const bad: { file: string; problem: string }[] = []
for (const path of files) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
    maxBuffer: 8 * 1024 * 1024,
  })
  const marker = 'public/audio/'
  const at = path.indexOf(marker)
  const file = at >= 0 ? path.slice(at + marker.length) : path
  const problem = clipProblem(file, pcm(raw))
  if (problem) bad.push({ file, problem })
}

const report = { checked: files.length, bad }
writeFileSync('/tmp/xtts-clip-problems.json', JSON.stringify(report, null, 2) + '\n')
console.error(JSON.stringify(report))
if (bad.length > 0) process.exit(1)
