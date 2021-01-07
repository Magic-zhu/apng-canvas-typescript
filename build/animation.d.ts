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
    constructor();
    play(rate: number): void;
    stop(): void;
    pause(): void;
    restart(): void;
    rewind(): void;
    addContext(ctx: CanvasRenderingContext2D): void;
    removeContext(ctx: CanvasRenderingContext2D): void;
    private tick;
    private renderFrame;
}
export default Animation;
