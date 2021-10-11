import _assign from 'lodash/assign';

import {IObject} from '../gInterface';
import OverlayLayer from '../layer/gLayerOverlay';
import MaskLayer from '../layer/gLayerMask';
import MaskHelperLayer from '../layer/gLayerMaskHelper';
import ExportHelperLayer from '../layer/gLayerExportHelper';
import {IDrawActionShape} from './gInterface';
import {IFeatureStyle} from '../feature/gInterface';
import {EMaskActionType} from './gEnum';

export default class Action {
    // actionId
    public id: string
    // actionType
    public type: EMaskActionType
    // props
    public props: IObject

    // 对象空间数据结构
    public shape: IDrawActionShape

    /**
     * props: action样式
     * defaultStyle: 默认配置项
     * style: userFeatureStyle merge defaultStyle
    */
    static defaultStyle: IFeatureStyle = {
        opacity: 1,
        fillStyle: 'rgba(255, 0, 0, 0)',
        lineWidth: 1,
        strokeStyle: '#000' // 边框颜色
    }
    public style: IFeatureStyle

    // action-container
    public layer: MaskLayer | MaskHelperLayer | OverlayLayer | ExportHelperLayer

    // function: constructor
    constructor(id: string, type: EMaskActionType, props: IObject = {}, style: IFeatureStyle = {}) {
        this.id = id;
        this.type = type;
        this.props = props;

        this.style = _assign({}, Action.defaultStyle, style);
    }

    // function: trigger when feature add to featureLayer
    onAdd(layer: MaskLayer | MaskHelperLayer | OverlayLayer): void {
        this.layer = layer;
        this.refresh();
    }

    // trigger when action remove from layer
    // layer exits first
    onRemove(): void {

    }

    // 改变样式
    setStyle(style: IFeatureStyle, option?: IObject) {
        const {refresh = true} = option;
        this.style = style;
        refresh && this.layer?.refresh();
    }

    // 刷新当前数据
    refresh() {}

    // 打印测试输出
    printInfo() {

    }
}
