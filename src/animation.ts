class Animation {

    width: number = 0
    height: number = 0
    numPlays: number = 0;
    playTime: number = 0;
    frames = [];
    rate: number = 1;

    nextRenderTime: number = 0;
    fNum: number = 0;
    prevF = null;
    played: boolean = false;
    finished: boolean = false;

    constructor() {

    }

    play(rate: number): void {
        if (rate && rate > 0) this.rate = rate;
        if (this.played || this.finished) return;
        this.rewind();
        this.played = true;
        requestAnimationFrame(this.tick);
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

    private tick(now) {
        while (this.played && this.nextRenderTime <= now) this.renderFrame(now);
        if (this.played) requestAnimationFrame(this.tick);
    }

    private renderFrame(now) {

    }
}
export default Animation