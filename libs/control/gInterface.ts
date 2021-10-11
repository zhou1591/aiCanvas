import {IObject, IPoint, ISize} from "../gInterface";
import {IGridInfo} from "../layer/gInterface";


// css位置
export interface ICssPosition {
    right?: number,
    left?: number,
    top?: number,
    bottom?: number
};


//
export interface IGridControlInfo extends IObject {
    position?: ICssPosition, // 网格位置
    size?: ISize, // 容器宽高
    grid?: IGridInfo
};
