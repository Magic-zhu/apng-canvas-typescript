declare class Animation {
    width: number;
    height: number;
    numPlays: number;
    playTime: number;
    frames: any[];
    rate: number;
    nextRenderTime: number;
    fNum: number;
    prevF: any;
    played: boolean;
    finished: boolean;
    contexts: any[];
    lastNum: number;
    constructor();
    play(rate?: number, frameRange?: number[]): void;
    stop(frameNumber: number): void;
    pause(): void;
    start(): void;
    rewind(): void;
    setFrameNum(range: number[]): void;
    addContext(ctx: CanvasRenderingContext2D): void;
    removeContext(ctx: CanvasRenderingContext2D): void;
    private tick;
    private renderFrame;
}
export default Animation;
