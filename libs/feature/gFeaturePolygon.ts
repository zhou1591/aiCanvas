import {IObject, IPoint} from '../gInterface';
import FeatureLayer from '../layer/gLayerFeature';
import {IFeatureStyle, IPolygonShape, IRectShape} from './gInterface';
import {EFeatureType} from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';

export default class PolygonFeature extends Feature {
    // function: constructor
    constructor(id: string, shape: IPolygonShape, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EFeatureType.Polygon, props, style);

        this.shape = shape;
    }

    // @override
    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        const {points = []} = this.shape as IPolygonShape;
        return Util.MathUtil.pointInPolygon(point, points);
    }

    // 执行绘制当前
    // @override
    refresh() {
        if (!this.layer?.map) {
            return;
        }

        // 执行坐标转换
        const {points, inner = []} = this.shape as IPolygonShape;

        const dpr = CanvasLayer.dpr;

        Graphic.drawPolygon(
            this.layer.canvasContext,
            points,
            this.style,
            {format: point => {
                const {x:screenX, y: screenY} = this.layer.map.transformGlobalToScreen(point);
                return {x: screenX * dpr, y: screenY * dpr}
            }}
        );
    }
}
