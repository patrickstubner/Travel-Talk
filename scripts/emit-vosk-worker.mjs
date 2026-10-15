import { Buffer } from 'node:buffer'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packed = readFileSync(join(root, 'node_modules/vosk-browser/dist/vosk.js'), 'utf8')
const match = packed.match(/createBase64WorkerFactory\('([^']+)'/)
if (!match?.[1]) throw new Error('VOSK_WORKER_MISSING')
const worker = Buffer.from(match[1], 'base64').toString('utf8')

const loadHandler =
  'if (ClientMessage.isLoadMessage(message)) {\r\n                const { modelUrl } = message;\r\n                if (!modelUrl) {\r\n                    ctx.postMessage({\r\n                        event: "error",\r\n                        error: "Missing modelUrl parameter",\r\n                    });\r\n                }\r\n                this.load(modelUrl)'
const loadHandlerNext =
  'if (ClientMessage.isLoadMessage(message)) {\r\n                const { modelUrl, modelBytes } = message;\r\n                if (!modelUrl || !modelBytes) {\r\n                    ctx.postMessage({\r\n                        event: "error",\r\n                        error: "Missing verified model bytes",\r\n                    });\r\n                    return;\r\n                }\r\n                this.load(modelUrl, modelBytes)'
if (!worker.includes(loadHandler)) throw new Error('VOSK_LOAD_HANDLER')

const fetchStep =
  '.then(() => {\r\n                    // TODO parse Url\r\n                    const fullModelUrl = new URL(modelUrl, location.href.replace(/^blob:/, ""));\r\n                    this.logger.verbose(`Downloading ${fullModelUrl} to ${modelPath}`);\r\n                    return this.Vosk.downloadAndExtract(fullModelUrl.toString(), modelPath);\r\n                })'
const fetchStepNext =
  '.then(() => {\r\n                    this.logger.verbose(`Installing verified bytes at ${modelPath}`);\r\n                    return this.Vosk.installVerifiedArchive(modelBytes, modelPath);\r\n                })'
if (!worker.includes(fetchStep)) throw new Error('VOSK_FETCH_STEP')

const downloadStart = 'function download(url,path){return async(function*(){log(`Attempting to download from ${url}`,2);'
const downloadNext =
  'function download(url,path){return async(function*(){throw new Error("The worker does not fetch the model");log(`Attempting to download from ${url}`,2);'
if (!worker.includes(downloadStart)) throw new Error('VOSK_DOWNLOAD')

const exported = 'Object.assign(Module,{"downloadAndExtract":downloadAndExtract,"syncFilesystem":syncFilesystem});'
const install =
  'function installVerifiedArchive(bytes,localPath){return async(function*(){if(!bytes||!bytes.byteLength){throw new Error("Missing verified model bytes")}try{FS.unlink(localPath+"/extracted.ok")}catch(e){}var archivePath=localPath+"/downloaded.tar.gz";try{FS.unlink(archivePath)}catch(e){}FS.mkdirTree(localPath);var data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);FS.writeFile(archivePath,data);yield extract(archivePath,localPath,true);try{FS.unlink(archivePath)}catch(e){}})}' +
  'Object.assign(Module,{"downloadAndExtract":downloadAndExtract,"installVerifiedArchive":installVerifiedArchive,"syncFilesystem":syncFilesystem});'
if (!worker.includes(exported)) throw new Error('VOSK_EXPORT')

let next = worker.replace(loadHandler, loadHandlerNext).replace('load(modelUrl) {', 'load(modelUrl, modelBytes) {')
next = next.replace(fetchStep, fetchStepNext).replace(downloadStart, downloadNext).replace(exported, install)
if (next === worker) throw new Error('VOSK_UNCHANGED')
if (!next.includes('installVerifiedArchive(modelBytes, modelPath)')) throw new Error('VOSK_INSTALL_CALL')
if (next.includes('downloadAndExtract(fullModelUrl')) throw new Error('VOSK_STILL_FETCHES')

writeFileSync(join(root, 'public/vosk-worker.js'), next)
