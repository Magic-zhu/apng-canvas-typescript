
import parseAPNG from "./parser"

class APNG {

    constructor() {

    }

    /**
     * @param buffer 
     * @return {Promise}
     */
    parseBuffer(buffer: ArrayBuffer) {
        return parseAPNG(buffer)
    }

    parseURL() {

    }

    animateImage() {

    }

}

export default APNG