import {IObject, IPoint, ISize} from "../gInterface";

// feature样式定义
export interface IFeatureStyle extends IObject {
    stroke?: boolean,
    fill?: boolean,
    arrow?: boolean // 是否携带箭头，目前只针对线段
};

// feature样式定义
export interface IRectShape extends ISize {
    x: number,
    y: number,
    stroke?: boolean,
    fill?: boolean
};

export interface IArrowShape {

};

export interface ILineShape {
    start: IPoint,
    end: IPoint,
    width?: number // 线宽
};

export interface IPolylineShape {
    points: IPoint[],
    width?: number, // 线宽度
};

// 需要定义此数据结构区分洞岛多边形
export interface IPolygonShape {
    points: IPoint[],
    inner?: IPolylineShape[],
    stroke?: boolean,
    fill?: boolean
};

// 绘制点大小
export interface IPointShape {
    r?: number, // 点半径大小, 实际坐标系大小
    sr?: number, // 屏幕大小，与r只会存在一个，如果同时存在，r优先级高
    x: number,
    y: number
};

export interface ICircleShape {
    r?: number, // 点半径大小, 实际坐标系大小
    sr?: number, // 屏幕大小，与r只会存在一个，如果同时存在，r优先级高
    cx: number,
    cy: number
};

// feature-type
export type IFeatureShape = IPointShape | IRectShape | ILineShape | IPolylineShape | IPolygonShape | ICircleShape | IArrowShape;
