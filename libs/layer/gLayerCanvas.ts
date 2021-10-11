// canvas-layer
// based zRender

import Map from '../gMap';
import {IObject} from '../gInterface';
import {ILayerStyle} from './gInterface';
import Layer from './gLayer';
import {ELayerType} from './gEnum';

export default class CanvasLayer extends Layer  {
    static dpr: number = window.devicePixelRatio // 实例化时创建

    public canvas: HTMLCanvasElement
    public canvasContext: CanvasRenderingContext2D

    // function: constructor
    constructor(id: string, layerType: ELayerType, props: IObject = {}, style: ILayerStyle = {}) {
        super(id, layerType, props, style);
        this.createRenderCanvas();
    }

    onAdd(map: Map): void {
        super.onAdd(map);
        this.resize();
    }

    // 创建canvas层
    createRenderCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.dom.appendChild(this.canvas);
        // canvas上下文赋值
        this.canvasContext = this.canvas.getContext('2d');
    }

    // @override
    resize() {
        // 对容器进行重新resize
        super.resize();
        // 对canvas进行resize
        const {width, height} = this.map.getSize();
        this.canvas.width = width * CanvasLayer.dpr;
        this.canvas.height = height * CanvasLayer.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    // @override
    refresh() {
        // 进行canvas画布清除
        this.clear();
        super.refresh();
    }

    // 清空canvas画布
    clear() {
        this.canvasContext?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
