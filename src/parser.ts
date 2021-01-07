import DAnimation from './animation'
import crc32 from './crc32'
import Loader from './loader';
import { FrameItem } from './interface'
//png签名
const PNG_SIGNATURE_BYTES: Uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
class Parser extends Loader {

    //url Map
    url2promise = {}

    urlParse(url: string): Promise<any> {
        // 加载apng array buffer 并保存
        if (!(url in this.url2promise)) this.url2promise[url] = this.loadUrl(url).then((res: any) => {
            return this.parse(res)
        })
        return this.url2promise[url]
    }

    /**
     * 校验png签名
     * @param bytes 
     */
    checkPngSignature(bytes: Uint8Array): boolean {
        for (let i = 0; i < PNG_SIGNATURE_BYTES.length; i++) {
            if (PNG_SIGNATURE_BYTES[i] != bytes[i]) {
                return false
            }
        }
        return true
    }

    /**
     * 校验是不是apng
     * @param bytes 
     */
    isAnimated(bytes: Uint8Array): boolean {
        // 校验 actl:动画控制块有没有 (是不是apng)
        let _isAnimated: boolean = false
        this.parseChunks(bytes, (type: string) => {
            if (type == "acTL") {
                _isAnimated = true;
                return false;
            }
            return true;
        })
        return _isAnimated
    }

    createImages(anim, headerDataBytes, preDataParts, postDataParts, success: Function, fail: Function) {
        let createdImages: number = 0
        let preBlob = new Blob(preDataParts)
        let postBlob = new Blob(postDataParts)
        for (let f = 0; f < anim.frames.length; f++) {
            let frame = anim.frames[f];
            let bb = [];
            bb.push(PNG_SIGNATURE_BYTES);
            headerDataBytes.set(this.makeDWordArray(frame.width), 0);
            headerDataBytes.set(this.makeDWordArray(frame.height), 4);
            bb.push(this.makeChunkBytes("IHDR", headerDataBytes));
            bb.push(preBlob);
            for (let j = 0; j < frame.dataParts.length; j++) {
                bb.push(this.makeChunkBytes("IDAT", frame.dataParts[j]));
            }
            bb.push(postBlob);
            let url = URL.createObjectURL(new Blob(bb, { "type": "image/png" }));
            delete frame.dataParts;
            bb = null;
            /**
             * Using "createElement" instead of "new Image" because of bug in Chrome 27
             * https://code.google.com/p/chromium/issues/detail?id=238071
             * http://stackoverflow.com/questions/16377375/using-canvas-drawimage-in-chrome-extension-content-script/16378270
             */
            frame.img = document.createElement('img');
            frame.img.onload = function () {
                URL.revokeObjectURL(this.src);
                createdImages++;
                if (createdImages == anim.frames.length) {
                    success(anim);
                }
            };
            frame.img.onerror = function () {
                fail("Image creation error");
            };
            frame.img.src = url;
        }
    }

    parse(buffer: ArrayBuffer) {

        let bytes: Uint8Array = new Uint8Array(buffer)

        return new Promise((resolve, reject) => {

            if (!this.checkPngSignature(bytes)) {
                console.error("Not a PNG file (invalid file signature)")
                reject("Not a PNG file (invalid file signature)")
            }

            if (!this.isAnimated(bytes)) {
                console.error("Not an animated PNG")
                reject("Not an animated PNG")
                return
            }

            //
            let preDataParts = [], // 存储 其他辅助块
                postDataParts = [], // 存储 IEND块
                headerDataBytes = null, // 存储 IHDR块
                frame: FrameItem = null,
                anim = new DAnimation()

            this.parseChunks(bytes, (type: string, bytes: Uint8Array, off: number, length: number) => {
                switch (type) {
                    case "IHDR":
                        headerDataBytes = bytes.subarray(off + 8, off + 8 + length);
                        anim.width = this.readDWord(bytes, off + 8);
                        anim.height = this.readDWord(bytes, off + 12);
                        break;
                    case "acTL":
                        anim.numPlays = this.readDWord(bytes, off + 8 + 4);
                        break;
                    case "fcTL":
                        if (frame) anim.frames.push(frame);
                        frame = {};
                        frame.width = this.readDWord(bytes, off + 8 + 4);
                        frame.height = this.readDWord(bytes, off + 8 + 8);
                        frame.left = this.readDWord(bytes, off + 8 + 12);
                        frame.top = this.readDWord(bytes, off + 8 + 16);
                        let delayN = this.readWord(bytes, off + 8 + 20);
                        let delayD = this.readWord(bytes, off + 8 + 22);
                        if (delayD == 0) delayD = 100;
                        frame.delay = 1000 * delayN / delayD;
                        // see http://mxr.mozilla.org/mozilla/source/gfx/src/shared/gfxImageFrame.cpp#343
                        if (frame.delay <= 10) frame.delay = 100;
                        anim.playTime += frame.delay;
                        frame.disposeOp = this.readByte(bytes, off + 8 + 24);
                        frame.blendOp = this.readByte(bytes, off + 8 + 25);
                        frame.dataParts = [];
                        break;
                    case "fdAT":
                        if (frame) frame.dataParts.push(bytes.subarray(off + 8 + 4, off + 8 + length));
                        break;
                    case "IDAT":
                        if (frame) frame.dataParts.push(bytes.subarray(off + 8, off + 8 + length));
                        break;
                    case "IEND":
                        postDataParts.push(this.subBuffer(bytes, off, 12 + length));
                        break;
                    default:
                        preDataParts.push(this.subBuffer(bytes, off, 12 + length));
                }
            })

            if (frame) anim.frames.push(frame)

            if (anim.frames.length == 0) {
                console.error("Not an animated PNG")
                reject("Not an animated PNG")
                return
            }

            this.createImages(
                anim,
                headerDataBytes,
                preDataParts,
                postDataParts,
                (anim: Animation) => {
                    resolve(anim)
                },
                (err: string) => {
                    console.error(err)
                    reject(err)
                }
            )
        })
    }

