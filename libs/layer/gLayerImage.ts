import events from 'events/events';
import _forEach from 'lodash/forEach';
import _assign from 'lodash/assign';
import _get from 'lodash/get';

import Map from '../gMap';
import { IObject, IPoint } from '../gInterface';
import Graphic from '../gGraphic';

import { ILayerStyle, IImageInfo, IGridInfo, IGridItemInfo } from './gInterface';
import CanvasLayer from './gLayerCanvas';
import { ELayerImageEventType, ELayerType } from './gEnum';
import { EXAxisDirection, EYAxisDirection } from '../gEnum';

export default class ImageLayer extends CanvasLayer {
    /**
     * props: image可选初始化配置项
     * defaultImageInfo: 默认配置项
     * image: userImage merge defaultImageInfo
    */
    static defaultImageInfo: IImageInfo = {
        src: '',
        width: 0,
        height: 0,
        position: { x: 0, y: 0 }, // 默认起始位置
        crossOrigin: false,
        grid: {
            columnsNum: 0,
            rowsNum: 0,
            columns: [],
            rows: []
        }
    }
    public imageInfo: IImageInfo
    public image: HTMLImageElement
    public imageSuccess: boolean = false // 标识图片是否是有效图片

    public position: IPoint // 图片当前的位置

    public grid: IGridInfo // 图片网格

    // events
    public eventsObServer: events.EventEmitter

    // function: constructor
    constructor(id: string, image: IImageInfo, props: IObject = {}, style: ILayerStyle = {}) {
        super(id, ELayerType.Image, props, style);

        // 事件监听实例添加
        this.eventsObServer = new events.EventEmitter();

        this.imageInfo = _assign({}, ImageLayer.defaultImageInfo, image);
        this.position = this.imageInfo.position;
        this.grid = this.imageInfo.grid;
        // this.updateImage();
    }

    // 更新图片信息
    updateImageInfo(image: IImageInfo) {
        this.imageInfo = _assign({}, this.imageInfo, image);
        image.position && (this.position = this.imageInfo.position);
        image.src && this.updateImage();
        this.refresh();
    }

    // 更新image对象
    updateImage() {
        if (this.imageInfo.src) {
            this.imageSuccess = false;
            // 首先执行loadStart回调
            this.eventsObServer.emit(
                ELayerImageEventType.LoadStart,
                this.imageInfo.src,
                this
            );
            this.image = new Image();

            if (this.imageInfo.crossOrigin) {
                this.image.setAttribute('crossOrigin', 'anonymous');
            }
            else {
                this.image.removeAttribute('crossOrigin');
            }

            this.image.src = this.imageInfo.src;
            this.image.onload = () => {
                this.imageSuccess = true;
                this.map && this.refresh();
                this.eventsObServer.emit(
                    ELayerImageEventType.LoadEnd,
                    this.imageInfo.src,
                    this
                );
            };
            this.image.onerror = () => {
                this.imageSuccess = false;
                console.error('image src: ' + this.imageInfo.src + ' load error');
                this.eventsObServer.emit(
                    ELayerImageEventType.LoadError,
                    this.imageInfo.src,
                    this
                );
            }
        }
    }

    // 更新grid网格
    updateGrid(gridInfo: IGridInfo) {
        this.grid = gridInfo;

        this.refresh();
    }

    // @override
    onAdd(map: Map) {
        super.onAdd(map);

        this.updateImage();
        this.refresh();
    }

    // 绘制image信息
    drawImage() {
        // 执行坐标转换
        const { x: screenX, y: screenY } = this.map.transformGlobalToScreen(this.position);

        const dpr = CanvasLayer.dpr;
        const scale = this.map.getScale();
        const { width, height } = this.imageInfo;
        const screenWidth = width * scale;
        const screenHeight = height * scale;

        (this.image && this.imageSuccess) && Graphic.drawImage(
            this.canvasContext,
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

    // 绘制grid信息
    drawGrid() {
        const { width, height } = this.imageInfo;
        const { x: startX, y: startY } = this.position;
        const dpr = CanvasLayer.dpr;

        const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;

        const columns = _get(this.grid, 'columns', []);
        const rows = _get(this.grid, 'rows', []);
        // 取列和宽
        const columnsNum = _get(this.grid, 'columnsNum', 0);
        const rowsNum = _get(this.grid, 'rowsNum', 0);

        // 绘制列
        // const columnsCount = columns.length;
        const columnItemWidth = width / (columnsNum + 1);
        // _forEach(columns, (column: IGridItemInfo, index: number) => {
        // 这里改成了自定义列 !!!
        for (let index = 1; index<columnsNum; index++) {
            const { color: lineColor = '#F56C6C', width: lineWidth = 1 } = columns[index] || {};
            const totalItemWidth = (index + 1) * columnItemWidth;
            const itemX = isXAxisRight ? (startX + totalItemWidth) : (startX - totalItemWidth);

            const itemTopY = startY;
            const itemBottomY = isYAxisTop ? (startY - height) : (startY + height);

            const startPoint = this.map.transformGlobalToScreen({ x: itemX, y: itemTopY });
            const endPoint = this.map.transformGlobalToScreen({ x: itemX, y: itemBottomY });

            Graphic.drawLine(
                this.canvasContext,
                {
                    start: {x:  Math.round(startPoint.x * dpr), y: Math.round(startPoint.y * dpr) },
                    end: { x: Math.round(endPoint.x * dpr), y: Math.round(endPoint.y * dpr) }
                },
                {
                    strokeStyle: lineColor,
                    lineWidth: lineWidth
                }
            );
        }
        // });

        // 绘制行
        // const rowsCount = rows.length;
        const rowItemHeight = height / (rowsNum + 1);
        // 这里改成了自定义列 !!!
        for (let index = 1; index<rowsNum; index++) {
            // _forEach(rows, (row: IGridItemInfo, index: number) => {
            const { color: lineColor = '#F56C6C', width: lineWidth = 1 } = rows[index] || {};
            const totalItemHeight = (index + 1) * rowItemHeight;
            const itemY = isYAxisTop ? (startY - totalItemHeight) : (startY + totalItemHeight);

            const itemLeftX = startX;
            const itemRightX = isXAxisRight ? (startX + width) : (startX - width);

            const startPoint = this.map.transformGlobalToScreen({ x: itemLeftX, y: itemY });
            const endPoint = this.map.transformGlobalToScreen({ x: itemRightX, y: itemY });

            Graphic.drawLine(
                this.canvasContext,
                {
                    start: { x: Math.round(startPoint.x * dpr), y: Math.round(startPoint.y * dpr) },
                    end: { x: Math.round(endPoint.x * dpr), y: Math.round(endPoint.y * dpr) }
                },
                {
                    strokeStyle: lineColor,
                    lineWidth: lineWidth
                }
            );
        }
        // });
    }

    // 用户事件添加
    public events: IObject = {
        on: (eventType: ELayerImageEventType, callback: Function) => {
            this.eventsObServer.on(eventType, callback);
        }
    }

    // @override
    refresh() {
        super.refresh();
        this.drawImage();
        this.drawGrid();
    }
}
