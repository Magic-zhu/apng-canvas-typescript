
interface Frame {
    width?: number
    height?: number
    left?: number
    top?: number
    delay?: number
    disposeOp?: number
    blendOp?: number
    dataParts?: any[]
}

export type FrameItem = Frame | null
