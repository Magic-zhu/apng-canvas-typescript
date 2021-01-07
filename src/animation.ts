class Animation {

    width: number = 0
    height: number = 0
    numPlays: number = 0
    playTime: number = 0
    frames = []
    rate: number = 1

    nextRenderTime: number = 0
    fNum: number = 0
    prevF = null
    played: boolean = false
    finished: boolean = false
    contexts: any[] = []

    lastNum: number = -1 // -1 means to the end

    constructor() {

    }

    play(rate: number = 1, frameRange: number[] = []): void {
        if (rate > 0) this.rate = rate
        if (this.played || this.finished) return
        this.rewind()
        this.setFrameNum(frameRange)
        this.played = true
        requestAnimationFrame((time: number) => {
            this.tick(time)
        })
    }

    /**
     * 
     * @param frameNumber 
     */
    stop(frameNumber: number) {
        this.rewind()
    }

    pause() {

    }

    start() {

    }

    rewind() {
        this.nextRenderTime = 0;
        this.fNum = 0;
        this.prevF = null;
        this.played = false;
        this.finished = false;
    }

    setFrameNum(range: number[]): void {
        if (range.length === 0) return
        this.fNum = range[0]
        if (range.length > 1) this.lastNum = range[1]
    }

    addContext(ctx: CanvasRenderingContext2D) {
        if (this.contexts.length > 0) {
            let dat = this.contexts[0].getImageData(0, 0, this.width, this.height);
            ctx.putImageData(dat, 0, 0);
        }
        this.contexts.push(ctx);
        ctx['_apng_animation'] = this;
    }

    removeContext(ctx: CanvasRenderingContext2D) {
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

    private tick(now: number) {
        while (this.played && this.nextRenderTime <= now) this.renderFrame(now);
        if (this.played) requestAnimationFrame((time: number) => {
            this.tick(time)
        });
    }

    private renderFrame(now: number) {
        let f = this.fNum++ % this.frames.length;
        console.log(f)
        let frame = this.frames[f];

        if (!(this.numPlays == 0 || this.fNum / this.frames.length <= this.numPlays)) {
            this.played = false;
            this.finished = true;
            return;
        }

        if (f == 0) {
            this.contexts.forEach((ctx) => { ctx.clearRect(0, 0, this.width, this.height); });
            this.prevF = null;
            if (frame.disposeOp == 2) frame.disposeOp = 1;
        }

        if (this.prevF && this.prevF.disposeOp == 1) {
            this.contexts.forEach((ctx) => { ctx.clearRect(this.prevF.left, this.prevF.top, this.prevF.width, this.prevF.height); });
        } else if (this.prevF && this.prevF.disposeOp == 2) {
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

        if (this.nextRenderTime == 0) this.nextRenderTime = now;
        while (now > this.nextRenderTime + this.playTime) this.nextRenderTime += this.playTime;
        this.nextRenderTime += frame.delay / this.rate;
    }
}
export default Animation