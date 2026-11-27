import { Buffer } from 'node:buffer'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packed = readFileSync(join(root, 'node_modules/vosk-browser/dist/vosk.js'), 'utf8')
const match = packed.match(/createBase64WorkerFactory\('([^']+)'/)
if (!match?.[1]) throw new Error('VOSK_WORKER_MISSING')
const worker = Buffer.from(match[1], 'base64').toString('utf8')

function replaceSpan(source, start, endInclusive, next, label) {
  const i = source.indexOf(start)
  if (i < 0) throw new Error(label)
  if (source.indexOf(start, i + 1) !== -1) throw new Error(`${label}_AMBIGUOUS`)
  const j = source.indexOf(endInclusive, i)
  if (j < 0) throw new Error(`${label}_END`)
  return source.slice(0, i) + next + source.slice(j + endInclusive.length)
}

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

// Embind builds named wrappers with `new Function`. Those helpers are patched
// so the worker CSP can drop 'unsafe-eval'. WASM still needs 'wasm-unsafe-eval'.
const namedFunctionNext =
  'function createNamedFunction(name,body){name=makeLegalFunctionName(name);var fn=function(){"use strict";return body.apply(this,arguments)};try{Object.defineProperty(fn,"name",{value:name,configurable:true})}catch(e){}return fn}'

const invokerNext =
  'function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and \'this\' types!");}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=false;for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){needsDestructorStack=true;break}}var returns=argTypes[0].name!=="void";var expectedArgCount=argCount-2;var retType=argTypes[0];var classParam=argTypes[1];var userArgTypes=argTypes.slice(2);function invokerFunction(){if(arguments.length!==expectedArgCount){throwBindingError("function "+humanName+" called with "+arguments.length+" arguments, expected "+expectedArgCount+" args!");}var destructors=needsDestructorStack?[]:null;var wired=[];if(isClassMethodFunc){wired.push(classParam.toWireType(destructors,this));}for(var i=0;i<expectedArgCount;++i){wired.push(userArgTypes[i].toWireType(destructors,arguments[i]));}var rv=cppInvokerFunc.apply(null,[cppTargetFunc].concat(wired));if(needsDestructorStack){runDestructors(destructors);}else{for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){if(argTypes[i].destructorFunction!==null){argTypes[i].destructorFunction(wired[isClassMethodFunc?i-1:i-2]);}}}if(returns){return retType.fromWireType(rv);}}return invokerFunction}'

const emvalNext =
  'function __emval_get_method_caller(argCount,argTypes){var types=__emval_lookupTypes(argCount,argTypes);var retType=types[0];var callerArgTypes=types.slice(1);function invokerFunction(handle,name,destructors,args){var offset=0;var callArgs=[];for(var i=0;i<argCount-1;++i){callArgs.push(callerArgTypes[i].readValueFromPointer(args+offset));offset+=callerArgTypes[i]["argPackAdvance"];}var rv=handle[name].apply(handle,callArgs);for(var i=0;i<argCount-1;++i){if(callerArgTypes[i]["deleteObject"]){callerArgTypes[i].deleteObject(callArgs[i]);}}if(!retType.isVoid){return retType.toWireType(destructors,rv);}}return __emval_addMethodCaller(invokerFunction)'

let next = worker.replace(loadHandler, loadHandlerNext).replace('load(modelUrl) {', 'load(modelUrl, modelBytes) {')
next = next.replace(fetchStep, fetchStepNext).replace(downloadStart, downloadNext).replace(exported, install)
next = replaceSpan(
  next,
  'function createNamedFunction(name,body){',
  ')(body)}',
  namedFunctionNext,
  'VOSK_NAMED_FUNCTION',
)
next = replaceSpan(
  next,
  'function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){',
  'var invokerFunction=new_(Function,args1).apply(null,args2);return invokerFunction}',
  invokerNext,
  'VOSK_INVOKER',
)
next = replaceSpan(
  next,
  'function __emval_get_method_caller(argCount,argTypes){',
  'var invokerFunction=new_(Function,params).apply(null,args);return __emval_addMethodCaller(invokerFunction)',
  emvalNext,
  'VOSK_EMVAL',
)
if (next === worker) throw new Error('VOSK_UNCHANGED')
if (!next.includes('installVerifiedArchive(modelBytes, modelPath)')) throw new Error('VOSK_INSTALL_CALL')
if (next.includes('downloadAndExtract(fullModelUrl')) throw new Error('VOSK_STILL_FETCHES')
if (next.includes('new Function') || next.includes('new_(Function')) throw new Error('VOSK_STILL_EVAL')

writeFileSync(join(root, 'public/vosk-worker.js'), next)
