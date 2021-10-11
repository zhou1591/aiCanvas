import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';

import {IObject} from '../gInterface';
import {IDrawActionShape} from './gInterface';
import {IFeatureStyle} from '../feature/gInterface';
import {EMaskActionType} from './gEnum';
import Action from './gAction';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';

export default class DrawActionFeature extends Action {
    // 当前涂抹action分类
    category: string = ''

    // function: constructor
    constructor(id: string, category: string, shape: IDrawActionShape, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EMaskActionType.Draw, props, style);

        this.shape = shape;
        this.category = category;
    }

    // 执行绘制当前
    // @override
    refresh() {
        // 执行坐标转换
        const dpr = CanvasLayer.dpr;
        const scale = this.layer.map.getScale();

        // 设置倒圆角
        const formateStyle = {
            ...(this.style || {}),
            lineCap: 'round',
            lineJoin: 'round'
        };

        Graphic.drawPolyline(
            this.layer.canvasContext,
            this.shape as IDrawActionShape,
            formateStyle,
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
