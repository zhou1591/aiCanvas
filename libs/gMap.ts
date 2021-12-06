//
import events from 'events/events';
import hotkeys from 'hotkeys-js';

import _assign from 'lodash/assign';
import _uniqueId from 'lodash/uniqueId';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isNumber from 'lodash/isNumber';
import _cloneDeep from 'lodash/cloneDeep';
import _filter from 'lodash/filter';
import _map from 'lodash/map';

import {EMapMode, ECursorType, EEventType, EUrlCursorType, EXAxisDirection, EYAxisDirection, EEventSlotType} from './gEnum';
import {IMapOptions, ISize, IPoint, ICenterAndZoom, ITransPointOption, IObject, IAxisOption, IEventSlotType, IFunctionSlot, IExportOption} from './gInterface';
import Layer from './layer/gLayer';
import Control from './control/gControl';
import EventLayer from './layer/gLayerEvent';
import FeatureLayer from './layer/gLayerFeature';
import TextLayer from './layer/gLayerText';
import ExportHelperLayer from './layer/gLayerExportHelper';
import OverlayLayer from './layer/gLayerOverlay';
import MarkerLayer from './layer/gLayerMarker';
import MaskLayer from './layer/gLayerMask';
import ImageLayer from './layer/gLayerImage';
import {IFeatureStyle, IRectShape} from './feature/gInterface';
import Feature from './feature/gFeature';
import {ELayerType } from './layer/gEnum';
import {EFeatureType} from './feature/gEnum';

export default class Map {
    // 用户侧传入的dom
    public wrapperDomId: string
    public wrapperDom: HTMLElement

    // props: domId / dom
    public domId: string
    public dom: HTMLElement

    // props: layerDomId / layerDom
    public layerDomId: string
    public layerDom: HTMLDivElement

    // props: platformDomId / platformDom
    public platformDomId: string
    public platformDom: HTMLDivElement

    // props: layerDom2Id / layerDom2
    public layerDom2Id: string
    public layerDom2: HTMLDivElement

    // props: controlDomId / controlDom
    public controlDomId: string
    public controlDom: HTMLDivElement

    /**
     * props: map可选初始化配置项
     * defaultMapOptions: 默认配置项
     * mapOptions: userMapOptions merge defaultMapOptions
    */
    static defaultMapOptions: IMapOptions = {
        center: {x: 0, y: 0}, // 中心点坐标
        zoom: 1000, // 缩放值
        zoomWheelRatio: 5, // 鼠标滑轮缩放大小,取值区间[0, 10)，zoomWheelRatio越小，代表缩放速度越快，反之越慢
        mode: EMapMode.Pan, // 默认当前map模式
        size: null, // 可自定义容器宽/高，默认取dom: clientWidth/clientHeight
        refreshDelayWhenZooming: true, // 当持续缩放时，是否延时feature刷新，默认delay，性能更优
        zoomWhenDrawing: false, // 绘制过程中是否允许缩放，默认不会缩放
        featureCaptureWhenMove: false, // mousemove过程中是否开启捕捉, 默认不开启
        withHotKeys: true, // 是否开启快捷键
        panWhenDrawing: false, // 绘制过程中是否允许自动平移，默认不会自动平移
        xAxis: {direction: EXAxisDirection.Right}, // x坐标轴方向设置
        yAxis: {direction: EYAxisDirection.Bottom} // y坐标轴方向设置
    }
    private mapOptions: IMapOptions

    // x坐标轴方向设置
    public xAxis: IAxisOption
    // y坐标轴方向设置
    public yAxis: IAxisOption

    // 容器大小
    public size:ISize

    // 当持续缩放时，是否延时feature刷新，默认delay，性能更优
    public refreshDelayWhenZooming: boolean
    // 绘制过程中是否允许缩放，默认不会缩放
    public zoomWhenDrawing: boolean
    // 绘制过程中是否允许自动平移，默认不会自动平移
    public panWhenDrawing: boolean
    // mousemove过程中是否开启捕捉, 默认不开启
    public featureCaptureWhenMove: boolean
    // 快捷键是否开启
    public withHotKeys: boolean
    // 鼠标滑轮缩放大小,取值区间[0, 10)，zoomWheelRatio越小，代表缩放速度越快，反之越慢
    public zoomWheelRatio: number

    public zoom: number // 当前缩放值
    public center: IPoint // 左上角代表的实际坐标值

