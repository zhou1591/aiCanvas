import events from 'events/events';
import _assign from 'lodash/assign';

import {IObject, IPoint} from '../gInterface';
import {EMarkerEventType, EMarkerType} from './gEnum';
import MarkerLayer from '../layer/gLayerMarker';
import {IMarkerInfo} from './gInterface';
import Util from '../gUtil';
import {EXAxisDirection, EYAxisDirection} from '../gEnum';

export default class Marker {
    // markerId
    public id: string
    // markerType
    public type: EMarkerType
    // props
    public props: IObject
    // marker注记icon
    public image: HTMLImageElement

    // 是否拖拽中
    public dragging: boolean = false
    // 是否可拖拽【默认可拖拽】
    public draggingEnabled: boolean = false
    // 拖拽实时存储待更新的position
    public toUpdatePosition: IPoint | null

    // events
    public eventsObServer: events.EventEmitter

    // marker-container
    public layer: MarkerLayer

    // mouseDown坐标screen:IPoint
    public startPageScreenPoint: IPoint

    /**
     * props: text文本
     * defaultMarkerInfo: 默认文本配置项
     * style: userMarkerInfo merge defaultMarkerInfo
    */
    static defaultMarkerInfo: IMarkerInfo = {
        src: '',
        position: {x: 0, y: 0}, // 文本位置
        offset: {x: 0, y: 0} // 文本偏移量
    }
    public markerInfo: IMarkerInfo

    // function: constructor
    constructor(id: string, marker: IMarkerInfo, props: IObject = {}, option: IObject = {}) {
        this.id = id;
        this.type = EMarkerType.Marker;
        this.props = props;

        this.markerInfo = _assign({}, Marker.defaultMarkerInfo, marker);
        this.updateImage();

        // 事件监听实例添加
        this.eventsObServer = new events.EventEmitter();
    }

    // function: trigger when marker add to markerLayer
    onAdd(layer: MarkerLayer): void {
        this.layer = layer;
        this.refresh();
    }

    // trigger when marker remove from layer
    // layer exits first
    onRemove(): void {
        const imageElement = document.getElementById(this.id);
        imageElement && imageElement.remove();
    }

    // 开启鼠标按下拖拽
    enableDragging(): void {
        this.draggingEnabled = true;
        this.dragging = false;
    }

    disableDragging(): void {
        this.draggingEnabled = false;
        this.dragging = false;
    }

    // 更新image对象
    updateImage() {
        if (this.markerInfo.src) {
            this.image = new Image();
            this.image.id = this.id;
            this.image.setAttribute('data-type', this.type);
            this.image.style.position = 'absolute';
            this.image.style.cursor = 'pointer';
            this.image.style.userSelect = 'none';
            this.image.src = this.markerInfo.src;
            this.image.onload = () => {
                this.layer?.dom?.appendChild(this.image);
                this.attachEvents();
            }
            this.image.onerror = () => {
                console.error('marker‘s src onerror');
            };
        }
    }

    // 更新marker位置
    updatePosition(position: IPoint) {
        const markerInfo = this.markerInfo
        this.markerInfo = {
            ...markerInfo,
            position
        };
        this.refresh();
    }

    // 鼠标按下事件
    handleMouseDown(e: MouseEvent) {
        // 相关坐标值处理
        const {screenX, screenY} = e;
        this.startPageScreenPoint = {x: screenX, y: screenY};
        // 重置
        this.toUpdatePosition = null;
        // 鼠标event事件
        const buttonIndex = Util.EventUtil.getButtonIndex(e);

        // 首先执行回调
        this.eventsObServer.emit(
            EMarkerEventType.MouseDown,
            this
        );

        // 单击鼠标右键
        if (buttonIndex === 2) {
            this.eventsObServer.emit(
                EMarkerEventType.RightClick,
                this
            );
        }

        // 然后判断是否允许dragging
        if (!this.draggingEnabled) {
            return;
        }
        // 执行dragging拖拽
        this.dragging = true;
        document.onmousemove = e => this.handleMarkerMove(e);
        document.onmouseup = e => this.handleMarkerUp(e);

        // 执行onDragStart回调
        this.eventsObServer.emit(
            EMarkerEventType.DragStart,
            this
        );
    }
    // marker平移中
    handleMarkerMove(e: MouseEvent) {
        const scale = this.layer.map.getScale();
        const {screenX, screenY} = e;
        const {x, y} = this.startPageScreenPoint;
        const screenDltX = screenX - x;
        const screenDltY = screenY - y;
        const preGlobalDltX =  screenDltX / scale;
        const preGlobalDltY = screenDltY / scale;

        const isXAxisRight = this.layer.map.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.layer.map.yAxis.direction === EYAxisDirection.Top;
        const globalDltX = isXAxisRight ? preGlobalDltX : -preGlobalDltX;
        const globalDltY = isYAxisTop ? preGlobalDltY : -preGlobalDltY;

        const {position} = this.markerInfo;
        this.toUpdatePosition = {x: position.x + globalDltX, y: position.y - globalDltY};

        this.refresh(this.toUpdatePosition);

        // 执行onDragging回调
        this.eventsObServer.emit(
            EMarkerEventType.Dragging,
            this,
            this.toUpdatePosition
        );
    }
    // marker平移结束
    handleMarkerUp(e: MouseEvent) {
        this.dragging = false;
        document.onmousemove = null;
        document.onmouseup = null;

        if (this.toUpdatePosition) {
            // 首先复原marker，然后执行回调
            this.refresh();
            // 执行更新回调
            this.eventsObServer.emit(
                EMarkerEventType.DragEnd,
                this,
                this.toUpdatePosition
            );
        }

        this.toUpdatePosition = null;
    }

    // 鼠标弹起事件
    handleMouseUp(e: MouseEvent) {
        this.eventsObServer.emit(
            EMarkerEventType.MouseUp,
            this
        );
    }
    // 鼠标滑过事件
    handleMouseOver(e: MouseEvent) {
        // 清空tipLayer文字提示
        this.layer.map.eventLayer.breakFeatureCapture = true;
        this.layer?.map?.tipLayer.removeAllFeatureActionText();
        // 触发事件回调
        this.eventsObServer.emit(
            EMarkerEventType.MouseOver,
            this
        );
    }
    // 鼠标离开事件
    handleMouseOut(e: MouseEvent) {
        this.eventsObServer.emit(
            EMarkerEventType.MouseOut,
            this
        );
    }
    handleClick(e: MouseEvent) {
        this.eventsObServer.emit(
            EMarkerEventType.Click,
            this
        );
    }

    // marker添加事件绑定
    attachEvents() {
        this.image.onmousedown = e => this.handleMouseDown(e);
        this.image.onmouseup = e => this.handleMouseUp(e);
        this.image.onmouseover = e => this.handleMouseOver(e);
        this.image.onmouseout = e => this.handleMouseOut(e);
        this.image.onclick = e => this.handleClick(e);
    }

    // 刷新当前数据
    refresh(customPosition?: IPoint) {
        const {position: markerPosition, offset} = this.markerInfo;
        const position = customPosition || markerPosition;
        const {x: screenX, y: screenY} = this.layer.map.transformGlobalToScreen(position);
        const {x: offsetX, y: offsetY} = offset;
        const left = screenX + offsetX;
        const top = screenY - offsetY;

        this.image.style.left = `${left}px`;
        this.image.style.top = `${top}px`;
    }

    // 用户事件添加
    public events: IObject = {
        on: (eventType: EMarkerEventType, callback: Function) => {
            this.eventsObServer.on(eventType, callback);
        }
    }

    // 打印测试输出
    printInfo() {

    }
}
