import { AnimationOptions, HookMap } from './interface'
class Animation {

    width: number
    height: number
    numPlays: number
    actualPlays: number
    playTime: number
    frames: any[]
    rate: number

    nextRenderTime: number
    fNum: number
    prevF: any
    played: boolean
    finished: boolean
    contexts: any[]

    endFrame: number // -1 means to the end
    startFrame: number
    beforeHook: Function | null
    afterHook: Function | null
    pauseNum: number
    manualEndNum: number
    manualPlayNum: number

    hookmap: HookMap = {
        stop: []
    }


    constructor() {
        this.width = 0
        this.height = 0
        this.numPlays = 0
        this.actualPlays = 0
        this.playTime = 0
        this.frames = []
        this.rate = 1
        this.nextRenderTime = 0
        this.fNum = 0
        this.prevF = null
        this.played = false
        this.finished = false
        this.contexts = []
        this.endFrame = -1 // -1 means to the end
        this.startFrame = 0
        this.beforeHook = undefined
        this.afterHook = undefined
        this.pauseNum = 0
        this.manualEndNum = -1
        this.manualPlayNum = 0
    }

    /**
     * 
     * @param frameRange 
     */
    play(frameRange: number[] = []): void {
        if (this.played || this.finished) return
        this.rewind()
        this.setFrameNum(frameRange)
        this.played = true
        requestAnimationFrame((time: number) => {
            this.tick(time)
        })
    }

    stop() {
        this.rewind()
        this.hookmap.stop.forEach((func: Function) => {
            func()
        })
    }

    pause(frameNumber?: number) {
        if (frameNumber != undefined) {
            this.manualEndNum = frameNumber
            return
        }
        this.pauseNum = this.fNum
        this.stop()
    }

    start(frameNumber?: number) {
        this.fNum = this.pauseNum
        if (frameNumber != undefined) this.fNum = frameNumber
        this.played = true
        requestAnimationFrame((time: number) => {
            this.tick(time)
        })
    }

    before(func: Function) {
        this.beforeHook = func || null
    }

    after(func: Function) {
        this.afterHook = func || null
    }

    on(hook: string, callback: Function) {
        if(callback == undefined){
           return 
        }
        switch (hook) {
            case 'stop':
                this.hookmap.stop.push(callback)
                break
        }
    }

    rewind() {
        this.nextRenderTime = 0;
        this.fNum = 0;
        this.prevF = null;
        this.played = false;
        this.finished = false;
    }

    private setFrameNum(range: number[]): void {
        if (range.length === 0) return
        this.startFrame = range[0]
        this.fNum = this.startFrame
        if (range.length > 1) this.endFrame = range[1]
    }

    setOptions(options: AnimationOptions) {
        if (options.rate !== undefined) this.rate = options.rate <= 0 ? 1 : options.rate
        if (options.playNum !== undefined) this.manualPlayNum = options.playNum < 0 ? 0 : options.playNum
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
        let f = this.fNum;

        //指定停止
        if (this.manualEndNum !== -1 && f == this.manualEndNum) {
            this.manualEndNum = -1
            this.pause()
            return
        }

        this.fNum++

        //播放1次
        if (this.fNum >= this.frames.length || (this.fNum > this.endFrame && this.endFrame != -1)) {
            this.fNum = this.startFrame
            this.actualPlays++
        }

        let frame = this.frames[f];

        if (this.manualPlayNum != 0 && this.actualPlays >= this.manualPlayNum) {
            this.stop()
            return
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
            if (this.beforeHook != null || this.afterHook != null) {
                ctx.clearRect(0, 0, this.width, this.height)
            }
            this.beforeHook && this.beforeHook(ctx, f)
            ctx.drawImage(frame.img, frame.left, frame.top)
            this.afterHook && this.afterHook(ctx, f)
        })

        if (this.nextRenderTime == 0) this.nextRenderTime = now;
        while (now > this.nextRenderTime + this.playTime) this.nextRenderTime += this.playTime;
        this.nextRenderTime += frame.delay / this.rate;
    }
}
export default Animation