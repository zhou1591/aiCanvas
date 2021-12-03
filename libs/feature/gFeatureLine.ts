import _isNumber from 'lodash/isNumber';

import {IObject, IPoint} from '../gInterface';
import {IFeatureStyle, ILineShape} from './gInterface';
import {EFeatureType} from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';

export default class LineFeature extends Feature {
    // function: constructor
    constructor(id: string, shape: ILineShape, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EFeatureType.Line, props, style);

        this.shape = shape;
    }

    // @override
    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        const {start, end, width} = this.shape as ILineShape;
        const mapScale = this.layer?.map?.getScale();
        const bufferWidth = mapScale ? 3 / mapScale : 0;
        const tolerance = _isNumber(width) ? (width / 2 + bufferWidth) : bufferWidth;
        return Util.MathUtil.pointInPolyline(point, [start, end], {tolerance});
    }

    // 获取线宽
    getLineWidth() {
        const {width} = this.shape as ILineShape;
        const styleLineWidth = this.style.lineWidth || 1;
        const scale = this.layer?.map?.getScale();
        return width ? (width * scale) : styleLineWidth
    }

    // 执行绘制当前
    // @override
    refresh() {
        if(!this.baseValied())return

        // 执行坐标转换
        const {start, end, width} = this.shape as ILineShape;
        const {x: startX, y: startY} = this.layer.map.transformGlobalToScreen(start);
        const {x: endX, y: endY} = this.layer.map.transformGlobalToScreen(end);

        const dpr = CanvasLayer.dpr;
        const scale = this.layer.map.getScale();
        const screenWidth = (width || 0) * scale;
        const lineWidth = this.getLineWidth();

        // // draw the starting arrowhead
        // var startRadians=Math.atan((y2-y1)/(x2-x1));
        // startRadians+=((x2>x1)?-90:90)*Math.PI/180;

        // draw the ending arrowhead
        let endRadians = Math.atan((endY - startY) / (endX - startX));
        endRadians += ((endX > startX) ? 90 : -90) * Math.PI / 180;
        const xDistance = lineWidth * 1.2 * dpr;
        const bufferDltY = lineWidth * 1.4 * dpr;

        // 判断是否绘制箭头
        if (this.style.arrow) {
            Graphic.drawArrow(
                this.layer.canvasContext,
                {
                    position: {
                        x: endX * dpr,
                        y: endY * dpr
                    },
                    points: [
                        {x: 0 * dpr, y: 0 - bufferDltY},
                        {x: xDistance, y: xDistance * 2 - bufferDltY},
                        {x: -xDistance, y: xDistance * 2 - bufferDltY}
                    ]
                },
                endRadians,
                {
                    ...this.style,
                    lineWidth: 2,
                    ...(this.style.strokeStyle ? {fillStyle: this.style.strokeStyle} : {})
                }
            );
        }

        // 绘制线段
        Graphic.drawLine(
            this.layer.canvasContext,
            {
                start: {x: startX * dpr, y: startY * dpr},
                end: {x: endX * dpr, y: endY * dpr},
                ...(_isNumber(width) ? {width: screenWidth * dpr} : {})
            },
            this.style,
            {}
        );
    }
}
