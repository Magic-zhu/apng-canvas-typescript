declare class APNG {
    constructor();
    parseBuffer(buffer: ArrayBuffer): Promise<{}>;
    parseURL(url: string): Promise<any>;
    animateImage(img: HTMLImageElement, autoplay: boolean): Promise<any>;
    static install(mot: any): void;
}
export default APNG;
