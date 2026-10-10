declare module 'node:fs' {
  export function copyFileSync(src: string, dest: string): void
  export function existsSync(path: string): boolean
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string | undefined
  export function writeFileSync(path: string, data: string): void
  export function readFileSync(path: string, encoding: 'utf8'): string
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string
}