    // 当前map中包含的controls
    public controls: Control[] = []

    // 当前map中包含的layers
    public layers: Layer[] = []
    // 当前map上的eventLayer: 做事件监听接收
    public eventLayer: EventLayer
    // 当前map上的overlayLayer: 临时绘制矢量元素
    public overlayLayer: OverlayLayer
    // 当前map上的tipLayer: 文字提示等
    public tipLayer: OverlayLayer
    // 当前map上的cursorLayer: 比如涂抹时绘制圆圈大小鼠标样式
    public cursorLayer: OverlayLayer
    // 当前map上的markerLayer: 注记层，内部使用
    public markerLayer: MarkerLayer

    // 当前map模式-默认
    public mode: EMapMode

    // 绘制状态下相关样式设置
    public drawingStyle: IFeatureStyle = {}
    // 绘制状态下鼠标旁提示文案开关[默认开启]
    public drawingTip: boolean = true
    // 编辑时临时feature的颜色
    public editingColor: string = '#FF0000'

    // slots[暂时采用事件覆盖形式]
    public slotsObServer: IEventSlotType = {}

    // events
    public eventsObServer: events.EventEmitter
    // 视野变化触发事件
    public boundsChangedTimer: number | null

    // 当前选中的激活feature对象
    public activeFeature: Feature | null = null

    // function: constructor
    constructor(domId: string, mapOptions?: IMapOptions) {
        this.wrapperDomId = domId;
        this.wrapperDom = document.getElementById(domId);

        // 首先判断是否已经被实例化过


        // 在dom容器创建map主容器
        this.createMainDom();

        // 相关参数初始化
        this.mapOptions = _assign({}, Map.defaultMapOptions, mapOptions);
        this.zoom = this.mapOptions.zoom; // 更新初始zoom
        this.center = this.mapOptions.center; // 更新初始origin
        this.mode = this.mapOptions.mode; // 更新初始map操作模式
        this.refreshDelayWhenZooming = this.mapOptions.refreshDelayWhenZooming; // 是否持续缩放时延时刷新
        this.zoomWhenDrawing = this.mapOptions.zoomWhenDrawing; // 更新是否绘制过程中允许缩放
        this.panWhenDrawing = this.mapOptions.panWhenDrawing; // 更新是否绘制过程中允许平移
        this.featureCaptureWhenMove = this.mapOptions.featureCaptureWhenMove; // mousemove过程中是否开启捕捉, 默认不开启
        this.withHotKeys = this.mapOptions.withHotKeys; // 快捷键开关设置
        this.zoomWheelRatio = this.mapOptions.zoomWheelRatio; // 滑轮缩放速率
        this.xAxis = this.mapOptions.xAxis; // x轴设置
        this.yAxis = this.mapOptions.yAxis; // y轴设置
        this.size = this.mapOptions.size || { // 容器大小设置
            width: _get(this.dom, 'clientWidth', 0),
            height: _get(this.dom, 'clientHeight', 0)
        };

        // 设置容器样式
        this.setDomStyle();
        // 分别创建platformContainer/layerContainer/controlCOntainer
        this.createSubDoms();
        // 添加overlayLayer至当前map，最终会被添加至platform层
        this.addOverlayLayer();
        // 添加tipLayer至当前map，最终会被添加至platform层
        this.addTipLayer();
        // 添加cursorLayer至当前map，最终会被添加至platform层
        this.addCursorLayer();
        // 添加eventLayer至当前map，最终会被添加至platform层
        this.addEventLayer();
        // 添加markerLayer至当前map，最终会被添加至platform层
        this.addMarkerLayer();
        // 事件监听实例添加
        this.eventsObServer = new events.EventEmitter();
        // 注册快捷键（注意多实例时可能存在冲突问题，后面的实例会覆盖前面的）
        this.withHotKeys && this.registerHotkey();
    }

    // 设置dom容器的style样式
    setDomStyle() {
        this.dom.ondragstart = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        this.dom.oncontextmenu = e => {
            e.preventDefault();
            e.stopPropagation();
        };
    }

    // 设置当前mapMode模式
    setMode(mode: EMapMode) {
        this.mode = mode;
        this.eventLayer.reset();

        // 切换mode时，需要取消activeFeature的选中
        if (this.activeFeature) {
            this.eventsObServer.emit(EEventType.FeatureUnselected, this.activeFeature, 'cancel by switch mode');
        }
    }

