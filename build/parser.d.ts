import Loader from './loader';
declare class Parser extends Loader {
    url2promise: {};
    urlParse(url: string): Promise<any>;
    checkPngSignature(bytes: Uint8Array): boolean;
    isAnimated(bytes: Uint8Array): boolean;
    createImages(anim: any, headerDataBytes: any, preDataParts: any, postDataParts: any, success: Function, fail: Function): void;
    parse(buffer: ArrayBuffer): Promise<unknown>;
    parseChunks(bytes: Uint8Array, callback: Function): void;
    readWord(bytes: Uint8Array, off: number): number;
    readDWord(bytes: Uint8Array, off: number): number;
    readByte(bytes: Uint8Array, off: number): number;
    subBuffer(bytes: Uint8Array, start: number, length: number): Uint8Array;
    readString(bytes: Uint8Array, off: number, length: number): any;
    makeDWordArray(x: number): number[];
    makeStringArray(x: string): any[];
    makeChunkBytes(type: string, dataBytes: Uint8Array): Uint8Array;
}
declare const _default: Parser;
export default _default;
