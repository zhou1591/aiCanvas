import _forEach from 'lodash/forEach';
import _assign from 'lodash/assign';
import _last from 'lodash/last';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import _filter from 'lodash/filter';
import _uniq from 'lodash/uniq';

import {IPoint} from '../gInterface';

import Action from '../mask/gAction';
import CanvasLayer from './gLayerCanvas';
import {IRectShape} from '../feature/gInterface';

export default class MaskHelperLayer  {
    public bounds: IRectShape // canvas大小

    public canvas: OffscreenCanvas
    public canvasContext: OffscreenCanvasRenderingContext2D
    // public canvas: HTMLCanvasElement
    // public canvasContext: CanvasRenderingContext2D

    public actions: Action[] = [] // 当前maskLayer中所有的actions

    // 伪造map对象，给feature使用
    public map = {
        getScale() {
            return 1;
        },
        transformGlobalToScreen(point: IPoint): IPoint {
            const {x, y} = point;
            const {x: startX, y: startY} = this.bounds;
            return {x: x - startX, y: y - startY};
        }
    }

    // function: constructor
    constructor(bounds: IRectShape) {
        this.bounds = bounds;
        this.createRenderCanvas();

        // 对象冒充运行环境
        this.map.getScale = this.map.getScale.bind(this);
        this.map.transformGlobalToScreen = this.map.transformGlobalToScreen.bind(this);
    }

    // override 创建offscreenCanvas层
    createRenderCanvas() {
        const {width, height} = this.bounds;
        this.canvas = new OffscreenCanvas(width, height);
        this.canvas.width = width * CanvasLayer.dpr;
        this.canvas.height = height * CanvasLayer.dpr;
        this.canvasContext = this.canvas.getContext('2d');

        // const {width, height} = this.bounds;
        // this.canvas = document.createElement('canvas');
        // this.canvas.width = width * CanvasLayer.dpr;
        // this.canvas.height = height * CanvasLayer.dpr;
        // this.canvas.style.width = width + 'px';
        // this.canvas.style.height = height + 'px';
        // this.canvas.style.border = '1px solid red';
        // this.canvasContext = this.canvas.getContext('2d');
        // document.body.appendChild(this.canvas);
    }

    // 添加action至当前ActionLayer中
    addAction(action: Action) {
        action.setStyle({strokeStyle: '#ff0000', fillStyle: '#ff0000'}, {refresh: false});
        action.onAdd(this);
        this.actions.push(action);
    }

    // 添加actions至当前ActionLayer中
    addActions(actions: Action[]) {
        _forEach(actions, (action: Action) => this.addAction(action));
    }

    // 获取当前层上的pixels
    getRle() {
        const rlePixels = []; // rle数据，第一位是统计value=1的像素数
        const dpr = CanvasLayer.dpr;
        const {width: realWidth, height: realHeight} = this.bounds;
        const {width, height} = this.canvas;
        const pixels = this.canvasContext.getImageData(0, 0, width, height).data;

        let pixelCount = 0; // 统计数据
        let lastPixelValue = 1; // 上一次pixel-value值
        for (let i = 0; i < realHeight; i++) {
            for (let j = 0; j < realWidth; j++) {
                const rIndex = (i * dpr * realWidth + j) * 4 * dpr;
                const rValue = pixels[rIndex];
                const gValue = pixels[rIndex + 1];
                const bValue = pixels[rIndex + 2];
                const aValue = pixels[rIndex + 3];
                const currentPixelValue = +(!!(rValue || gValue || bValue || aValue));

                // 如果当前pixelValue === lastPixelValue 上一次的pixel值
                if (currentPixelValue === lastPixelValue) {
                    pixelCount++;
                }
                else {
                    // 此时需要进行push数据
                    rlePixels.push(pixelCount);
                    pixelCount = 1; // 计数重置为1
                }
                // 然后判断是否达到最后一个像素点
                if ((i + 1) === realHeight && (j + 1) === realWidth) {
                    rlePixels.push(pixelCount);
                }
                lastPixelValue = currentPixelValue;
            }
        }
        return rlePixels;
    }

    // @override
    refresh() {
        // 绘制actions中所有action对象
        _forEach(this.actions, (action: Action) => action.refresh());
    }

    // 清空canvas画布
    clear() {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
