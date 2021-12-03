import _isNumber from 'lodash/isNumber';

import {IObject, IPoint} from '../gInterface';
import {IArrowShape, IFeatureStyle, ILineShape} from './gInterface';
import {EFeatureType} from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';

export default class ArrowFeature extends Feature {
    // function: constructor
    constructor(id: string, shape: IArrowShape, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EFeatureType.Arrow, props, style);

        this.shape = shape;
    }

    // @override
    // 判断是否捕捉到当前对象，各子类自行实现
    captureWithPoint(point: IPoint): boolean {
        return false
    }

    // 执行绘制当前
    // @override
    refresh() {
        if(!this.baseValied())return
    }
}