    // 设置当前map绘制状态样式
    setDrawingStyle(drawingStyle: IFeatureStyle) {
        this.drawingStyle = drawingStyle;
    }

    // 设置编辑时临时feature的颜色
    setEditingColor(color: string) {
        this.editingColor = color;
    }

    // 开启绘制过程中的tip提示文案
    enableDrawingTip() {
        this.drawingTip = true;
    }
    // 关闭绘制过程中的tip提示文案
    disableDrawingTip() {
        this.drawingTip = false;
    }

    // 获取dom宽高（width/height）
    public getSize(): ISize {
        return this.size;
    }

    // 获取当前的缩放比率
    public getScale(zoom?: number): number {
        const scaleZoom = _isNumber(zoom) ? zoom : this.zoom;
        const dot = 1000000; // 小数点6位数
        const {width} = this.getSize();
        const scale = parseInt(width * dot / scaleZoom + '', 10) / dot;
        return scale;
    }

    // 获取当前的缩放值
    public getZoom(zoom?: number): number {
        return _isNumber(zoom) ? zoom : this.zoom;
    }

    // 设置实际坐标系center
    public setCenter(center: IPoint): Map {
        this.center = center;
        this.refresh();
        this.triggerBoundsChanged();
        return this;
    }
    // 获取实际坐标系center
    public getCenter(): IPoint {
        return this.center;
    }

    // 获取屏幕中心点坐标
    public getScreenCenter(): IPoint {
        const {width, height} = this.getSize();
        return {
            x: width / 2,
            y: height / 2
        };
    }

    // 获取当前视野范围
    public getBounds(option?: IObject): IRectShape {
        const {width, height} = this.getSize();
        const {x: ltx, y: lty} = this.transformScreenToGlobal({x: 0, y: 0});
        const {x: rtx, y: rty} = this.transformScreenToGlobal({x: width, y: height});
        return {
            x: ltx,
            y: lty,
            width: rtx - ltx,
            height: lty - rty
        };
    }

    // 绘制过程中是否允许自由缩放
    enableZoomWhenDrawing() {
        this.zoomWhenDrawing = true;
    }
    disableZoomWhenDrawing() {
        this.zoomWhenDrawing = false;
    }
    // 绘制过程中是否允许自由平移
    enablePanWhenDrawing() {
        this.panWhenDrawing = true;
    }
    disablePanWhenDrawing() {
        this.panWhenDrawing = false;
    }
    // move过程中是否开启捕捉
    enableFeatureCaptureWhenMove() {
        this.featureCaptureWhenMove = true;
    }
    disableFeatureCaptureWhenMove() {
        this.featureCaptureWhenMove = false;
    }
    // 开启快捷键
    enableHotKeys() {
        if (!this.withHotKeys) {
            this.withHotKeys = true;
            this.registerHotkey();
        }
    }
    disableHotKeys() {
        if (this.withHotKeys) {
            this.withHotKeys = false;
            this.unbindHotkey();
        }
    }

    // 定位且zoom到指定zoom值
    centerAndZoom(centerZoom: ICenterAndZoom, option: IObject = {}): Map {
        const {refreshDelay = false} = option;
        const {center, zoom} = centerZoom;
        center && (this.center = center);
        _isNumber(zoom) && (this.zoom = zoom);
        // 只有map设置了this.refreshDelayWhenZooming = true && refreshDelay = true才能允许延时刷新
        this.refresh(refreshDelay && this.refreshDelayWhenZooming);
        this.triggerBoundsChanged();
        return this;
    }

    // 缩放到指定zoom
    zoomTo(zoom: number): void {
        this.zoom = zoom;
        this.refresh();
        this.triggerBoundsChanged();
    }

    // 放大-中心点放大
    zoomIn(): void {
        this.zoom = this.zoom / 2;
        this.refresh();
        this.triggerBoundsChanged();
    }

    // 缩小
    zoomOut(): void {
        this.zoom = this.zoom * 2;
        this.refresh();
        this.triggerBoundsChanged();
    }

    // 设置滑轮缩放比例, 取值区间[0, 10)
    setZoomWheelRatio(ratio: number) {
        this.zoomWheelRatio = ratio;
    }

    // 添加控件
    addControl(control: Control) {
        control.onAdd(this);
        this.controls.push(control);
    }

