/***/

import {EMapMode, EXAxisDirection, EYAxisDirection, EEventSlotType} from "./gEnum";
import Layer from "./layer/gLayer";
import OverlayLayer from "./layer/gLayerOverlay";

// 基本json对象定义
export interface IObject {
    [other: string]: any
};

// 插槽事件处理，可以将用户侧代码进行插入执行
export interface IFunctionPoint {
    (point: IPoint, overlayLayer: OverlayLayer): any
}
export type IFunctionSlot = IFunctionPoint;
export interface IEventSlotType extends IObject {
    [EEventSlotType.DrawActivePoint]?: IFunctionPoint,
    [EEventSlotType.DrawActiveMiddlePoint]?: IFunctionPoint
};

// Size: interface
export interface ISize {
    width: number,
    height: number
};

// Point: interface
export interface IPoint {
    x: number,
    y: number
};

// IBasePoint: interface
export interface IBasePoint {
    screen: IPoint,
    global: IPoint
};

// ITransPointOption
export interface ITransPointOption {
    basePoint?: IBasePoint,
    zoom?: number
};

// map.centerAndZoom参数
export interface ICenterAndZoom {
    center?: IPoint,
    zoom?: number
};

// mapOptions: 实例map容器配置项

export interface IAxisOption {
    direction: EXAxisDirection | EYAxisDirection
};

export interface IMapOptions {
    center?: IPoint,
    zoom?: number,
    zoomWheelRatio?: number,
    size?: ISize,
    mode?: EMapMode,
    refreshDelayWhenZooming?: boolean,
    zoomWhenDrawing?: boolean,
    panWhenDrawing?: boolean,
    withHotKeys?: boolean,
    featureCaptureWhenMove?: boolean,
    xAxis?: IAxisOption
    yAxis?: IAxisOption
};

export type TExportImageType = 'base64' | 'blob'
export type TExportImageFormat = 'image/png' | 'image/jpeg'
export interface IExportOption {
    layers?: Layer[],
    type?: TExportImageFormat,
    format?: TExportImageFormat,
    quality?: number
};
