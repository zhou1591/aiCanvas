// mask-layer add to platform
// 用以接收各类事件，将其至于顶层中

import _uniqueId from 'lodash/uniqueId';
import _map from 'lodash/map';
import _last from 'lodash/last';
import _cloneDeep from 'lodash/cloneDeep';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isNumber from 'lodash/isNumber';
import _includes from 'lodash/includes';
import _filter from 'lodash/filter';

import Map from '../gMap';
import ClearAction from '../mask/gActionClear';
import {IBasePoint, IObject, IPoint} from '../gInterface';
import {ILayerStyle} from './gInterface';
import Layer from './gLayer';
import {ELayerType} from './gEnum';
import {ECursorType, EEventType, EMapMode, EUrlCursorType, EXAxisDirection, EYAxisDirection} from '../gEnum';
import {EFeatureCircleSubtype, EFeatureType} from '../feature/gEnum';
import Util from '../gUtil';
import {ICircleShape, IFeatureShape, ILineShape, IPointShape, IPolygonShape, IPolylineShape, IRectShape} from '../feature/gInterface';
import Feature from '../feature/gFeature';
import CircleFeature from '../feature/gFeatureCircle';
import RectFeature from '../feature/gFeatureRect';
import {EMarkerType} from '../marker/gEnum';
import { ITextInfo } from '../text/gInterface';


export default class EventLayer extends Layer  {
    public eventDom: HTMLDivElement

    // 实时记录鼠标的位置
    public mouseMoveEvent: MouseEvent

    // mouseDown坐标{screen:IPoint: 相对容器左上角坐标, globalPoint}
    public startPoint: IBasePoint
    //  mouseDown坐标：相对页面左上角的坐标
    public startPageScreenPoint: IPoint

    // 标记是否处于dragging拖拽状态
    public dragging: boolean = false

    // mousemove过程中因为涉及到防抖逻辑，在setTimeOut需要判断是否会后续逻辑打断
    public breakFeatureCapture: boolean = false

    // 多边形绘制时临时保存points：IBasePoint[]
    public tmpPointsStore: IBasePoint[] = []

    // 绘制过程中视野自动平移
    public panWhenDrawingTimer: number | null | undefined

    // 绘制点的timer延迟，避免和dblClick事件冲突
    public downTimer: number | null | undefined

    // mousemove过程中进行防抖处理
    public mousemoveTimer: number | null | undefined

    // 当存在activeFeature时，鼠标move过程中捕捉到的feature
    public hoverFeature: Feature | null = null
    // 当存在activeFeature时，鼠标move过程中捕捉到的feature节点index
    // 0 0.5 1 1.5 ：存在x.5时，代表的是x & x+1 的中间节点
    public hoverFeatureIndex: number | undefined = undefined
    // 待更新的的feature-shape数据
    public toUpdateShape: IFeatureShape | null

    // function: constructor
    constructor(id: string, props: IObject = {}, style: ILayerStyle = {}) {
        super(id, ELayerType.Event, props, style);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onMouseDblClick = this.onMouseDblClick.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
    }

    onAdd(map: Map): void {
        super.onAdd(map);
        this.createEventDom();
        this.dom.appendChild(this.eventDom);

        // 事件绑定
        this.addEventListener();
    }