    // 删除指定control
    removeControlById(targetControlId: string) {
        const newControls = _filter(this.controls, (control: Control) => {
            const controlId = control.id;
            if (controlId === targetControlId) {
                control.onRemove();
                return false;
            }
            return true;
        });
        // 重新设置最新的controls
        this.controls = newControls;
    }

    // 添加layer至当前map容器
    addLayer(layer: Layer) {
        // 首先将layer-dom-append到容器中
        const layerDom = layer.dom;
        this.layerDom.appendChild(layerDom);
        // 然后调用layer的onAdd方法
        layer.onAdd(this);
        // 添加对象layers中
        this.layers.push(layer);
    }
    // 删除指定layer
    removeLayerById(targetLayerId: string) {
        const newLayers = _filter(this.layers, (layer: Layer) => {
            const layerId = layer.id;
            if (layerId === targetLayerId) {
                layer.onRemove();
                return false;
            }
            return true;
        });
        // 重新设置最新的layers
        this.layers = newLayers;
        // 执行重绘刷新
        this.refresh();
    }
    // 删除所有layer[除内置layers]
    removeAllLayers() {
        const newLayers = _filter(this.layers, (layer: Layer) => {
            layer.onRemove();
            return false;
        });
        // 重新设置最新的layers
        this.layers = newLayers;
        // 执行重绘刷新
        this.refresh();
    }
    // 获取所有手动添加的layers
    public getLayers(): Array<Layer> {
        return this.layers;
    }

    // 触发视野范围变化回调
    triggerBoundsChanged() {
        // 通知上层视野范围发生变化
        if (this.boundsChangedTimer) {
            window.clearTimeout(this.boundsChangedTimer);
            this.boundsChangedTimer = null;
        }
        this.boundsChangedTimer = window.setTimeout(() => {
            this.eventsObServer.emit(EEventType.BoundsChanged);
        }, 200);

        // 刷新overlayLayer: 目的是绘制图形过程中刷新临时绘制要素信息
        this.overlayLayer.refresh();
    }

    // 刷新当前视图
    // refreshDelay 是否需要延迟刷新，主要为了解决滑轮缩放时频繁触发元素refresh
    refresh(refreshDelay = false) {
        // 用户加入layer刷新
        _forEach(this.layers, (layer: Layer) => layer.refresh(refreshDelay));
        // markerLayer也要伴随刷新
        this.markerLayer.refresh();
    }

    // 刷新当前视图
    resize(size?: ISize) {
        // 重设size大小
        this.size = size || { // 容器大小设置
            width: _get(this.dom, 'clientWidth', 0),
            height: _get(this.dom, 'clientHeight', 0)
        };
        // 重设最外层容器大小
        this.setLayerDomSize();
        this.setPlatformDomSize();

        // resize-layer
        _forEach(this.layers, (layer: Layer) => layer.resizeAndRefresh());
        // 内置图层markerLayer/overlayLayer/tipLayer/eventLayer执行resize
        this.markerLayer.resizeAndRefresh();
        this.overlayLayer.resizeAndRefresh();
        this.tipLayer.resizeAndRefresh();
        this.eventLayer.resizeAndRefresh();

    }

    // 设置当前active的feature
    setActiveFeature(feature: Feature | null) {
        this.activeFeature = feature;
        // 如果不存在feature，则清空overLayer, 否则添加activeFeature
        this.overlayLayer.addActiveFeature(feature);
        // 主动触发一次mouseMove事件
        const mouseMoveEvent = this.eventLayer.mouseMoveEvent;
        mouseMoveEvent && this.eventLayer.onMouseMove(mouseMoveEvent);
    }
    // 获取当前active的feature
    getActiveFeature(): Feature | null {
        return this.activeFeature;
    }

    // 撤销临时绘制点【如线段/多段线/多边形等】
    removeDrawingPoints() {
        this.eventLayer.revokeTmpPointsStore();
    }

    // 根据点获取各Layer.Feature上的
    getTargetFeatureWithPoint(globalPoint: IPoint): Feature | null {
        const mapLayers = this.getLayers();
        const targetFeatures = [];
        _forEach(mapLayers, (layer: Layer) => {
            if (layer.type === ELayerType.Feature) {
                const target = (layer as FeatureLayer).getTargetFeatureWithPoint(globalPoint);
                if (target) {
                    targetFeatures.push(target);
                    return false;
                }
            }
        });
        const targetFeature = _get(targetFeatures, '[0]', null);
        return targetFeature;
    }

