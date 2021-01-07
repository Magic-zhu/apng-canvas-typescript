(function () {
    'use strict';

    class Animation {
        constructor() {
            this.width = 0;
            this.height = 0;
            this.numPlays = 0;
            this.playTime = 0;
            this.frames = [];
            this.rate = 1;
            this.nextRenderTime = 0;
            this.fNum = 0;
            this.prevF = null;
            this.played = false;
            this.finished = false;
            this.contexts = [];
        }
        play(rate) {
            if (rate && rate > 0)
                this.rate = rate;
            if (this.played || this.finished)
                return;
            this.rewind();
            this.played = true;
            requestAnimationFrame((time) => {
                this.tick(time);
            });
        }
        stop() {
        }
        pause() {
        }
        restart() {
        }
        rewind() {
            this.nextRenderTime = 0;
            this.fNum = 0;
            this.prevF = null;
            this.played = false;
            this.finished = false;
        }
        addContext(ctx) {
            if (this.contexts.length > 0) {
                let dat = this.contexts[0].getImageData(0, 0, this.width, this.height);
                ctx.putImageData(dat, 0, 0);
            }
            this.contexts.push(ctx);
            ctx['_apng_animation'] = this;
        }
        removeContext(ctx) {
            let idx = this.contexts.indexOf(ctx);
            if (idx === -1) {
                return;
            }
            this.contexts.splice(idx, 1);
            if (this.contexts.length === 0) {
                this.rewind();
            }
            if ('_apng_animation' in ctx) {
                delete ctx['_apng_animation'];
            }
        }
        tick(now) {
            while (this.played && this.nextRenderTime <= now)
                this.renderFrame(now);
            if (this.played)
                requestAnimationFrame((time) => {
                    this.tick(time);
                });
        }
        renderFrame(now) {
            let f = this.fNum++ % this.frames.length;
            let frame = this.frames[f];
            if (!(this.numPlays == 0 || this.fNum / this.frames.length <= this.numPlays)) {
                this.played = false;
                this.finished = true;
                return;
            }
            if (f == 0) {
                this.contexts.forEach((ctx) => { ctx.clearRect(0, 0, this.width, this.height); });
                this.prevF = null;
                if (frame.disposeOp == 2)
                    frame.disposeOp = 1;
            }
            if (this.prevF && this.prevF.disposeOp == 1) {
                this.contexts.forEach((ctx) => { ctx.clearRect(this.prevF.left, this.prevF.top, this.prevF.width, this.prevF.height); });
            }
            else if (this.prevF && this.prevF.disposeOp == 2) {
                this.contexts.forEach((ctx) => { ctx.putImageData(this.prevF.iData, this.prevF.left, this.prevF.top); });
            }
            this.prevF = frame;
            this.prevF.iData = null;
            if (this.prevF.disposeOp == 2) {
                this.prevF.iData = this.contexts[0].getImageData(frame.left, frame.top, frame.width, frame.height);
            }
            if (frame.blendOp == 0) {
                this.contexts.forEach((ctx) => { ctx.clearRect(frame.left, frame.top, frame.width, frame.height); });
            }
            this.contexts.forEach((ctx) => {
                ctx.drawImage(frame.img, frame.left, frame.top);
            });
            if (this.nextRenderTime == 0)
                this.nextRenderTime = now;
            while (now > this.nextRenderTime + this.playTime)
                this.nextRenderTime += this.playTime;
            this.nextRenderTime += frame.delay / this.rate;
        }
    }

    let table = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
        var c = i;
        for (var k = 0; k < 8; k++)
            c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c;
    }
    function crc32 (bytes, start, length) {
        start = start || 0;
        length = length || (bytes.length - start);
        var crc = -1;
        for (var i = start, l = start + length; i < l; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
        }
        return crc ^ (-1);
    }

    class Loader {
        loadUrl(url) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    if (this.status == 200) {
                        resolve(this.response);
                    }
                    else {
                        reject(this);
                    }
                };
                xhr.send();
            });
        }
    }

    const PNG_SIGNATURE_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    class Parser extends Loader {
        constructor() {
            super(...arguments);
            this.url2promise = {};
        }
        urlParse(url) {
            if (!(url in this.url2promise))
                this.url2promise[url] = this.loadUrl(url).then((res) => {
                    return this.parse(res);
                });
            return this.url2promise[url];
        }
        checkPngSignature(bytes) {
            for (let i = 0; i < PNG_SIGNATURE_BYTES.length; i++) {
                if (PNG_SIGNATURE_BYTES[i] != bytes[i]) {
                    return false;
                }
            }
            return true;
        }
        isAnimated(bytes) {
            let _isAnimated = false;
            this.parseChunks(bytes, (type) => {
                if (type == "acTL") {
                    _isAnimated = true;
                    return false;
                }
                return true;
            });
            return _isAnimated;
        }
        createImages(anim, headerDataBytes, preDataParts, postDataParts, success, fail) {
            let createdImages = 0;
            let preBlob = new Blob(preDataParts);
            let postBlob = new Blob(postDataParts);
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
        parse(buffer) {
            let bytes = new Uint8Array(buffer);
            return new Promise((resolve, reject) => {
                if (!this.checkPngSignature(bytes)) {
                    console.error("Not a PNG file (invalid file signature)");
                    reject("Not a PNG file (invalid file signature)");
                }
                if (!this.isAnimated(bytes)) {
                    console.error("Not an animated PNG");
                    reject("Not an animated PNG");
                    return;
                }
                let preDataParts = [], postDataParts = [], headerDataBytes = null, frame = null, anim = new Animation();
                this.parseChunks(bytes, (type, bytes, off, length) => {
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
                            if (frame)
                                anim.frames.push(frame);
                            frame = {};
                            frame.width = this.readDWord(bytes, off + 8 + 4);
                            frame.height = this.readDWord(bytes, off + 8 + 8);
                            frame.left = this.readDWord(bytes, off + 8 + 12);
                            frame.top = this.readDWord(bytes, off + 8 + 16);
                            let delayN = this.readWord(bytes, off + 8 + 20);
                            let delayD = this.readWord(bytes, off + 8 + 22);
                            if (delayD == 0)
                                delayD = 100;
                            frame.delay = 1000 * delayN / delayD;
                            if (frame.delay <= 10)
                                frame.delay = 100;
                            anim.playTime += frame.delay;
                            frame.disposeOp = this.readByte(bytes, off + 8 + 24);
                            frame.blendOp = this.readByte(bytes, off + 8 + 25);
                            frame.dataParts = [];
                            break;
                        case "fdAT":
                            if (frame)
                                frame.dataParts.push(bytes.subarray(off + 8 + 4, off + 8 + length));
                            break;
                        case "IDAT":
                            if (frame)
                                frame.dataParts.push(bytes.subarray(off + 8, off + 8 + length));
                            break;
                        case "IEND":
                            postDataParts.push(this.subBuffer(bytes, off, 12 + length));
                            break;
                        default:
                            preDataParts.push(this.subBuffer(bytes, off, 12 + length));
                    }
                });
                if (frame)
                    anim.frames.push(frame);
                if (anim.frames.length == 0) {
                    console.error("Not an animated PNG");
                    reject("Not an animated PNG");
                    return;
                }
                this.createImages(anim, headerDataBytes, preDataParts, postDataParts, (anim) => {
                    resolve(anim);
                }, (err) => {
                    console.error(err);
                    reject(err);
                });
            });
        }
        parseChunks(bytes, callback) {
            let off = 8;
            let length;
            let type;
            let res;
            do {
                length = this.readDWord(bytes, off);
                type = this.readString(bytes, off + 4, 4);
                res = callback(type, bytes, off, length);
                off += 12 + length;
            } while (res !== false && type != "IEND" && off < bytes.length);
        }
        ;
        readWord(bytes, off) {
            let x = 0;
            for (let i = 0; i < 2; i++)
                x += (bytes[i + off] << ((1 - i) * 8));
            return x;
        }
        readDWord(bytes, off) {
            let x = 0;
            x += ((bytes[0 + off] << 24) >>> 0);
            for (let i = 1; i < 4; i++)
                x += ((bytes[i + off] << ((3 - i) * 8)));
            return x;
        }
        readByte(bytes, off) {
            return bytes[off];
        }
        subBuffer(bytes, start, length) {
            let a = new Uint8Array(length);
            a.set(bytes.subarray(start, start + length));
            return a;
        }
        ;
        readString(bytes, off, length) {
            let chars = Array.prototype.slice.call(bytes.subarray(off, off + length));
            return String.fromCharCode.apply(String, chars);
        }
        ;
        makeDWordArray(x) {
            return [(x >>> 24) & 0xff, (x >>> 16) & 0xff, (x >>> 8) & 0xff, x & 0xff];
        }
        ;
        makeStringArray(x) {
            let res = [];
            for (let i = 0; i < x.length; i++)
                res.push(x.charCodeAt(i));
            return res;
        }
        ;
        makeChunkBytes(type, dataBytes) {
            let crcLen = type.length + dataBytes.length;
            let bytes = new Uint8Array(new ArrayBuffer(crcLen + 8));
            bytes.set(this.makeDWordArray(dataBytes.length), 0);
            bytes.set(this.makeStringArray(type), 4);
            bytes.set(dataBytes, 8);
            let crc = crc32(bytes, 4, crcLen);
            bytes.set(this.makeDWordArray(crc), crcLen + 4);
            return bytes;
        }
        ;
    }
    var parser = new Parser();

    class APNG {
        constructor() {
        }
        parseBuffer(buffer) {
            return parser.parse(buffer);
        }
        parseURL(url) {
            return parser.urlParse(url);
        }
        animateImage(img, autoplay) {
            autoplay = autoplay != undefined ? autoplay : true;
            img.setAttribute("data-is-apng", "progress");
            return this.parseURL(img.src).then((anim) => {
                img.setAttribute("data-is-apng", "yes");
                let canvas = document.createElement("canvas");
                canvas.width = anim.width;
                canvas.height = anim.height;
                Array.prototype.slice.call(img.attributes).forEach(function (attr) {
                    if (["alt", "src", "usemap", "ismap", "data-is-apng", "width", "height"].indexOf(attr.nodeName) == -1) {
                        canvas.setAttributeNode(attr.cloneNode(false));
                    }
                });
                canvas.setAttribute("data-apng-src", img.src);
                if (img.alt != "")
                    canvas.appendChild(document.createTextNode(img.alt));
                let imgWidth = "", imgHeight = "", val = 0, unit = "";
                if (img.style.width != "" && img.style.width != "auto") {
                    imgWidth = img.style.width;
                }
                else if (img.hasAttribute("width")) {
                    imgWidth = img.getAttribute("width") + "px";
                }
                if (img.style.height != "" && img.style.height != "auto") {
                    imgHeight = img.style.height;
                }
                else if (img.hasAttribute("height")) {
                    imgHeight = img.getAttribute("height") + "px";
                }
                if (imgWidth != "" && imgHeight == "") {
                    val = parseFloat(imgWidth);
                    unit = imgWidth.match(/\D+$/)[0];
                    imgHeight = Math.round(canvas.height * val / canvas.width) + unit;
                }
                if (imgHeight != "" && imgWidth == "") {
                    val = parseFloat(imgHeight);
                    unit = imgHeight.match(/\D+$/)[0];
                    imgWidth = Math.round(canvas.width * val / canvas.height) + unit;
                }
                canvas.style.width = imgWidth;
                canvas.style.height = imgHeight;
                let p = img.parentNode;
                p.insertBefore(canvas, img);
                p.removeChild(img);
                anim.addContext(canvas.getContext("2d"));
                if (autoplay === true) {
                    anim.play();
                }
                return Promise.resolve(anim);
            }).catch((err) => {
                console.error(err);
                img.setAttribute("data-is-apng", "no");
            });
        }
        static install(mot) {
        }
    }
    window['APNG'] = APNG;

    return APNG;

}());
