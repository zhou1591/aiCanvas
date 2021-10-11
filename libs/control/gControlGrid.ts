import _assign from 'lodash/assign';
import _isNumber from 'lodash/isNumber';

import Control from './gControl';
import {EControlType} from './gEnum';
import {IObject} from '../gInterface';
import {IGridControlInfo} from './gInterface';
import CanvasLayer from '../layer/gLayerCanvas';

export default class GridControl extends Control {
    /**
     * props: gridInfo可选初始化配置项
     * defaultGridInfo: 默认配置项
     * grid: userGridInfo merge defaultGridInfo
    */
     static defaultGridInfo: IGridControlInfo = {
        position: {
            right: 10,
            bottom: 10
        }, // 位置
        size: {width: 200, height: 200}, // 大小
        grid: { // 网格信息
            columns: [],
            rows: []
        }
    }
    public gridInfo: IGridControlInfo

    public canvas: HTMLCanvasElement
    public canvasContext: CanvasRenderingContext2D

    // function: constructor
    constructor(id: string, gridInfo: IGridControlInfo, props?: IObject, option?: IObject) {
        console.log(111, id);
        super(id, EControlType.Grid, props, option);

        this.gridInfo = _assign({}, GridControl.defaultGridInfo, gridInfo);

        // 创建canvas
        this.creatCanvasElement();
        this.refreshElement();
    }

    refreshElement() {
        // 设置container相关
        this.setContainerSize();
        this.setContainerPosition();
        this.setContainerStyle();
        // 设置canvas大小
        this.setRenderCanvasSize();
    }

    setContainerSize() {
        const {width, height} = this.gridInfo.size;
        this.dom.style.width = width + 'px';
        this.dom.style.height = height + 'px';
    }

    setContainerPosition() {
        const {left, top, right, bottom} = this.gridInfo.position;
        this.dom.style.left = _isNumber(left) ? `${left}px` : 'initial';
        this.dom.style.right = _isNumber(right) ? `${right}px` : 'initial';
        this.dom.style.top = _isNumber(top) ? `${top}px` : 'initial';
        this.dom.style.bottom = _isNumber(bottom) ? `${bottom}px` : 'initial';
    }

    setContainerStyle() {
        this.dom.style.border = '1px solid red';
    }

    // 创建相关element:div & canvas
    creatCanvasElement() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.dom.appendChild(this.canvas);
        // canvas上下文赋值
        this.canvasContext = this.canvas.getContext('2d');
    }

    setRenderCanvasSize() {
        const {width, height} = this.gridInfo.size;
        this.canvas.width = width * CanvasLayer.dpr;
        this.canvas.height = height * CanvasLayer.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    // 执行绘制当前
    // @override
    refresh() {

    }
}
