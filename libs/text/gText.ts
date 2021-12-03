import _assign from 'lodash/assign';
import _isString from 'lodash/isString';

import {IObject, IPoint} from '../gInterface';
import {ETextType} from './gEnum';
import CanvasLayer from '../layer/gLayerCanvas';
import TextLayer from '../layer/gLayerText';
import OverlayLayer from '../layer/gLayerOverlay';
import ExportHelperLayer from '../layer/gLayerExportHelper';
import {ITextInfo, ITextStyle} from './gInterface';
import Graphic from '../gGraphic';

export type TTextLayerType = TextLayer | OverlayLayer | ExportHelperLayer;

export default class Text {
    // textId
    public id: string
    // textType
    public type: ETextType
    // props
    public props: IObject

    // text-container
    public layer: TTextLayerType

    /**
     * props: feature样式
     * defaultStyle: 默认配置项
     * style: userFeatureStyle merge defaultStyle
    */
     static defaultStyle: ITextStyle = {
        hidden:false,
        opacity: 1,
        strokeStyle: '#FF0000',
        background: true, // 是否有背景色
        fontColor: '#FF4046', // 字体颜色
        fillStyle: '#FF0000',
        font: 'normal 12px Arial',
        textAlign: 'left',
        textBaseline: 'bottom'
    }
    public style: ITextStyle

    /**
     * props: text文本
     * defaultTextInfo: 默认文本配置项
     * style: userTextInfo merge defaultTextInfo
    */
    static defaultTextInfo: ITextInfo = {
        text: '',
        position: {x: 0, y: 0}, // 文本位置
        offset: {x: 0, y: 0} // 文本偏移量
    }
    public textInfo: ITextInfo

    // function: constructor
    constructor(id: string, text: ITextInfo, props: IObject = {}, style: ITextStyle = {}) {
        this.id = id;
        this.type = ETextType.Text;
        this.props = props;
        this.textInfo = _assign({}, Text.defaultTextInfo, text);
        this.style = _assign({}, Text.defaultStyle, style);
    }

    // function: trigger when feature add to featureLayer
    onAdd(layer: TTextLayerType): void {
        this.layer = layer;
        this.refresh();
    }

    // trigger when control remove from layer
    // layer exits first
    onRemove(): void {

    }

    // 更新text
    updateText(text: string) {
        if (_isString(text) && text) {
            const textInfo = this.textInfo;
            this.textInfo = {
                ...textInfo,
                text
            };
            this.layer?.refresh();
        }
    }

    // 更新text位置
    updatePosition(position: IPoint) {
        const textInfo = this.textInfo;
        this.textInfo = {
            ...textInfo,
            position
        };
        this.layer?.refresh();
    }

    // 更新text样式
    updateTextStyle(style: ITextStyle) {
        this.style = _assign(this.style, style);
        this.layer?.refresh();
    }

    // 刷新当前数据
    refresh() {
        if (!this.layer?.map) {
            return;
        }
        if(this.style.hidden)return
        const textInfo = this.textInfo;
        const dpr = CanvasLayer.dpr;

        Graphic.drawText(
            this.layer.canvasContext,
            textInfo,
            this.style,
            {
                format: (info: ITextInfo) => {
                    const {position, offset} = info;
                    const {x: screenX, y: screenY} = this.layer.map.transformGlobalToScreen(position);
                    const {x: offsetX, y: offsetY} = offset
                    return {
                        ...info,
                        position: {x: screenX * dpr, y: screenY * dpr},
                        offset: {x: offsetX * dpr, y: offsetY * dpr}
                    };
                }
            }
        );
    }

    // 打印测试输出
    printInfo() {

    }
}