    // 以图片形式导出layers[当前只支持到处text/image/feature三种layer图层]
    exportLayersToImage(bounds: IRectShape, option: IExportOption = {}) {
        const {
            layers = this.getLayers(),
            type = 'base64',
            format = 'image/png',
            quality = 1
        } = option;

        const exportLayers  = layers;
        let exportLayerHelper = new ExportHelperLayer(bounds);

        const promises = [];
        // 循环添加feature/text/image
        _forEach(exportLayers, async (layer: Layer) => {
            if (layer.type === ELayerType.Feature) {
                const features = (layer as FeatureLayer).getAllFeatures();
                const allFeatures = _cloneDeep(features);
                exportLayerHelper.addObjects(allFeatures);

                // 通知结束
                promises.push(new Promise(resolve => {
                    resolve(true);
                }));
            }
            else if (layer.type === ELayerType.Text) {
                const texts = (layer as TextLayer).getAllTexts();
                const allTexts = _cloneDeep(texts);
                // ImageAction存在跨越问题
                exportLayerHelper.addObjects(allTexts);

                // 通知结束
                promises.push(new Promise(resolve => {
                    resolve(true);
                }));
            }
            else if (layer.type === ELayerType.Mask) {
                const imageBase64 = (layer as MaskLayer).getImageWithBounds(bounds);
                // 通知结束
                promises.push(new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        exportLayerHelper.putImage(image as HTMLImageElement);
                        resolve(true);
                    };
                    image.onerror = () => {
                        reject();
                    };
                    image.src = imageBase64;
                }));
                // exportLayerHelper.putImage(image as HTMLImageElement);
            }
            else if (layer.type === ELayerType.Image) {
                const imageLayer = _cloneDeep(layer);
                // 存在跨越问题
                exportLayerHelper.addImageLayer(imageLayer as ImageLayer);
                // 通知结束
                promises.push(new Promise(resolve => {
                    resolve(true);
                }));
            }
        });

        // 返回promise对象
        return new Promise((resolve, reject) => {
            Promise.all(promises).then(() => {
                const imagePromise = exportLayerHelper.convertCanvasToImage(type, format, quality);
                imagePromise.then(image => {
                    exportLayerHelper = null;
                    resolve(image);
                }).catch((error) => {
                    console.log(error);
                });
            }).catch((error) => {
                console.log(error);
            });
        });
    }


    // 屏幕坐标转换全局【实际】坐标，默认基于中心点基准point进行计算
    public transformScreenToGlobal(screenPoint: IPoint, options?: ITransPointOption): IPoint {
        const {basePoint, zoom} = options || {};

        const scale = this.getScale(zoom);
        const {x: screenCenterX, y: screenCenterY} = this.getScreenCenter();
        const {x: screenX, y: screenY} = screenPoint;

        const screenBasePointX = _get(basePoint, 'screen.x', screenCenterX);
        const screenBasePointY = _get(basePoint, 'screen.y', screenCenterY);
        const {x: basePointX, y: basePointY} = _get(basePoint, 'global', this.center);

        const dltScreenX = screenX - screenBasePointX;
        const dltScreenY = screenY - screenBasePointY;

        const isXAxisRight = this.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.yAxis.direction === EYAxisDirection.Top;
        const globalX = isXAxisRight ? (basePointX + dltScreenX / scale) : (basePointX - dltScreenX / scale);
        const globalY = isYAxisTop ? (basePointY - dltScreenY / scale) : (basePointY + dltScreenY / scale);

        return {
            x: globalX,
            y: globalY
        };
    }

    // 全局【实际】坐标转换屏幕坐标，默认基于中心点基准point进行计算
    public transformGlobalToScreen(globalPoint: IPoint, options?: ITransPointOption): IPoint {
        const {basePoint, zoom} = options || {};

        const scale = this.getScale(zoom);
        const {x: screenCenterX, y: screenCenterY} = this.getScreenCenter();
        const {x: globalX, y: globalY} = globalPoint;

        const screenBasePointX = _get(basePoint, 'screen.x', screenCenterX);
        const screenBasePointY = _get(basePoint, 'screen.y', screenCenterY);
        const {x: basePointX, y: basePointY} = _get(basePoint, 'global', this.center);

        const dltGlobalX = globalX - basePointX;
        const dltGlobalY = globalY - basePointY;

        const isXAxisRight = this.xAxis.direction === EXAxisDirection.Right;
        const isYAxisTop = this.yAxis.direction === EYAxisDirection.Top;
        const screenX = isXAxisRight ? (screenBasePointX + dltGlobalX * scale) : (screenBasePointX - dltGlobalX * scale);
        const screenY = isYAxisTop ? (screenBasePointY - dltGlobalY * scale) : (screenBasePointY + dltGlobalY * scale);

        return {
            x: screenX,
            y: screenY
        };
    }

    // 创建this.dom
    createMainDom() {
        this.domId = `main-wrapper-${_uniqueId()}`;
        this.dom = document.createElement('div');
        this.dom.setAttribute('id', this.domId);
        this.dom.style.position = 'absolute';
        this.dom.style.left = '0';
        this.dom.style.top = '0';
        this.dom.style.right = '0';
        this.dom.style.bottom = '0';
        this.wrapperDom.appendChild(this.dom);
    }

    // 创建map容器下相关的container
    createSubDoms(): void {
        this.setLayerDom();
        this.setPlatformDom();
        this.setLayerDom2();
        this.setControlDom();
    }

    // 创建图层container
    setLayerDom(): void {
        this.layerDomId = `layer-wrapper-${_uniqueId()}`;
        this.layerDom = document.createElement('div');
        this.layerDom.setAttribute('id', this.layerDomId);
        this.layerDom.style.position = 'absolute';
        this.layerDom.style.left = '0';
        this.layerDom.style.top = '0';
        this.layerDom.style.zIndex = '1';
        // 设置大小
        this.setLayerDomSize();
        // add this.layerDom to dom
        this.dom.appendChild(this.layerDom);
    }
    setLayerDomSize() {
        const {width, height} = this.getSize();
        this.layerDom.style.width = `${width}px`;
        this.layerDom.style.height = `${height}px`;
    }
    // 创建platform平台container[不会进行位置的移动]
    setPlatformDom(): void {
        this.platformDomId = `platform-wrapper-${_uniqueId()}`;
        this.platformDom = document.createElement('div');
        this.platformDom.setAttribute('id', this.platformDomId);
        this.platformDom.style.position = 'absolute';
        this.platformDom.style.left = '0';
        this.platformDom.style.top = '0';
        this.platformDom.style.zIndex = '5';
        // 设置大小
        this.setPlatformDomSize();
        // add this.platformDom to dom
        this.dom.appendChild(this.platformDom);
    }
    setPlatformDomSize() {
        const {width, height} = this.getSize();
        this.platformDom.style.width = `${width}px`;
        this.platformDom.style.height = `${height}px`;
    }
    // 创建layer控件container【不同于setLayerDom的是：此容器width=0, height=0】
    setLayerDom2(): void {
        this.layerDom2Id = `layer2-wrapper-${_uniqueId()}`;
        this.layerDom2 = document.createElement('div');
        this.layerDom2.setAttribute('id', this.layerDom2Id);
        this.layerDom2.style.position = 'absolute';
        this.layerDom2.style.left = '0';
        this.layerDom2.style.right = '0';
        this.layerDom2.style.width = '0';
        this.layerDom2.style.height = '0';
        this.layerDom2.style.zIndex = '10';

        // add this.layerDom2 to dom
        this.dom.appendChild(this.layerDom2);
    }

    // 创建control控件container
    setControlDom(): void {
        // 暂时不用，control直接会在dom上进行添加

        this.controlDomId = `control-wrapper-${_uniqueId()}`;
        this.controlDom = document.createElement('div');
        this.controlDom.setAttribute('id', this.controlDomId);
        this.controlDom.style.position = 'absolute';
        this.controlDom.style.left = '0';
        this.controlDom.style.right = '0';
        this.controlDom.style.width = '0';
        this.controlDom.style.height = '0';
        this.controlDom.style.zIndex = '15';

        // add this.controlDom to dom
        this.dom.appendChild(this.controlDom);
    }

    // 添加eventLayer至当前map
    addEventLayer() {
        // 实例化eventLayer
        this.eventLayer = new EventLayer(`event-${_uniqueId()}`, {}, {zIndex: 5});

        // 首先将layer-dom-append到容器中
        this.platformDom.appendChild(this.eventLayer.dom);
        this.eventLayer.onAdd(this);
    }

    // 添加overlayLayer至当前map
    addOverlayLayer() {
        // 实例化overlayLayer
        this.overlayLayer = new OverlayLayer(`overlay-${_uniqueId()}`, {}, {zIndex: 1});

        // 首先将layer-dom-append到容器中
        this.platformDom.appendChild(this.overlayLayer.dom);
        this.overlayLayer.onAdd(this);
    }

    // 添加tipLayer至当前map
    addTipLayer() {
        // 实例化tipLayer
        this.tipLayer = new OverlayLayer(`tip-${_uniqueId()}`, {}, {zIndex: 2});

        // 首先将layer-dom-append到容器中
        this.platformDom.appendChild(this.tipLayer.dom);
        this.tipLayer.onAdd(this);
    }

    // 添加cursorLayer至当前map
    addCursorLayer() {
        // 实例化cursorLayer
        this.cursorLayer = new OverlayLayer(`cursor-${_uniqueId()}`, {}, {zIndex: 3});

        // 首先将layer-dom-append到容器中
        this.platformDom.appendChild(this.cursorLayer.dom);
        this.cursorLayer.onAdd(this);
    }

    // 添加markerLayer至当前map
    addMarkerLayer() {
        // 实例化markerLayer
        this.markerLayer = new MarkerLayer(`marker-${_uniqueId()}`, {}, {zIndex: 10});

        // 首先将layer-dom-append到容器中
        this.layerDom2.appendChild(this.markerLayer.dom);
        this.markerLayer.onAdd(this);
    }

    // 注册快捷键
    registerHotkey() {
        // 注册ctrl+z删除
        hotkeys('ctrl+z', (event, handler) => {
            this.removeDrawingPoints();
        });
    }
    // 解绑快捷键
    unbindHotkey() {
        hotkeys.unbind('ctrl+z');
    }

    // setCursor
    setCursor(cursor: ECursorType | EUrlCursorType, option: IObject = {}): Map {
        // 鼠标矢量样式层清空
        this.cursorLayer.removeAllFeatureActionText();
        // 设置mouse:cursor
        this.platformDom.style.cursor = cursor;

        // 然后判断是否需要绘制矢量鼠标样式
        this.setCursorFeature(option);

        return this;
    }
    // setUrlCursor
    setUrlCursor(cursor: EUrlCursorType): Map {
        return this;
    }
    // 设置矢量cursor
    setCursorFeature(option: IObject = {}) {
        const {type, shape} = option;
        // 涂抹/擦除
        if (type === EFeatureType.Circle) {
            this.cursorLayer.addCircleFeature(
                shape,
                {style: {
                    lineWidth: 1,
                    strokeStyle: '#aaa',
                    fillStyle: '#ffffffb3',
                    stroke: true,
                    fill: true
                }}
            );
        }
    }

    // map-dragging时调用，在平移时调用
    onDrag(dltX: number, dltY: number) {
        this.layerDom.style.left = `${dltX}px`;
        this.layerDom.style.top = `${dltY}px`;

        this.layerDom2.style.left = `${dltX}px`;
        this.layerDom2.style.top = `${dltY}px`;
    }

    // map缩放
    onZoom(scale: number) {
        this.dom.style.transform = `scale(${scale})`;
    }

    // 复位
    reset(): Map {
        this.layerDom.style.left = '0';
        this.layerDom.style.top = '0';

        this.layerDom2.style.left = '0';
        this.layerDom2.style.top = '0';

        // this.dom.style.transform = 'scale(1)';
        return this;
    }

    // 用户事件添加
    public events: IObject = {
        on: (eventType: EEventType, callback: Function) => {
            this.eventsObServer.on(eventType, callback);
        }
    }

    // 插槽事件添加
    public slots: IObject = {
        on: (eventType: EEventSlotType, callback: IFunctionSlot) => {
            this.slotsObServer[eventType] = callback;
        }
    }

    // gMap实例销毁
    public destroy() {
        // 移除当前事件
        this.dom.remove();
    }

    // 打印测试输出
    printInfo() {

    }

    /**
     * @Date: 2021-10-14 18:59:31
     * @description: 空格闭合 gLayerEvent 得多边形和多段线
     */    
    public spaceClosePoly() {
        this.eventLayer.spaceClosePoly();
    }
    /**
     * @user: zjs
     * @Date: 2021-12-06 17:25:01
     * @description: 更改高精度标注开启
     */    
    public modifyUpPrecision(val){
        this.eventLayer.modifyUpPrecision();
    }
}