    // 创建mask层
    createEventDom() {
        this.eventDom = document.createElement('div');
        this.eventDom.style.position = 'absolute';
        this.eventDom.style.left = '0';
        this.eventDom.style.right = '0';
        this.eventDom.style.top = '0';
        this.eventDom.style.bottom = '0';
        this.eventDom.style.zIndex = '1';

        // 阻止拖拽默认事件
        this.eventDom.ondragstart = e => {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    // addEventListener: 初始化容器事件绑定
    public addEventListener() {
        this.eventDom.addEventListener("mousedown", this.onMouseDown);
        this.eventDom.addEventListener("mousemove", this.onMouseMove);
        this.eventDom.addEventListener("mouseup", this.onMouseUp);
        this.eventDom.addEventListener('click', this.onMouseClick);
        this.eventDom.addEventListener('dblclick', this.onMouseDblClick);
        this.eventDom.addEventListener("mousewheel", this.onMouseWheel);
        this.eventDom.addEventListener("mouseout", this.onMouseOut);
        this.eventDom.addEventListener("mouseover", this.onMouseOver);
    }

    // removeEventListener: 事件解除
    public removeEventListener() {
        this.eventDom.removeEventListener("mousedown", this.onMouseDown);
        this.eventDom.removeEventListener("mousemove", this.onMouseMove);
        this.eventDom.removeEventListener("mouseup", this.onMouseUp);
        this.eventDom.removeEventListener('click', this.onMouseClick);
        this.eventDom.removeEventListener('dblclick', this.onMouseDblClick);
        this.eventDom.removeEventListener("mousewheel", this.onMouseWheel);
        this.eventDom.removeEventListener("mouseout", this.onMouseOut);
        this.eventDom.removeEventListener("mouseover", this.onMouseOver);
    }

    /*************************************************/
    /*************** map 平移 *************************/
    /*************************************************/
    // map平移开始
    public handleMapPanStart(e: MouseEvent) {
        this.dragging = true; // 鼠标按下态
        this.map.setCursor(ECursorType.Grabbing);
        document.onmousemove = e => this.handleMapPanMove(e);
        document.onmouseup =  e => this.handleMapPanEnd(e);
    }
    // map平移中
    public handleMapPanMove(e: MouseEvent) {
        const {x: dltX, y: dltY} = this.getDltXY(e);
        this.map.onDrag(dltX, dltY);
    }
    // map平移结束
    public handleMapPanEnd(e: MouseEvent) {
        this.dragging = false; // 鼠标抬起
        this.map.setCursor(ECursorType.Grab);
        document.onmousemove = null;
        document.onmouseup = null;
        // 计算偏移量
        const {x: dltX, y: dltY} = this.getDltXY(e);
        const {x: screenCenterX, y: screenCenterY} = this.map.getScreenCenter();
        // 计算待更新的屏幕中心点坐标
        const newScreenCenterX = screenCenterX - dltX;
        const newScreenCenterY = screenCenterY - dltY;
        // 新的屏幕坐标转换为实际坐标值
        const newCenter = this.map.transformScreenToGlobal({x: newScreenCenterX, y: newScreenCenterY});
        // 将map中相关元素复位，然后进行刷新
        this.map.reset().setCenter(newCenter);
    }
    // 获取pageScreenPoint相对startPageScreenPoint偏移量
    public getDltXY(e: MouseEvent, option?: IObject): IPoint {
        const {transform = false} = option || {};
        const scale = this.map.getScale();

        const {screenX, screenY} = e;
        const {x, y} = this.startPageScreenPoint;
        const screenDltX = screenX - x;
        const screenDltY = screenY - y;
        const globalDltX = screenDltX / scale;
        const globalDltY = screenDltY / scale;

        return {
            x: transform ? globalDltX : screenDltX,
            y: transform ? globalDltY : screenDltY
        };
    }
    public clearDownTimer() {
        if (this.downTimer) {
            window.clearTimeout(this.downTimer);
            this.downTimer = null;
        }
    }

    /*****************************************************/
    /*************** map 注记绘制 *************************/
    /*****************************************************/
    handleMarkerStart(e: MouseEvent) {
        this.clearDownTimer();
        this.downTimer = window.setTimeout(() => {
            this.map.eventsObServer.emit(
                EEventType.DrawDone,
                this.map.mode,
                {
                    x: this.startPoint.global.x,
                    y: this.startPoint.global.y
                }
            );
        }, 300);
    }

    /*****************************************************/
    /*************** map 点 *************************/
    /*****************************************************/
    handlePointStart(e: MouseEvent) {
        this.clearDownTimer();
        this.downTimer = window.setTimeout(() => {
            this.map.eventsObServer.emit(
                EEventType.DrawDone,
                this.map.mode,
                {
                    x: this.startPoint.global.x,
                    y: this.startPoint.global.y
                }
            );
            this.reset(); // 重置
        }, 300);
    }

    /*****************************************************/
    /*************** map 矩形绘制 *************************/
    /*****************************************************/
    handleCircleStart(e: MouseEvent) {
        this.dragging = true; // 鼠标按下态
        document.onmousemove = e => this.handleCircleMove(e);
        document.onmouseup =  e => this.handleCircleEnd(e);

        const global = this.startPoint.global;
        this.setTip({text: '移动开始绘制', position: global});
    }
    handleCircleMove(e: MouseEvent) {
        const global = this.startPoint.global;
        const {x: preGlobalDltX, y: preGlobalDltY} = this.getDltXY(e, {transform: true});
        const {x: screenDltX, y: screenDltY} = this.getDltXY(e, {transform: false});
        const screenDlt = Math.sqrt(screenDltX * screenDltX + screenDltY * screenDltY);

        const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;
        const globalDltX = isXAxisRight ? preGlobalDltX : -preGlobalDltX;
        const globalDltY = isYAxisTop ? preGlobalDltY : -preGlobalDltY;

        const moveGlobal = {x: global.x + globalDltX, y: global.y - globalDltY};

        const circleShape = {cx: global.x, cy: global.y, sr: screenDlt};
        this.map.overlayLayer.addCircleFeature(circleShape);
        this.setTip({text: '抬起完成绘制', position: moveGlobal});
    }
    handleCircleEnd(e: MouseEvent) {
        this.dragging = false; // 鼠标抬起
        document.onmousemove = null;
        document.onmouseup = null;

        const {x: centerX, y: centerY} = this.startPoint.global;
        const {x: globalDltX, y: globalDltY} = this.getDltXY(e, {transform: true});
        const {x: screenDltX, y: screenDltY} = this.getDltXY(e, {transform: false});
        const globalDlt = Math.sqrt(globalDltX * globalDltX + globalDltY * globalDltY);
        const screenDlt = Math.sqrt(screenDltX * screenDltX + screenDltY * screenDltY);

        this.reset(); // 重置临时数据

        // rect矩形有效性判读是否合适
        if (Math.abs(screenDlt) <= 2) {
            console.warn('the circle is too small...');
            return;
        }

        // 组织矩形数据shape格式
        const circleGlobalShape = {cx: centerX, cy: centerY, r: globalDlt};
        const circleScreenShape = {cx: centerX, cy: centerY, sr: screenDlt};

        // 绘制矩形完成之后触发告知用户层
        this.map.eventsObServer.emit(EEventType.DrawDone, this.map.mode, circleGlobalShape, circleScreenShape);
    }

    /*****************************************************/
    /*************** map 线段 *************************/
    /*****************************************************/
    handleLineStart(e: MouseEvent) {
        // 说明绘制线段第一个点
        if (this.tmpPointsStore.length === 0) {
            this.clearDownTimer();
            this.downTimer = window.setTimeout(() => {
                this.tmpPointsStore.push(this.startPoint);
                this.setTip({text: '移动开始绘制', position: this.startPoint.global});
            }, 300);
        }
        else if (this.tmpPointsStore.length === 1) {
            const {global: startGlobal} = this.tmpPointsStore[0];
            const {global: endGlobal} = this.startPoint;
            // 绘制矩形完成之后触发告知用户层
            this.map.eventsObServer.emit(
                EEventType.DrawDone,
                this.map.mode,
                {
                    start: startGlobal,
                    end: endGlobal
                }
            );
            this.reset();
        }
    }
    handleLineMove(e: MouseEvent) {
        const {offsetX, offsetY} = e;
        const screen = {x: offsetX, y: offsetY};
        const global = this.map.transformScreenToGlobal(screen);

        const pointsLength = this.tmpPointsStore.length;
        if (pointsLength === 0) {
            this.setTip({text: '单击确定起点', position: global});
        }
        else if (pointsLength === 1) {
            const start = this.tmpPointsStore[0].global;
            const end = this.map.transformScreenToGlobal({x: offsetX, y: offsetY});
            this.map.overlayLayer.addLineFeature({start, end});
            this.setTip({text: '单击确定终点', position: global});
        }
    }


    /*****************************************************/
    /***************** map 多段线 *************************/
    /*****************************************************/
    handlePolylineStart(e: MouseEvent) {
        if (this.tmpPointsStore.length === 0) {
            this.clearDownTimer();
            this.downTimer = window.setTimeout(() => {
                this.tmpPointsStore.push(this.startPoint);
                this.setTip({text: '移动开始绘制', position: this.startPoint.global});
            }, 300);
        }
        else {
            this.tmpPointsStore.push(this.startPoint);

            if (this.map.withHotKeys) {
                this.setTip({text: 'ctrl+z撤销', position: this.startPoint.global});
            }
        }
    }
    handlePolylineMove(e: MouseEvent) {
        const {offsetX, offsetY} = e;
        const moveGlobalPoint = this.map.transformScreenToGlobal({x: offsetX, y: offsetY});

        const drawingGlobalPoints = _map(this.tmpPointsStore, ({global}) => global);
        drawingGlobalPoints.push(moveGlobalPoint);

        if (drawingGlobalPoints.length === 1) {
            // 说明刚开始绘制
            this.setTip({text: '单击确定起点', position: moveGlobalPoint});
        }
        else if (drawingGlobalPoints.length > 1) {
            this.map.overlayLayer.addPolylineFeature({points: drawingGlobalPoints});
            this.setTip({text: '单击绘制/双击结束', position: moveGlobalPoint});
        }
    }
    handlePolylineEnd(e: MouseEvent) {
        this.tmpPointsStore.pop(); // 移除两次handlePolylineStart事件执行多的一个点
        if (this.tmpPointsStore.length >= 2) {
            this.map.eventsObServer.emit(
                EEventType.DrawDone,
                this.map.mode,
                _map(this.tmpPointsStore, ({global}) => global)
            );
        }
        this.reset();
    }


    /*****************************************************/
    /*************** map 矩形绘制 *************************/
    /*****************************************************/
    handleRectStart(e: MouseEvent) {
        this.dragging = true; // 鼠标按下态
        document.onmousemove = e => this.handleRectMove(e);
        document.onmouseup =  e => this.handleRectEnd(e);

        const global = this.startPoint.global;
        this.setTip({text: '移动开始绘制', position: global});
    }
    handleRectMove(e: MouseEvent) {
        const {x, y} = this.startPoint.global;
        const {x: width, y: height} = this.getDltXY(e, {transform: true});

        const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;

        const ltx = isXAxisRight ? Math.min(x, x + width) : Math.max(x, x - width);
        const lty = isYAxisTop ? Math.max(y, y - height) : Math.min(y, y + height);

        const moveGlobal = {
            x:  isXAxisRight ? (x + width) : (x - width),
            y: isYAxisTop ? (y - height) : (y + height)
        };

        const rectShape = {x: ltx, y: lty, width: Math.abs(width), height: Math.abs(height)};
        this.map.overlayLayer.addRectFeature(rectShape);

        this.setTip({text: '抬起完成绘制', position: moveGlobal});
    }
    handleRectEnd(e: MouseEvent) {
        this.dragging = false; // 鼠标抬起
        document.onmousemove = null;
        document.onmouseup = null;
        const scale = this.map.getScale();
        const {x: startScreeX, y: startScreeY} = this.startPoint.screen;
        const {x: screenDltX, y: screenDltY} = this.getDltXY(e);
        const width = Math.abs(screenDltX) / scale;
        const height = Math.abs(screenDltY) / scale;
        const pointRBX = startScreeX + screenDltX;
        const pointRBY = startScreeY + screenDltY;

        const pointLTX = Math.min(pointRBX, startScreeX);
        const pointLTY = Math.min(pointRBY, startScreeY);

        const globalLTPoint = this.map.transformScreenToGlobal({x: pointLTX, y: pointLTY});

        this.reset(); // 重置临时数据

        // rect矩形有效性判读是否合适
        if (Math.abs(screenDltX) <= 3 || Math.abs(screenDltY) <= 3) {
            console.warn('the rect is too small...');
            return;
        }

        // 组织矩形数据shape格式
        const rectShape = {
            x: globalLTPoint.x, y: globalLTPoint.y,
            width, height
        };
        // 绘制矩形完成之后触发告知用户层
        this.map.eventsObServer.emit(EEventType.DrawDone, this.map.mode, rectShape);
    }

    /*****************************************************/
    /*************** map 矩形多边形 ************************/
    /*****************************************************/
    handlePolygonStart(e: MouseEvent) {
        if (this.tmpPointsStore.length === 0) {
            this.clearDownTimer();
            this.downTimer = window.setTimeout(() => {
                this.tmpPointsStore.push(this.startPoint);
                this.setTip({text: '移动开始绘制', position: this.startPoint.global});
            }, 300);
        }
        else {
            this.tmpPointsStore.push(this.startPoint);

            if (this.map.withHotKeys) {
                this.setTip({text: 'ctrl+z撤销', position: this.startPoint.global});
            }
        }
    }
    handlePolygonMove(e: MouseEvent) {
        const {offsetX, offsetY} = e;
        const moveGlobalPoint = this.map.transformScreenToGlobal({x: offsetX, y: offsetY});

        const drawingGlobalPoints = _map(this.tmpPointsStore, ({global}) => global);
        drawingGlobalPoints.push(moveGlobalPoint);

        const drawingPointsCount = drawingGlobalPoints.length;
        if (drawingPointsCount === 1) {
            // 说明刚开始绘制
            this.setTip({text: '单击确定起点', position: moveGlobalPoint});
        }
        else if (drawingPointsCount > 1) {
            this.map.overlayLayer.addPolygonFeature({points: drawingGlobalPoints}, {node: true});

            const tipText = drawingPointsCount === 2 ? '单击绘制' : '单击绘制/双击结束';
            this.setTip({text: tipText, position: moveGlobalPoint});
        }
    }
    handlePolygonEnd(e: MouseEvent) {
        this.tmpPointsStore.pop(); // 移除两次handlePolygonStart事件执行多的一个点
        if (this.tmpPointsStore.length >= 3) {
            // 绘制矩形完成之后触发告知用户层
            const points = _map(this.tmpPointsStore, ({global}) => global);
            this.map.eventsObServer.emit(
                EEventType.DrawDone,
                this.map.mode,
                points
            );
        }
        this.reset();
    }

    /*****************************************************/
    /**********+****** map 涂抹 ***************************/
    /*****************************************************/
    handleMaskStart(e: MouseEvent) {
        this.dragging = true; // 鼠标按下态
        document.onmousemove = e => this.handleMaskMove(e);
        document.onmouseup = e => this.handleMaskEnd(e);
        this.tmpPointsStore.push(this.startPoint);
        const points = _map(this.tmpPointsStore, ({global}) => global);
        // 模式变化
        switch (this.map.mode) {
            case EMapMode.DrawMask: {
                this.map.overlayLayer.addDrawAction({points});
                break;
            }
            case EMapMode.ClearMask: {
                this.handleMaskClearMoving({points});
                break;
            }
            default:
                break;
        }
    }
    handleMaskMove(e: MouseEvent) {
        const {x: startScreeX, y: startScreeY} = this.startPoint.screen;
        const {x: dltX, y: dltY} = this.getDltXY(e);
        const middleScreenPoint = {x: startScreeX + dltX, y: startScreeY + dltY};
        const middleGlobalPoint = this.map.transformScreenToGlobal(middleScreenPoint);

        // 数据筛选过滤无效路径节点
        const lastPoint = _last(this.tmpPointsStore);
        if (lastPoint) {
            const lastScreenPoint = lastPoint.screen;
            const distance = Util.MathUtil.distance(lastScreenPoint, middleScreenPoint);
            if (distance <= 3) {
                return;
            }
        }

        // 对有效路径节点添加
        this.tmpPointsStore.push({screen: middleScreenPoint, global: middleGlobalPoint});
        const points = _map(this.tmpPointsStore, ({global}) => global);

        // 模式变化
        switch (this.map.mode) {
            case EMapMode.DrawMask: {
                // 在临时层上绘制涂抹
                this.map.overlayLayer.addDrawAction({points});
                break;
            }
            case EMapMode.ClearMask: {
                // 在涂抹层上进行删除
                this.handleMaskClearMoving({points});
                break;
            }
            default:
                break;
        }
    }
    handleMaskEnd(e: MouseEvent) {
        this.dragging = false; // 鼠标抬起
        document.onmousemove = null;
        document.onmouseup = null;

        const maskPoints = _map(this.tmpPointsStore, ({global}) => global);
        this.map.eventsObServer.emit(
            EEventType.DrawDone,
            this.map.mode, // drawMask | clearMask
            maskPoints
        );
        this.reset();
        this.handleMaskClearMoving({reset: true});
    }
    handleMaskClearMoving({points = [], reset = false}) {
        const mapLayers = this.map.getLayers();
        const drawingStyle = this.map.drawingStyle;
        const {lineWidth = 10} = drawingStyle;
        const scale = this.map.getScale();
        const clearWidth = lineWidth / scale;

        _forEach(mapLayers, layer => {
            // 需要进行擦除动作
            if (layer.type === ELayerType.Mask && !reset) {
                const clearAction = new ClearAction(
                    `${+new Date()}`, // id
                    {points, width: clearWidth}, // shape
                    {},
                    drawingStyle
                );
                layer.setMovingClearAction(clearAction);
            }
            else if (layer.type === ELayerType.Mask && reset) {
                layer.setMovingClearAction(null);
            }
        });
    }


    /*****************************************************/
    /************** map 鼠标滑轮缩放 ***********************/
    /*****************************************************/
    // mouse在map:pan模式下进行滑轮缩放[不断重绘图层方式，性能会受影响]
    public handleMapZoom(e: WheelEvent) {
        const zoomNumber = 90 + this.map.zoomWheelRatio;

        const {offsetX, offsetY} = e;
        const screen = {x: offsetX, y: offsetY};
        const global = this.map.transformScreenToGlobal(screen);
        const basePoint = {screen, global};
        // 计算缩放中心点
        const newZoom = e.deltaY < 0
            ? this.map.zoom * zoomNumber / 100 // zoomIn
            : this.map.zoom * 100 / zoomNumber; // 为了返回上一次的zoom
        const screenCenter = this.map.getScreenCenter();
        const newCenter = this.map.transformScreenToGlobal(screenCenter, {basePoint, zoom: newZoom});
        this.map.centerAndZoom({center: newCenter, zoom: newZoom}, {refreshDelay: true});
    }


    // // 尝试改变dom容器的scale(但是会对一些sr的圆造成放大缩小展示问题)
    // mouseWheelTimer: number | null | undefined
    // zoomScale: number = 1
    // public handleMapZoom_abort(e: WheelEvent) {
    //     if (this.mouseWheelTimer) {
    //         window.clearTimeout(this.mouseWheelTimer);
    //         this.mouseWheelTimer = null;
    //     }

    //     this.zoomScale = e.deltaY >= 0
    //         ? this.zoomScale * 95 / 100 // zoomIn
    //         : this.zoomScale * 105.263 / 100; // 为了返回上一次的zoom
    //     this.map.onZoom(this.zoomScale);

    //     this.mouseWheelTimer = window.setTimeout(() => {
    //         const newZoom = this.map.zoom / this.zoomScale;
    //         this.zoomScale = 1;
    //         this.map.reset();
    //         this.map.zoomTo(newZoom);
    //     }, 300);
    // }

    /*****************************************************/
    /************** map 双击编辑 ***********************/
    /*****************************************************/
    public handleFeatureSelect(e: MouseEvent) {
        const targetFeature = this.map.getTargetFeatureWithPoint(this.startPoint.global);
        // 如果捕捉到，则触发事件回调
        targetFeature && this.map.eventsObServer.emit(
            EEventType.FeatureSelected,
            targetFeature
        );
    }
    /*****************************************************/
    /*******+**** map 鼠标捕捉activeFeature ***************/
    /*****************************************************/
    handleActiveFeatureCapture(e: MouseEvent) {
        const {offsetX, offsetY} = e;
        const currentPoint = {x: offsetX, y: offsetY};
        const currentGlobalPoint = this.map.transformScreenToGlobal(currentPoint);
        const activeFeature = this.map.activeFeature;
        const {type, shape} = activeFeature || {};

        // 重置捕捉的feature及featureIndex
        this.hoverFeature = null;
        this.hoverFeatureIndex = undefined;

        switch (type) {
            case EFeatureType.Point: {
                if (activeFeature.captureWithPoint(currentGlobalPoint)) {
                    this.hoverFeature = activeFeature;
                    this.map.setCursor(ECursorType.Pointer);

                    this.map.eventLayer.breakFeatureCapture = true;
                    this.setTip({text: '按下移动图形/右键删除', position: currentGlobalPoint});
                }
                break;
            }
            case EFeatureType.Rect:
            case EFeatureType.Circle: {
                const isRectType = type === EFeatureType.Rect;
                // 计算获取点集合
                const points = isRectType ? (activeFeature as RectFeature).getPoints() : (activeFeature as CircleFeature).getEdgePoints();

                // 首先进行捕捉点判断
                _forEach(points, (point: IPoint, index: number) => {
                    // 首先判断当前点
                    const sPoint = this.map.transformGlobalToScreen(point);
                    const distance = Util.MathUtil.distance(sPoint, currentPoint);
                    if (distance <= 5) {
                        this.hoverFeatureIndex = index;
                        const cursor = (index === 1 || index === 3) ? ECursorType.NESW_Resize : ECursorType.NWSE_Resize;
                        this.map.setCursor(cursor);

                        this.map.eventLayer.breakFeatureCapture = true;
                        this.setTip({text: '按下拖动', position: currentGlobalPoint});
                        return false;
                    }
                });
                // 如果没有捕捉到点，此时需要判断是否捕捉到图形
                if (!_isNumber(this.hoverFeatureIndex) && activeFeature.captureWithPoint(currentGlobalPoint)) {
                    this.hoverFeature = activeFeature;
                    this.map.setCursor(ECursorType.Move);

                    this.map.eventLayer.breakFeatureCapture = true;
                    this.setTip({text: '按下移动图形', position: currentGlobalPoint});
                }
                break;
            }
            case EFeatureType.Line:
            case EFeatureType.Polyline:
            case EFeatureType.Polygon: {
                const isLine = type === EFeatureType.Line;
                const isPolyline = type === EFeatureType.Polyline;
                const isPolygon = type === EFeatureType.Polygon;

                const {start: lineStartPoint, end: lineEndPoint} = shape as ILineShape;
                const {points: multiPoints = []} = shape as (IPolygonShape | IPolylineShape);

                const points = isLine ? [lineStartPoint, lineEndPoint] : multiPoints;
                const pointsLength = points.length;

                // 首先进行捕捉点判断
                _forEach(points, (point: IPoint, index: number) => {
                    // 首先判断当前点
                    const sPoint = this.map.transformGlobalToScreen(point);
                    const distance = Util.MathUtil.distance(sPoint, currentPoint);
                    if (distance <= 5) {
                        this.hoverFeatureIndex = index;
                        this.map.setCursor(ECursorType.Pointer);
                        const minPointsCount = (isLine || isPolyline) ? 2 : 3;
                        const deleteTip = pointsLength > minPointsCount ? '/右键删除' : '';

                        this.map.eventLayer.breakFeatureCapture = true;
                        this.setTip({text: `按下拖动${deleteTip}`, position: currentGlobalPoint});
                        return false;
                    }

                    // 如果是线段，不需要判断中间节点，直接判断下一节点
                    if (isLine) {
                        return;
                    }
                    // 如果是多段线且最后一个节点
                    if (isPolyline && !points[index + 1]) {
                        return false;
                    }
                    // 其次判断当前点与下一点之间的中心点
                    const nextPoint = points[index + 1] || points[0];
                    const middlePoint = Util.MathUtil.getMiddlePoint(point, nextPoint);
                    const sMiddlePoint = this.map.transformGlobalToScreen(middlePoint);
                    const distance2 = Util.MathUtil.distance(sMiddlePoint, currentPoint);
                    if (distance2 <= 5) {
                        this.hoverFeatureIndex = index + 0.5;
                        this.map.setCursor(ECursorType.Pointer);

                        this.map.eventLayer.breakFeatureCapture = true;
                        this.setTip({text: '按下拖动添加新节点', position: currentGlobalPoint});
                        return false;
                    }
                });
                // 如果没有捕捉到点，此时需要判断是否捕捉到图形
                if (!_isNumber(this.hoverFeatureIndex) && activeFeature.captureWithPoint(currentGlobalPoint)) {
                    this.hoverFeature = activeFeature;
                    this.map.setCursor(ECursorType.Move);

                    this.map.eventLayer.breakFeatureCapture = true;
                    this.setTip({text: '按下移动图形', position: currentGlobalPoint});
                }
                break;
            }
            default:
                break;
        }
    }
    /*****************************************************/
    /*******+**** map 捕捉到的feature鼠标按下 ***************/
    /*****************************************************/
    handleActiveFeatureStart(e: MouseEvent) {
        // 鼠标按下时清空tipLayer
        this.map.tipLayer.removeAllFeatureActionText();
        // 鼠标相关变量
        const btnIndex = Util.EventUtil.getButtonIndex(e);

        // 鼠标左键按下
        if (btnIndex === 0) {
            this.dragging = true; // 鼠标按下态
            document.onmousemove = e => this.handleActiveFeatureMove(e);
            document.onmouseup = e => this.handleActiveFeatureEnd(e);
        }
        // 鼠标右键按下
        else if (btnIndex === 2) {
            this.handleActiveFeatureElse(e);
        }
    }
    handleActiveFeatureMove(e: MouseEvent) {
        const {x: preGlobalDltX, y: preGlobalDltY} = this.getDltXY(e, {transform: true});
        const {x: preScreenDltX, y: preScreenDltY} = this.getDltXY(e, {transform: false});
        const activeFeature = this.map.activeFeature;
        const {type, shape, style} = activeFeature;

        const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;
        const globalDltX = isXAxisRight ? preGlobalDltX : -preGlobalDltX;
        const globalDltY = isYAxisTop ? preGlobalDltY : -preGlobalDltY;
        const screenDltX = isXAxisRight ? preScreenDltX : -preScreenDltX;

        switch (type) {
            case EFeatureType.Point: {
                const {x, y} = shape as IPointShape;
                this.toUpdateShape = {...shape, x: x + globalDltX, y: y - globalDltY};
                // 临时层执行绘制
                this.map.overlayLayer.addActiveFeature(activeFeature);
                this.map.overlayLayer.addPointFeature(
                    this.toUpdateShape,
                    {clear: false, style: {...style, fillStyle: this.map?.editingColor}}
                );
                break;
            }
            case EFeatureType.Circle: {
                const {cx, cy, r, sr} = shape as ICircleShape;
                if (this.hoverFeature) {
                    this.toUpdateShape = {
                        ...shape,
                        cx: cx + globalDltX,
                        cy: cy - globalDltY
                    };
                }
                else if (_isNumber(this.hoverFeatureIndex)) {
                    const isLeft = this.hoverFeatureIndex === 0 || this.hoverFeatureIndex === 3;
                    const isRight = this.hoverFeatureIndex === 1 || this.hoverFeatureIndex === 2;

                    const circleSubtype = (activeFeature as CircleFeature).getSubType();
                    const isGlobalType = circleSubtype === EFeatureCircleSubtype.Global;

                    const newRadius = isGlobalType
                        ? (isRight ? (r + globalDltX) : (r - globalDltX))
                        : (isRight ? (sr + screenDltX) : (sr - screenDltX));

                    // 如果半径小于0不做任何处理å
                    if (newRadius <= 0) {
                        console.warn('circle update error: invalid radius, radius <= 0');
                        return;
                    }
                    this.toUpdateShape = {
                        ...shape,
                        ...(isGlobalType ? {r: newRadius} : {sr: newRadius})
                    };
                }
                this.map.overlayLayer.addActiveFeature(activeFeature);
                this.map.overlayLayer.addCircleFeature(
                    this.toUpdateShape as ICircleShape,
                    {clear: false, style: {...style, lineWidth: 1, strokeStyle: this.map?.editingColor}}
                );
                break;
            }
            case EFeatureType.Rect: {
                const {x, y, width, height} = shape as IRectShape;
                // 说明捕捉到了feature元素
                let newRectShape = null;
                if (this.hoverFeature) {
                    newRectShape = {x: x + globalDltX, y: y - globalDltY, width, height};
                }
                // 说明捕捉到了feature节点
                else if (_isNumber(this.hoverFeatureIndex)) {
                    // newRectShape = {x: x + globalDltX, y: y - globalDltY, width, height};
                    const isLeft = this.hoverFeatureIndex === 0 || this.hoverFeatureIndex === 3;
                    const isTop = this.hoverFeatureIndex === 0 || this.hoverFeatureIndex === 1;
                    const preNewX = isLeft ? (x + globalDltX) : x;
                    const preNewY = isTop ?  (y - globalDltY) : y;
                    const preNewWidth = isLeft ? (width - preGlobalDltX) : (width + preGlobalDltX);
                    const preNewHeight = isTop ? (height - preGlobalDltY) : (height + preGlobalDltY);

                    const RBX = isXAxisRight ? (preNewX + preNewWidth) : (preNewX - preNewWidth);
                    const RBY = isYAxisTop ? (preNewY - preNewHeight) : (preNewY + preNewHeight);

                    const newX = isXAxisRight
                        ? Math.min(preNewX, RBX)
                        : Math.max(preNewX, RBX);
                    const newY = isYAxisTop
                        ? Math.max(preNewY, RBY)
                        : Math.min(preNewY, RBY);
                    const newWidth = Math.abs(preNewWidth);
                    const newHeight = Math.abs(preNewHeight);

                    newRectShape = {x: newX, y: newY, width: newWidth, height: newHeight};
                }
                // 保存
                this.toUpdateShape = {...shape, ...newRectShape};
                // 临时层执行绘制
                this.map.overlayLayer.addActiveFeature(activeFeature);
                this.map.overlayLayer.addRectFeature(
                    this.toUpdateShape as IRectShape,
                    {clear: false, style: {...style, lineWidth: 1, strokeStyle: this.map?.editingColor}}
                );
                break;
            }
            case EFeatureType.Line:
            case EFeatureType.Polyline:
            case EFeatureType.Polygon: {
                const isLine = type === EFeatureType.Line;
                const isPolyline = type === EFeatureType.Polyline;
                const isPolygon = type === EFeatureType.Polygon;

                const {start: lineStartPoint, end: lineEndPoint} = shape as ILineShape;
                const {points: multiPoints = []} = shape as (IPolygonShape | IPolylineShape);

                const points = isLine ? [lineStartPoint, lineEndPoint] : multiPoints;

                // 说明捕捉到了feature元素
                let newPoints = [];
                if (this.hoverFeature) {
                    newPoints = _map(points, ({x, y}) => ({x: x + globalDltX, y: y - globalDltY}));
                }
                // 说明捕捉到了feature节点
                else if (_isNumber(this.hoverFeatureIndex)) {
                    const intIndex = parseInt(`${this.hoverFeatureIndex}`, 10);
                    _forEach(points, ({x, y}, index: number) => {
                        // 说明是真实节点
                        if (index === intIndex &&  intIndex === this.hoverFeatureIndex) {
                            newPoints.push({x: x + globalDltX, y: y - globalDltY});
                        }
                        // 说明是中间节点
                        else if (index === intIndex &&  intIndex !== this.hoverFeatureIndex) {
                            // 其次判断当前点与下一点之间的中心点
                            const nextPoint = points[index + 1] || points[0];
                            const middlePoint = Util.MathUtil.getMiddlePoint({x, y}, nextPoint);
                            newPoints.push({x, y});
                            newPoints.push({x: middlePoint.x + globalDltX, y: middlePoint.y - globalDltY});
                        }
                        // 说明其他节点
                        else {
                            newPoints.push({x, y});
                        }
                    });
                }

                // 保存
                if (isLine) {
                    const [start, end] = newPoints;
                    this.toUpdateShape = {...shape, start, end};
                }
                else {
                    this.toUpdateShape = {...shape, points: newPoints};
                }

                // 临时层执行绘制
                this.map.overlayLayer.addActiveFeature(activeFeature);
                // 线段绘制
                isLine && this.map.overlayLayer.addLineFeature(
                    this.toUpdateShape as ILineShape,
                    {clear: false, style: {...style, strokeStyle: this.map?.editingColor}}
                );
                // 多段线绘制
                isPolyline && this.map.overlayLayer.addPolylineFeature(
                    this.toUpdateShape as IPolylineShape,
                    {clear: false, style: {...style, strokeStyle: this.map?.editingColor}}
                );
                // 多边形绘制
                isPolygon && this.map.overlayLayer.addPolygonFeature(
                    this.toUpdateShape as IPolygonShape,
                    {clear: false, style: {...style, lineWidth: 1, strokeStyle: this.map?.editingColor}}
                );
                break;
            }
        }
    }
    handleActiveFeatureEnd(e: MouseEvent) {
        this.dragging = false; // 鼠标抬起
        document.onmousemove = null;
        document.onmouseup = null;

        this.map.overlayLayer.removeAllFeatureActionText();
        const activeFeature = this.map.activeFeature;
        // 首先需要恢复选中要素的选中态
        activeFeature && this.map.overlayLayer.addActiveFeature(activeFeature);
        // 如果存在更新数据
        if (this.toUpdateShape && activeFeature) {
            // 然后进行事件回调处理事件
            const {type} = activeFeature;
            switch (type) {
                case EFeatureType.Point:
                case EFeatureType.Circle:
                case EFeatureType.Line:
                case EFeatureType.Polyline:
                case EFeatureType.Rect:
                case EFeatureType.Polygon: {
                    this.map.eventsObServer.emit(
                        EEventType.FeatureUpdated,
                        activeFeature,
                        this.toUpdateShape
                    );
                    break;
                }
            }

            // 重置还原
            this.toUpdateShape = null;
        }
    }
    // 鼠标右键事件处理
    handleActiveFeatureElse(e: MouseEvent) {
        const activeFeature = this.map.activeFeature;
        // 如果存在更新数据
        if (activeFeature) {
            const {type, shape} = activeFeature;
            switch (type) {
                case EFeatureType.Point: {
                    this.map.eventsObServer.emit(
                        EEventType.FeatureDeleted,
                        activeFeature
                    );
                    break;
                }
                case EFeatureType.Polyline:
                case EFeatureType.Polygon: {
                    const isPolyline = type === EFeatureType.Polyline;
                    const isPolygon = type === EFeatureType.Polygon;
                    const minPointsCount = isPolyline ? 2 : 3;

                    const {points = []} = shape as (IPolygonShape | IPolylineShape);

                    // 如果捕捉到节点 && 当前点的个数大于minPointsCount个点【有可供删除的节点】
                    if (_isNumber(this.hoverFeatureIndex) && points.length > minPointsCount) {
                        const intIndex = parseInt(`${this.hoverFeatureIndex}`, 10);
                        // 说明此时需要删除右键单击的真实节点
                        if (intIndex === this.hoverFeatureIndex) {
                            const newPoints = _filter(points, (__: IPoint, index: number) => index !== intIndex);

                            // 修正后的shape数据返回
                            const toUpdateShape = {...shape, points: newPoints};

                            this.map.eventsObServer.emit(
                                EEventType.FeatureUpdated,
                                activeFeature,
                                toUpdateShape
                            );
                        }
                    }
                    break;
                }
            }
        }
    }

    /*****************************************************/
    /********* mousemove过程中进行捕捉feature判断[临时方案，耗性能] ***********/
    /*****************************************************/
    handleFeatureCapture(point: IPoint, option: IObject = {}) {
        const {extraTip = ''} = option;
        const drawing = this.dragging || this.tmpPointsStore.length;

        // 首先判断用户是否开启捕捉
        if (!this.map.featureCaptureWhenMove || drawing) {
            return;
        }

        // 进行捕捉判断
        const targetFeature = this.map.getTargetFeatureWithPoint(point);
        // 如果捕捉到，则触发事件回调
        targetFeature && this.setTip({
            text: (extraTip ? extraTip + '/' : '') + '双击选中',
            position: point
        });

        // // 清楚timeout-timer
        // this.clearMousemoveTimer();
        // // 重置breakFeatureCapture为非打断状态
        // this.breakFeatureCapture = false;
        // this.mousemoveTimer = window.setTimeout(() => {
        //     // 如果已被后续逻辑重置打断，则直接返回
        //     if (this.breakFeatureCapture) {
        //         return;
        //     }
        //     // 进行捕捉判断
        //     const targetFeature = this.map.getTargetFeatureWithPoint(point);
        //     // 如果捕捉到，则触发事件回调
        //     targetFeature && this.setTip({
        //         text: (extraTip ? extraTip + '/' : '') + '双击选中',
        //         position: point
        //     });
        // }, 200);
    }
    // 清除mousemove过程捕捉feature的防抖timer
    clearMousemoveTimer() {
        if (this.mousemoveTimer) {
            window.clearTimeout(this.mousemoveTimer);
            this.mousemoveTimer = null;
        }
    }

    // 获取mouse事件point
    getMouseEventPoint(e: MouseEvent): IBasePoint {
        // 相关坐标值处理
        const {offsetX, offsetY} = e;
        // 记录起始坐标
        const screen = {x: offsetX, y: offsetY};
        const global = this.map.transformScreenToGlobal(screen);
        return {screen, global};
    }

    /*****************************************************/
    /**************** map 事件绑定 ************************/
    /*****************************************************/
    // onMouseDown: 事件绑定
    public onMouseDown(e: MouseEvent) {
        // 相关坐标值处理
        const {screenX, screenY} = e;
        // 设置保存起始坐标
        this.startPoint = this.getMouseEventPoint(e);
        this.startPageScreenPoint = {x: screenX, y: screenY};

        const mapMode = this.map.mode;
        const dragging = this.dragging;
        const isCapturedFeature = this.hoverFeature || _isNumber(this.hoverFeatureIndex);
        const drawing = !dragging && !isCapturedFeature;

        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.MouseDown,
            this.startPoint
        );

        // 首先判断是否是取消选中
        if (this.map.activeFeature && !isCapturedFeature) {
            this.map.eventsObServer.emit(EEventType.FeatureUnselected, this.map.activeFeature, 'cancel by click');
            return;
        }

        if (mapMode === EMapMode.Ban) {
            // 禁用任何逻辑判断
            return;
        }
        else if (mapMode === EMapMode.Pan && drawing) {
            this.handleMapPanStart(e);
        }
        else if (mapMode === EMapMode.MARKER && drawing) {
            this.handleMarkerStart(e);
        }
        else if (mapMode === EMapMode.Point && drawing) {
            this.handlePointStart(e);
        }
        else if (mapMode === EMapMode.Circle && drawing) {
            this.handleCircleStart(e);
        }
        else if (mapMode === EMapMode.Line && drawing) {
            this.handleLineStart(e);
        }
        else if (mapMode === EMapMode.Polyline && drawing) {
            this.handlePolylineStart(e);
        }
        else if (mapMode === EMapMode.Rect && drawing) {
            this.handleRectStart(e);
        }
        else if (mapMode === EMapMode.Polygon && drawing) {
            this.handlePolygonStart(e);
        }
        else if ((mapMode === EMapMode.DrawMask || mapMode === EMapMode.ClearMask) && drawing) {
            // 绘制｜清除涂抹
            this.handleMaskStart(e);
        }

        // 如果存在捕捉到feature或者featureIndex
        if (isCapturedFeature && !dragging) {
            this.handleActiveFeatureStart(e);
        }
    }

    // onMouseMove: 事件绑定
    public onMouseMove(e: MouseEvent) {
        // 实时记录mouseMoveEvent事件对象
        this.mouseMoveEvent = e;

        // 获取move坐标
        const {screen, global} = this.getMouseEventPoint(e);

        // 后续对应模式处理
        const mapMode = this.map.mode;
        const dragging = this.dragging;

        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.MouseMove,
            {screen, global}
        );

        if (!this.map.activeFeature && !dragging) {
            // 首先清空临时层
            this.map.overlayLayer.removeAllFeatureActionText();
        }

        if (mapMode === EMapMode.Ban) {
            // 禁用任何逻辑判断
            return;
        }
        else if (mapMode === EMapMode.Pan && !dragging) {
            this.map.setCursor(ECursorType.Grab);
        }
        else if (mapMode === EMapMode.MARKER && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
        }
        else if (mapMode === EMapMode.Point && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.setTip({text: '点击绘制点', position: global});
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.Circle && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.setTip({text: '按下确定圆心', position: global});
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.Line && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.handleLineMove(e);
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.Polyline && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.handlePolylineMove(e);
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.Rect && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.setTip({text: '按下确定起点', position: global});
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.Polygon && !dragging) {
            this.map.setCursor(ECursorType.Crosshair);
            this.handlePolygonMove(e);
            this.handleFeatureCapture(global);
        }
        else if (mapMode === EMapMode.DrawMask) {
            const lineWidth = _get(this.map.drawingStyle, 'lineWidth', 1);
            this.map.setCursor(
                EUrlCursorType.DrawMask,
                {
                    type: EFeatureType.Circle,
                    shape: {sr: lineWidth / 2, cx: global.x, cy: global.y}
                }
            );
        }
        else if (mapMode === EMapMode.ClearMask) {
            const lineWidth = _get(this.map.drawingStyle, 'lineWidth', 1);
            this.map.setCursor(
                EUrlCursorType.ClearMask,
                {
                    type: EFeatureType.Circle,
                    shape: {sr: lineWidth / 2, cx: global.x, cy: global.y}
                }
            );
        }

        // 首先判断是否是取消选中
        if (this.map.activeFeature && !dragging) {
            this.setTip({text: '单击取消选中', position: global});
        }

        // 编辑态，平移捕捉
        if (_includes([
            EMapMode.Point,
            EMapMode.Circle,
            EMapMode.Line,
            EMapMode.Polyline,
            EMapMode.Rect,
            EMapMode.Polygon
        ], mapMode) && !dragging) {
            // 如果存在activeFeature, 此时需要进行捕捉
            this.handleActiveFeatureCapture(e);
        }
    }

