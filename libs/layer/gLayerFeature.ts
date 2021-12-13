import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _filter from 'lodash/filter';
import _find from 'lodash/find';

import Feature from '../feature/gFeature';

import {IObject, IPoint} from '../gInterface';
import {ILayerStyle, IFeatureAddOption} from './gInterface';
import CanvasLayer from './gLayerCanvas';
import {ELayerType} from './gEnum';
import { calcCircleArea, calcPolygonArea, calcRectArea } from './helper/index';

export default class FeatureLayer extends CanvasLayer  {
    public features: Feature[] = [] // 当前featureLayer中所有的features

    // refresh方法时调用refresh是否延迟
    public refreshDelayTimer: number | null | undefined

    // function: constructor
    constructor(id: string, props: IObject = {}, style: ILayerStyle = {}) {
        super(id, ELayerType.Feature, props, style);
    }

    // 添加feature至当前FeatureLayer中
    addFeature(feature: Feature, option?: IFeatureAddOption) {
        const {clear = false} = option || {};
        if (clear) {
            this.features = [];
            this.clear();
        }

        feature.onAdd(this);
        this.features.push(feature);
    }

    // 删除feature
    removeFeatureById(targetFeatureId: string) {
        const newFeatures = _filter(this.features, (feature: Feature) => {
            const featureId = feature.id;
            if (featureId === targetFeatureId) {
                feature.onRemove();
                return false;
            }
            return true;
        });
        // 重新设置最新的features
        this.features = newFeatures;
        // 执行重绘刷新
        this.refresh();
    }

    // 获取指定feature对象
    getFeatureById(targetFeatureId: string) {
        return _find(this.features, ({id}) => (id === targetFeatureId));
    }

    // 获取所有features
    getAllFeatures(): Feature[] {
        return this.features;
    }

    // 删除所有features
    removeAllFeatures() {
        const newFeatures = _filter(this.features, (feature: Feature) => {
            feature.onRemove();
            return false;
        });
        // 重新设置最新的features
        this.features = newFeatures;
        // 执行重绘刷新
        this.refresh();
    }

    // 根据点获取命中的feature
    getTargetFeatureWithPoint(point: IPoint): Feature | null {
        const targetFeatures = []; // 为了以后命中多个的返回判断
        _forEach(this.features, (feature: Feature) => {
            const captured = feature.captureWithPoint(point);
            if (captured) {
                targetFeatures.push(feature);
                return false; // 中断玄幻
            }
        });
        return _get(targetFeatures, '[0]', null);
    }

    /**
     * @user: zjs
     * @Date: 2021-12-13 15:40:42
     * @description: 获取当前点选中的面积最小的图层
     * 和所有符合的图层
     */    
    getTargetMinAreaByAllFeature(point: IPoint): any {
        let isBreak =false
        const targetFeatures = []; // 为了以后命中多个的返回判断
        const minAreaFeature = {
            feature:null,
            area:999999,//初始面积
        }; // 为了以后命中多个的返回判断
        this.features.forEach((feature: Feature) => {
            if(isBreak)return
            const captured = feature.captureWithPoint(point);
            // 是否在选中范围内
            if (captured) {
                targetFeatures.push(feature)
                // 这三种类型要明确点到 如果是的话 那就是最近的
                if(["POINT","LINE","POLYLINE"].includes(feature.type)){
                    minAreaFeature.feature = feature
                    minAreaFeature.area = 0
                    isBreak=true
                }
                // 选择使用面积的方法
                const useMethod={
                    "CIRCLE":calcCircleArea,//圆形
                    "RECT":calcRectArea,//矩形
                    "POLYGON":calcPolygonArea,//多边形
                }
                // 不是这三个类型的话不需要计算
                if(!Object.keys(useMethod).includes(feature.type))return
                const activeArea = useMethod[feature.type](feature.shape)
                // 面积比当前存储的小
                if(activeArea<minAreaFeature.area){
                    minAreaFeature.feature = feature
                    minAreaFeature.area = activeArea
                }
            }
        })
        return minAreaFeature.feature
    }

    // @override
    refresh(refreshDelay: boolean = false) {
        // 首先清除refreshTimer
        if (this.refreshDelayTimer) {
            window.clearTimeout(this.refreshDelayTimer);
            this.refreshDelayTimer = null;
        }
        super.refresh();

        // 延迟执行刷新
        if (refreshDelay) {
            this.refreshDelayTimer = window.setTimeout(() => {
                _forEach(this.features, (feature: Feature) => feature.refresh());
            }, 100);
            return;
        }

        // 立即执行刷新
        _forEach(this.features, (feature: Feature) => feature.refresh());
    }
}
