import {IFeatureStyle} from "../feature/gInterface";
import {IObject, IPoint} from "../gInterface";

// text样式定义
export interface ITextStyle extends IFeatureStyle {
    background?: boolean, // 是否需要背景填充
    fontColor?: string, // 字体颜色
    maxWidth?: number, // text最大宽
    width?: number, // text文本宽
};

// text相关文本信息
export interface ITextInfo extends IObject {
    text: string,
    position: IPoint // 文本位置【textBaseline: 'bottom'->左下角;'top'->左上角】
    offset?: IPoint // 文本偏移量
};
