import _assign from 'lodash/assign';

import {IObject, IPoint} from '../gInterface';
import {IFeatureStyle} from '../feature/gInterface';
import {EMaskActionType} from './gEnum';
import Action from './gAction';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import {IImageInfo} from '../layer/gInterface';

export default class ImageActionFeature extends Action {
    // 当前涂抹action分类
    category: string = ''

    /**
     * props: image可选初始化配置项
     * defaultImageInfo: 默认配置项
     * image: userImage merge defaultImageInfo
    */
    static defaultImageInfo: IImageInfo = {
        src: '',
        width: 0,
        height: 0,
        crossOrigin: false,
        position: {x: 0, y: 0} // 默认起始位置
    }
    public imageInfo: IImageInfo
    public image: HTMLImageElement

    public position: IPoint // 图片当前的位置

    // function: constructor
    constructor(id: string, category: string, image: IImageInfo, props: IObject = {}, style: IFeatureStyle = {}) {
        super(id, EMaskActionType.Image, props, style);

        this.imageInfo = _assign({}, ImageActionFeature.defaultImageInfo, image);
        this.position = this.imageInfo.position;
        this.updateImage();
        this.category = category;
    }

    // 更新image对象
    updateImage() {
        if (this.imageInfo.src) {
            this.image = new Image();

            if (this.imageInfo.crossOrigin) {
                this.image.setAttribute('crossOrigin', 'anonymous');
            }
            else {
                this.image.removeAttribute('crossOrigin');
            }

            this.image.src = this.imageInfo.src;
            this.image.onload = () => (this.layer && this.refresh());
        }
    }

    // 绘制image信息
    drawImage() {
        if (!this.layer?.map) {
            return;
        }
        // 执行坐标转换
        const {x: screenX, y: screenY} = this.layer.map.transformGlobalToScreen(this.position);

        const dpr = CanvasLayer.dpr;
        const scale = this.layer.map.getScale();
        const {width, height} = this.imageInfo;
        const screenWidth = width * scale;
        const screenHeight = height * scale;

        Graphic.drawImage(
            this.layer.canvasContext,
            {
                image: this.image,
                x: screenX * dpr,
                y: screenY * dpr,
                width: screenWidth * dpr,
                height: screenHeight * dpr
            },
            {}
        );
    }

    // 执行绘制当前
    // @override
    refresh() {
        super.refresh();
        this.drawImage();
    }
}
