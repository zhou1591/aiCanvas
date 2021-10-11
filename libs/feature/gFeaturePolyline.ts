import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';

import {IObject, IPoint} from '../gInterface';
import {IFeatureStyle, IPolylineShape} from './gInterface';
import {EFeatureType} from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';

export default class PolylineFeature extends Feature {
    // function: constructor
    constructor(id: string, shape: IPolylineShape, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EFeatureType.Polyline, props, style);

        this.shape = shape;
    }

    // @override
    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        const {points = [], width} = this.shape as IPolylineShape;
        const mapScale = this.layer?.map?.getScale();
        const bufferWidth = mapScale ? 3 / mapScale : 0;
        const tolerance = _isNumber(width) ? (width / 2 + bufferWidth) : bufferWidth;
        return Util.MathUtil.pointInPolyline(point, points, {tolerance});
    }

    // 执行绘制当前
    // @override
    refresh() {
        if (!this.layer?.map) {
            return;
        }

        // 执行坐标转换
        const dpr = CanvasLayer.dpr;
        const scale = this.layer.map.getScale();

        Graphic.drawPolyline(
            this.layer.canvasContext,
            this.shape as IPolylineShape,
            this.style,
            {
                format: shape => {
                    const {points, width} = shape;
                    return {
                        points: _map(points, point => {
                            const {x:screenX, y: screenY} = this.layer.map.transformGlobalToScreen(point);
                            return {x: screenX * dpr, y: screenY * dpr}
                        }),
                        ...(_isNumber(width) ? {width: width * scale * dpr} : {})
                    }
                }
            }
        );
    }
}