    /**
     * 解析 chunks
     * @param {Uint8Array} bytes
     * @param {function(string, Uint8Array, int, int)} callback
     */
    parseChunks(bytes: Uint8Array, callback: Function): void {
        let off = 8;
        let length: number
        let type: string
        let res: boolean
        do {
            length = this.readDWord(bytes, off);
            type = this.readString(bytes, off + 4, 4);
            res = callback(type, bytes, off, length);
            off += 12 + length;
        } while (res !== false && type != "IEND" && off < bytes.length);
    };

    /**
     * @param {Uint8Array} bytes
     * @param {int} off
     * @return {int}
     */
    readWord(bytes: Uint8Array, off: number): number {
        let x = 0;
        for (let i = 0; i < 2; i++) x += (bytes[i + off] << ((1 - i) * 8));
        return x;
    }

    /**
     * @param {Uint8Array} bytes
     * @param {int} off
     * @return {int}
    */
    readDWord(bytes: Uint8Array, off: number): number {
        let x = 0;
        // Force the most-significant byte to unsigned.
        x += ((bytes[0 + off] << 24) >>> 0);
        for (let i = 1; i < 4; i++) x += ((bytes[i + off] << ((3 - i) * 8)));
        return x;
    }

    /**
     * @param {Uint8Array} bytes
     * @param {int} off
     * @return {int}
     */
    readByte(bytes: Uint8Array, off: number): number {
        return bytes[off];
    }

    /**
     * @param {Uint8Array} bytes
     * @param {int} start
     * @param {int} length
     * @return {Uint8Array}
     */
    subBuffer(bytes: Uint8Array, start: number, length: number): Uint8Array {
        let a = new Uint8Array(length);
        a.set(bytes.subarray(start, start + length));
        return a;
    };

    readString(bytes: Uint8Array, off: number, length: number) {
        let chars = Array.prototype.slice.call(bytes.subarray(off, off + length));
        return String.fromCharCode.apply(String, chars);
    };

    makeDWordArray(x: number) {
        return [(x >>> 24) & 0xff, (x >>> 16) & 0xff, (x >>> 8) & 0xff, x & 0xff];
    };
    makeStringArray(x: string) {
        let res = [];
        for (let i = 0; i < x.length; i++) res.push(x.charCodeAt(i));
        return res;
    };
    /**
     * @param {string} type
     * @param {Uint8Array} dataBytes
     * @return {Uint8Array}
     */
    makeChunkBytes(type: string, dataBytes: Uint8Array): Uint8Array {
        let crcLen = type.length + dataBytes.length;
        let bytes = new Uint8Array(new ArrayBuffer(crcLen + 8));
        bytes.set(this.makeDWordArray(dataBytes.length), 0);
        bytes.set(this.makeStringArray(type), 4);
        bytes.set(dataBytes, 8);
        let crc = crc32(bytes, 4, crcLen);
        bytes.set(this.makeDWordArray(crc), crcLen + 4);
        return bytes;
    };
}

export default new Parser()