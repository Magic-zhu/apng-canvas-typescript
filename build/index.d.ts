declare class APNG {
    static installed: boolean;
    static pluginName: string;
    on: Function;
    emit: Function;
    canYouUseCache: boolean;
    constructor();
    private checkNativeFeatures;
    isSupport(ignoreNativeAPNG?: boolean): Promise<boolean>;
    parseBuffer(buffer: ArrayBuffer): Promise<{}>;
    parseURL(url: string): Promise<any>;
    animateImage(img: HTMLImageElement, autoplay: boolean): Promise<any>;
    ifHasCache(src: string): Promise<unknown>;
    static install(mot: any): void;
}
export default APNG;
