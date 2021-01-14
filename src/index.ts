
import parser from "./parser"
declare let global
class APNG {

    constructor() {

    }

    private checkNativeFeatures(): Promise<any> {
        return new Promise((resolve) => {
            let canvas = document.createElement("canvas")
            let result = {
                TypedArrays: ("ArrayBuffer" in global),
                BlobURLs: ("URL" in global),
                requestAnimationFrame: ("requestAnimationFrame" in global),
                pageProtocol: (location.protocol == "http:" || location.protocol == "https:"),
                canvas: ("getContext" in document.createElement("canvas")),
                APNG: false
            }
            if (result.canvas) {
                // see http://eligrey.com/blog/post/apng-feature-detection
                let img = new Image()
                img.onload = function () {
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    result.APNG = (ctx.getImageData(0, 0, 1, 1).data[3] === 0);
                    resolve(result);
                }
                // frame 1 (skipped on apng-supporting browsers): [0, 0, 0, 255]
                // frame 2: [0, 0, 0, 0]
                img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjV" +
                    "EwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAA" +
                    "AAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==";
            } else {
                resolve(result);
            }
        })
    }

    isSupport(ignoreNativeAPNG: boolean) {
        if (typeof ignoreNativeAPNG == 'undefined') ignoreNativeAPNG = false
        return this.checkNativeFeatures()
            .then((features) => {
                if (features.APNG && !ignoreNativeAPNG) {
                    return Promise.reject(false)
                } else {
                    return Promise.resolve(true)
                }
            })
    }

    /**
     * @param buffer 
     * @return {Promise}
     */
    parseBuffer(buffer: ArrayBuffer): Promise<{}> {
        return parser.parse(buffer)
    }

    /**
     * @param {String} url
     * @return {Promise}
     */
    parseURL(url: string): Promise<any> {
        return parser.urlParse(url)
    }

    /**
     * @param {HTMLImageElement} img
     * @param {boolean} autoplay
     * @return {Promise}
     */
    animateImage(img: HTMLImageElement, autoplay: boolean): Promise<any> {
        autoplay = autoplay != undefined ? autoplay : true;
        img.setAttribute("data-is-apng", "progress");
        return this.parseURL(img.src).then((anim) => {
            img.setAttribute("data-is-apng", "yes")
            if (img.style.opacity === '0') img.style.opacity = '1'
            let canvas: HTMLCanvasElement = document.createElement("canvas");
            canvas.width = anim.width;
            canvas.height = anim.height;
            Array.prototype.slice.call(img.attributes).forEach(function (attr) {
                if (["alt", "src", "usemap", "ismap", "data-is-apng", "width", "height"].indexOf(attr.nodeName) == -1) {
                    canvas.setAttributeNode(attr.cloneNode(false));
                }
            });
            canvas.setAttribute("data-apng-src", img.src);
            if (img.alt != "") canvas.appendChild(document.createTextNode(img.alt));

            let imgWidth = "", imgHeight = "", val = 0, unit = "";

            if (img.style.width != "" && img.style.width != "auto") {
                imgWidth = img.style.width;
            } else if (img.hasAttribute("width")) {
                imgWidth = img.getAttribute("width") + "px";
            }
            if (img.style.height != "" && img.style.height != "auto") {
                imgHeight = img.style.height;
            } else if (img.hasAttribute("height")) {
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
                anim.play()
            };
            return Promise.resolve(anim)
        }).catch((err) => {
            console.error(err)
            img.setAttribute("data-is-apng", "no")
        })
    }

    static install(mot: any) {

    }
}

window['APNG'] = APNG

export default APNG