    // onMouseUp: 事件绑定
    public onMouseUp(e: MouseEvent) {
        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.MouseUp,
            this.getMouseEventPoint(e)
        );
    }

    // 单击事件
    public onMouseClick(e: MouseEvent) {
       // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.Click,
            this.getMouseEventPoint(e)
        );
    }

    // onMouseDblClick: 事件绑定-双击事件
    public onMouseDblClick(e: MouseEvent) {
        // 判断是否在绘制或者编辑拖拽过程中
        const mapMode = this.map.mode;
        this.clearDownTimer();
        const drawing = this.dragging || this.tmpPointsStore.length;

        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.DblClick,
            this.getMouseEventPoint(e)
        );

        if (mapMode === EMapMode.Ban) {
            // 禁用任何逻辑判断
            return;
        }
        else if (mapMode === EMapMode.Polyline && drawing) {
            this.handlePolylineEnd(e);
        }
        else if (mapMode === EMapMode.Polygon && drawing) {
            this.handlePolygonEnd(e);
        }

        // 编辑态，平移捕捉
        if (_includes([
            EMapMode.Point,
            EMapMode.Circle,
            EMapMode.Line,
            EMapMode.Polyline,
            EMapMode.Rect,
            EMapMode.Polygon
        ], mapMode) && !drawing) {
            this.handleFeatureSelect(e);
        }
    }

    // onMouseWheel: 鼠标滑动
    public onMouseWheel(e: WheelEvent) {
        const mapMode = this.map.mode;
        mapMode !== EMapMode.Ban && e.preventDefault();

        // 后续对应模式处理
        switch (mapMode) {
            case EMapMode.Ban: {
                // 啥都不做
                break;
            }
            case EMapMode.Pan: {
                this.handleMapZoom(e);
                break;
            }
            default: {
                // 需要判断在绘制过程中是否允许缩放
                if (this.map.zoomWhenDrawing) {
                    this.handleMapZoom(e);
                }
                break;
            }
        }
    }

    // 清除计时器timer
    clearPanWhenDrawingTimer() {
        if (this.panWhenDrawingTimer) {
            window.clearInterval(this.panWhenDrawingTimer);
            this.panWhenDrawingTimer = null;
        }
    }
    // 绘制过程中启用平移视野
    handlePanWhenDrawing(e: MouseEvent) {
        const directionIndex = Util.EventUtil.getMouseDirection(this.map.dom, e);
        this.clearPanWhenDrawingTimer();
        const panScreenDistance = 10; // 每次平移10个像素

        // 如果map设置不允许自动平移 || 没有进行任何绘制点时
        if (!this.map.panWhenDrawing || !this.tmpPointsStore.length) {
            return;
        }

        this.panWhenDrawingTimer = window.setInterval(() => {
            const scale = this.map.getScale();
            const panGlobalDistance = panScreenDistance / scale;
            const center = this.map.getCenter();

            const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
            const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;

            let newCenter:IPoint = center;
            switch (directionIndex) {
                case 0: { // 上
                    newCenter = {
                        x: center.x,
                        y: isYAxisTop ? (center.y + panGlobalDistance) : (center.y - panGlobalDistance)
                    };
                    break;
                }
                case 1: { // 右
                    newCenter = {
                        x: isXAxisRight ? (center.x + panGlobalDistance) : (center.x - panGlobalDistance),
                        y: center.y
                    };
                    break;
                }
                case 2: { // 下
                    newCenter = {
                        x: center.x,
                        y: isYAxisTop ? (center.y - panGlobalDistance) : (center.y + panGlobalDistance)
                    };
                    break;
                }
                case 3: { // 左
                    newCenter = {
                        x: isXAxisRight ? (center.x - panGlobalDistance) : (center.x + panGlobalDistance),
                        y: center.y
                    };
                    break;
                }
            }
            this.map.setCenter(newCenter);
        }, 100);
    }

    // onMouseOut: 鼠标移出
    public onMouseOut(e: MouseEvent) {
        e.preventDefault();
        // 清空文字提示层
        this.map.tipLayer.removeAllFeatureActionText();
        // 清空鼠标矢量
        this.map.cursorLayer.removeAllFeatureActionText();
        // 如果在绘制过程中，此时需要判断是否需要自动平移视野

        // 如果平移到marker上，做忽略处理
        if (e.toElement) {
            const eleDataType = (e.toElement as HTMLElement).getAttribute('data-type');
            if (eleDataType === EMarkerType.Marker) {
                return;
            }
        }

        this.handlePanWhenDrawing(e);

        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.MouseOut,
            this.getMouseEventPoint(e)
        );

    }

    // onMouseOver: 鼠标移入
    public onMouseOver(e: MouseEvent) {
        e.preventDefault();
        // 清空文字提示层
        this.map.tipLayer.removeAllFeatureActionText();
        // 清除绘制过程中timer
        this.clearPanWhenDrawingTimer();

        // 对外暴露事件执行
        this.map.eventsObServer.emit(
            EEventType.MouseOver,
            this.getMouseEventPoint(e)
        );
    }

    // 撤销临时绘制点集
    revokeTmpPointsStore() {
        if (!this.tmpPointsStore.length) {
            return;
        }
        this.tmpPointsStore.pop();

        const mouseMoveEvent = this.mouseMoveEvent;
        mouseMoveEvent && this.onMouseMove(mouseMoveEvent);
    }

    // 设置文字提示
    setTip(textInfo: ITextInfo, option: IObject = {}) {
        if (this.map.drawingTip) {
            this.map.tipLayer.addText(textInfo, option);
        }
        else {
            this.map.tipLayer.removeAllFeatureActionText();
        }
    }

    // 重置drawing过程中产生的临时数据&清空临时绘制层
    reset() {
        // 绘制完成之后进行this.tmpPointsStore清空处理
        this.tmpPointsStore = [];
        // 清空overlayLayer
        this.map.overlayLayer.removeAllFeatureActionText();
        // 清空tipLayer
        this.map.tipLayer.removeAllFeatureActionText();
    }

    // @override
    refresh() {
        super.refresh();
    }
}
