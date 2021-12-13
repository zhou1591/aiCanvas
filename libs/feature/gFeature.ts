import _assign from 'lodash/assign';

import {IObject, IPoint} from '../gInterface';
import FeatureLayer from '../layer/gLayerFeature';
import OverlayLayer from '../layer/gLayerOverlay';
import ExportHelperLayer from '../layer/gLayerExportHelper';
import {IFeatureStyle, IRectShape, IFeatureShape} from './gInterface';
import {EFeatureType} from './gEnum';
import {EDirection} from '../gEnum';

export type TFeatureLayerType = FeatureLayer | OverlayLayer | ExportHelperLayer;

export default class Feature {
    // featureId
    public id: string
    // featureType
    public type: EFeatureType
    // props
    public props: IObject

    // 对象空间数据结构
    public shape: IFeatureShape

    // 最小外接矩形
    public bounds: IRectShape

    // 平移feature的步长，默认1个屏幕项目
    static moveStep: number = 1

    /**
     * props: feature样式
     * defaultStyle: 默认配置项
     * style: userFeatureStyle merge defaultStyle
    */
    static defaultStyle: IFeatureStyle = {
        hidden:false,
        opacity: 1,
        fillStyle: 'rgba(255, 0, 0, 0)',
        lineWidth: 1,
        strokeStyle: '#000' // 边框颜色
    }
    public style: IFeatureStyle

    // feature-container
    public layer: TFeatureLayerType

    // function: constructor
    constructor(id: string, type: EFeatureType, props: IObject = {}, style: IFeatureStyle = {}) {
        this.id = id;
        this.type = type;
        this.props = props;

        this.style = _assign({}, Feature.defaultStyle, style);
    }

    // function: trigger when feature add to featureLayer
    onAdd(layer: TFeatureLayerType): void {
        this.layer = layer;
        this.refresh();
    }

    // trigger when layer remove from map
    // map exits first
    onRemove(): void {
        // 如果map上的activeFeature 为 当前feature，此时需要同步更新map.activeFeature
        const activeFeature = this.layer?.map?.activeFeature;
        if (activeFeature && activeFeature.id === this.id) {
            this.layer.map.setActiveFeature(null);
        }
    }

    // 获取最小外接矩形[各子类自行实现]
    getBounds(): IRectShape {
        return {x: 0, y: 0, width: 0, height: 0};
    }

    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        return false;
    }

    // 更新图形坐标
    updateShape(shape: IFeatureShape) {
        this.shape = shape;
        this.layer?.refresh();

        // 如果map上的activeFeature 为 当前feature，此时需要同步更新map.activeFeature
        const activeFeature = this.layer?.map?.activeFeature;
        if (activeFeature && activeFeature.id === this.id) {
            this.layer.map.setActiveFeature(this);
        }
    }

    // 移动feature, 各子类自行实现对应方法
    onMove(direction: EDirection) {}

    // 改变样式
    setStyle(style: IFeatureStyle, option: IObject = {}) {
        const { refresh = true } = option;
        this.style = _assign(this.style, style);
        refresh && this.layer?.refresh();
    }

    // 改变prop
    updateProp(option: IObject = {}) {
        this.props = _assign(this.props, option);
    }

    // 刷新当前数据
    refresh() {}

    // 打印测试输出
    printInfo() {

    }
    /**
     * @Date: 2021-11-08 15:46:55
     * @description: 统一校验
     */    
    baseValied(){
        if (!this.layer?.map) {
            return;
        }
        if(this.style.hidden)return
        return true
    }
    /**
     * @user: zjs
     * @Date: 2021-12-07 12:09:23
     * @description: 之更改当前选中实例得样式
     */    
     setOnceStyle(style: IFeatureStyle) {
        this.style = _assign(this.style, style);
        this?.refresh();
    }
    /**
     * @user: zjs
     * @Date: 2021-12-07 12:09:23
     * @description: 之更改当前选中实例得props
     */    
     setOnceProp(option: IObject = {}) {
        this.props = _assign(this.props, option);
        this?.refresh();
    }
}
