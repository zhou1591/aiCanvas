import {IObject, IPoint} from "../gInterface";

// marker相关信息
export interface IMarkerInfo extends IObject {
    src: string,
    position: IPoint // 文本位置【textBaseline: 'bottom'->左下角;'top'->左上角】
    offset?: IPoint // 文本偏移量
};
