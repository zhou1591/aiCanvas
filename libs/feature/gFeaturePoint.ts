import _isNumber from 'lodash/isNumber';
import _assign from 'lodash/assign';

import {IObject, IPoint} from '../gInterface';
import {IFeatureStyle, ILineShape, IPointShape} from './gInterface';
import {EFeatureType} from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';

export default class PointFeature extends Feature {
    static defaultOption: IObject = {
        active: false // 是否绘制选中态，默认不是选中态【内部使用/内部使用/内部使用】
    }
    // PointFeature附件选项，附加字段
    public option: IObject = {}

    // function: constructor
    constructor(id: string, shape: IPointShape, props: IObject = {}, style: IFeatureStyle = {}, option?: IObject) {
        super(id, EFeatureType.Point, props, style);

        this.shape = shape;

        this.option = _assign({}, PointFeature.defaultOption, option || {});
    }

    // @override
    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        const {x, y, r, sr} = this.shape as IPointShape;
        const mapScale = this.layer?.map?.getScale();
        const buffer = mapScale ? 3 / mapScale : 0;
        const tolerance = _isNumber(r) ? (r + buffer) : (_isNumber(sr) ? (sr / mapScale + buffer) : buffer);
        return Util.MathUtil.pointInPoint(point, {x, y}, {tolerance});
    }

    // 执行绘制当前
    // @override
    refresh() {
        // 执行坐标转换
        const {x, y, r, sr} = this.shape as IPointShape;

        if (!this.layer?.map) {
            return;
        }

        const {x: screenX, y: screenY} = this.layer.map.transformGlobalToScreen({x, y});

        const dpr = CanvasLayer.dpr;
        const scale = this.layer.map.getScale();
        const screenWidth = _isNumber(r)
            ? r * scale
            : (_isNumber(sr) ? sr : 2);

        const cx = screenX * dpr;
        const cy = screenY * dpr;
        const cr = screenWidth * dpr;

        Graphic.drawPoint(
            this.layer.canvasContext,
            {x: cx, y: cy, r: cr},
            this.style,
            {}
        );

        // 说明是选中态，需要绘制边框&交叉线
        if (this.option.active) {
            const LTX = cx - cr - 2;
            const LTY = cy - cr - 2;
            const width = cr * 2 + 4;
            const height = cr * 2 + 4;
            // 绘制对角线
            const RTX = LTX + width;
            const RTY = LTY;
            const RBX = RTX;
            const RBY = RTY + height;
            const LBX = LTX;
            const LBY = RBY;
            // 绘制斜对角线
            Graphic.drawLine(
                this.layer.canvasContext,
                {start: {x: LTX, y: LTY}, end: {x: RBX, y: RBY}},
                {strokeStyle: '#fff'}
            );
            Graphic.drawLine(
                this.layer.canvasContext,
                {start: {x: RTX, y: RTY}, end: {x: LBX, y: LBY}},
                {strokeStyle: '#fff'}
            );
            // 绘制外接矩形
            Graphic.drawRect(
                this.layer.canvasContext,
                {x: LTX, y: LTY, width, height},
                {strokeStyle: '#666'}
            );
        }
    }
}
