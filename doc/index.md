# 概述
在前端开发过程中难免遇到针对图片的缩放平移；以及在图片上进行矢量数据、文本、标注的展示； 如果你有上面的任何需求，恭喜你，找到组织了....在此背景下，AILabel.js诞生了

--------
## 特性
> 1. 多类型要素展示：图片/矢量数据/文本/标注
> 2. 高效绘图：canvas矢量数据绘制
> 3. 使用方便简单 ✨✨✨✨✨

## 名词解释
1. zoom：容器宽代表的实际距离宽
2. 实际坐标系：要素或实体代表的实际坐标值所在的坐标系
3. 屏幕标注系：用来展示的坐标系
4. ...

## 授权
....

# AILabel.Map
## 实例化
```javascript
// js: 伪代码
const gMap = new AILabel.Map(domId: string, mapOptions?: IMapOptions);
// js: demo【gMap将作为后续使用的容器实例，不再进行重复实例操作】
const gMap = new AILabel.Map('map', {
   center: {x: 0, y: 0},
   zoom: 800,
   mode: 'PAN' // 绘制线段
});
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|domId|Dom容器id|是|--|string|
|mapOptions|可选配置项|否|--|IMapOptions|

**IMapOptions**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|zoom|初始缩放级别|否|1000|number|
|center|初始中心点坐标|否|--|IPoint|
|size|容器大小设置|否|null（会获取dom：clientWidth[Height]）|ISize|
|mode|当前操作模式|否|'PAN'|EMapMode枚举-见下文|
|refreshDelayWhenZooming|持续缩放是否延时刷新features（如滑轮缩放时），性能优化|否|true|boolean|
|zoomWhenDrawing|绘制时可滑轮缩放|否|false|boolean|
|panWhenDrawing|绘制时可到边界外自动平移|否|false|boolean|
|featureCaptureWhenMove|绘制过程中是否开启‘双击选中’tip提示，耗费性能（会持续进行move捕捉判断）|否|false|boolean|
|withHotKeys|快捷键开关|否|true|boolean|
|zoomWheelRatio|鼠标滑轮缩放大小,取值区间[0, 10)，zoomWheelRatio越小，代表缩放速度越快，反之越慢|否|5|number|

**IPoint**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|x|x坐标|是|--|number|
|y|y坐标|是|--|number|

**ISize**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|width|宽|是|--|number|
|height|高|是|--|number|

## setMode
AILabel.Map实例设置当前模式
```javascript
gMap.setMode(mode: EMapMode);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|mode|操作模式|是|--|EMapMode枚举|

**EMapMode**

|参数|说明|类型|
|---|---|---|---|---|
|PAN|平移|string|
|BAN|禁用视野缩放平移|string|
|POINT|绘制点|string|
|CIRCLE|绘制圆|string|
|LINE|绘制线|string|
|POLYLINE|绘制多段线|string|
|RECT|绘制矩形|string|
|POLYGON|绘制多边形|string|
|DRAWMASK|绘制涂抹|string|
|CLEARMASK|擦除涂抹|string|
|IMAGEMASK|绘制涂抹（Image形式）|string|

## setZoomWheelRatio
AILabel.Map实例设置滑轮缩放比例, 取值区间[0, 10)
```javascript
gMap.setZoomWheelRatio(0);
```

## setDrawingStyle
AILabel.Map设置绘制过程中的样式
```javascript
gMap.setDrawingStyle(drawingStyle: IFeatureStyle);
```

**IFeatureStyle**

canvas样式：比如lineWidth/strokeStyle/fillStyle等

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|lineWidth|线宽|否|1|number|
|strokeStyle|边框颜色|否|'#FF0000'|boolean|
|fillStyle|填充色|否|'#FF0000'|boolean|
|自定义：arrow|是否绘制箭头（只针对线段）|否|false|boolean|
|自定义：stroke|是否闭合|否|true|boolean|
|自定义：fill|是否填充|否|false|boolean|
|其他配置|--|否|--|--|

## setEditingColor
AILabel.Map设置编辑时拖拽对象的绘制颜色
```javascript
gMap.setEditingColor('#000');
```

## enableDrawingTip
AILabel.Map设置绘制过程中提示文字开启【默认开启】
```javascript
gMap.enableDrawingTip();
```

## disableDrawingTip
AILabel.Map设置绘制过程中提示文字关闭
```javascript
gMap.disableDrawingTip();
```

## enableHotKeys
AILabel.Map设置快捷键开启
```javascript
gMap.enableHotKeys();
```

## disableHotKeys
AILabel.Map设置快捷键关闭
```javascript
gMap.disableHotKeys();
```

## enableZoomWhenDrawing
开启绘制时可鼠标滑轮缩放
```javascript
// define
enableZoomWhenDrawing()
// demo
gMap.enableZoomWhenDrawing();
```

## disableZoomWhenDrawing
禁用绘制时可鼠标滑轮缩放
```javascript
// define
disableZoomWhenDrawing()
// demo
gMap.disableZoomWhenDrawing();
```

## enablePanWhenDrawing
开启绘制时鼠标达到边界外自动平移
```javascript
// define
enablePanWhenDrawing()
// demo
gMap.enablePanWhenDrawing();
```

## disablePanWhenDrawing
禁用绘制时鼠标达到边界外自动平移
```javascript
// define
disablePanWhenDrawing()
// demo
gMap.disablePanWhenDrawing();
```

## getSize
获取传入容器的大小
```javascript
// define
getSize(): ISize
// demo
const containerSize = gMap.getSize();
```

**ISize**

|参数|说明|类型|
|---|---|---|---|---|
|width|宽|number|
|height|高|number|

## getScale
获取当前缩放比例 (containerWidth / zoom)
```javascript
// define
getScale(zoom?: number): number
// demo
const scale = gMap.getScale();
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|zoom|缩放值|否|map.zoom|number|

## setCenter
设置中心点（即容器的中心点对应的实际坐标的中心点）
```javascript
// define
setCenter(center: IPoint): Map
// demo
gMap.setCenter(center);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|center|中心点|是|--|IPoint|

## getCenter
获取中心点（即容器的中心点对应的实际坐标的中心点）
```javascript
// define
getCenter(): IPoint
// demo
const center = gMap.getCenter();
```

## getScreenCenter
获取屏幕中心点坐标（即containerWidth/2, containerHeight/2）
```javascript
// define
getScreenCenter(): IPoint
// demo
const center = gMap.getScreenCenter();
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|zoom|缩放值|否|map.zoom|number|

## getBounds
获取视野范围
```javascript
// define【option为预留参数字段】
getBounds(option?: IObject = {}): IRectShape
// demo
const bounds = gMap.getBounds();
```

**IRectShape**

|参数|说明|类型|
|---|---|---|
|x|左上角坐标x|number|
|y|左上角坐标y|number|
|width|宽度|number|
|height|高度|number|

## centerAndZoom
定位并缩放到指定位置
```javascript
// define
centerAndZoom(option: ICenterAndZoom): Map
// demo
const bounds = gMap.centerAndZoom({center: {x,y}, zoom: 1000});
```

**ICenterAndZoom**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|center|定位到的位置|否|map.center|IPoint|
|zoom|缩放值|否|map.zoom|number|

## zoomIn
放大
```javascript
// define
zoomIn()
// demo
gMap.zoomIn();
```

## zoomOut
缩小
```javascript
zoomOut()
// demo
gMap.zoomOut();
```

## addLayer
添加Layer至当前Map实例
```javascript
// define
addLayer(layer: Layer)
// demo
const featureLayer = new AILabel.Layer.Feature(...);
gMap.addLayer(featureLayer);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|layer|待添加图层|是|--|Layer|

**Layer**
详细解释见Layer：api
|参数|说明|类型|
|---|---|---|
|Image|图片图层|AILabel.Layer.Image|
|Feature|矢量图层|AILabel.Layer.Feature|
|Mask|涂抹图层|AILabel.Layer.Mask|
|Text|文本图层|AILabel.Layer.Text|

## removeLayerById
删除指定layerId的图layer
```javascript
// define
removeLayerById(targetLayerId: string)
// demo
const featureLayer = new AILabel.Layer.Feature(...);
gMap.addLayer(featureLayer);
gMap.removeLayerById(featureLayer.id);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|targetLayerId|待删除图层id|是|--string|

## removeAllLayers
删除所有layers【内置图层除外】
```javascript
// define
removeAllLayers()
// demo
const featureLayer = new AILabel.Layer.Feature(...);
gMap.addLayer(featureLayer);
gMap.removeAllLayers();
```

## getLayers
获取当前map实例上的所有layer
```javascript
// define
getLayers(): Array<Layer>
// demo
const allLayers = gMap.getLayers();
```

## refresh
刷新map
```javascript
// define
refresh()
// demo
gMap.refresh();
```

## resize
大小重设map，可以指定size大小或者不传入(会自动获取dom-size大小进行重设)
```javascript
// define
resize(size?: ISize)
// demo
gMap.resize();
```

## setActiveFeature
设置map当前的待编辑feature，最多只会存在一个activeFeature
```javascript
// define
setActiveFeature(feature: Feature | null)
// demo
// 设置编辑feature，需要配合gMap.events.on('featureSelected')使用【后续事件部分会详细讲解】
gMap.setActiveFeature(feature);
// 取消编辑对象，需要配合gMap.events.on('featureUnselected')使用【后续事件部分会详细讲解】
gMap.setActiveFeature(null);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|feature|待编辑feature|是|--|Feature或null|

## getActiveFeature
获取当前activeFeature
```javascript
// define
getActiveFeature(): Feature | null
// demo
gMap.getActiveFeature();
```

## getTargetFeatureWithPoint
获取命中的矢量Feature对象，没有命中，则返回null
```javascript
// define
getTargetFeatureWithPoint(globalPoint: IPoint): Feature | null
// demo
const targetFeature = gMap.getTargetFeatureWithPoint(point);
```

## transformScreenToGlobal
屏幕坐标转实际坐标
```javascript
// define
transformScreenToGlobal(screenPoint: IPoint): IPoint
// demo
const globalPoint = gMap.transformScreenToGlobal({x, y});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|screenPoint|待转换屏幕坐标|是|--|IPoint|

## transformGlobalToScreen
实际坐标转屏幕坐标
```javascript
// define
transformGlobalToScreen(globalPoint: IPoint): IPoint
// demo
const screenPoint = gMap.transformGlobalToScreen({x, y});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|globalPoint|待转换实际坐标|是|--|IPoint|

## exportLayersToImage
AILabel.Map将layers导出为图片（支持导出text/image/feature/mask等图层，“图片不能跨域“）
```javascript
// define
exportLayersToImage(bounds: IRectShape, option: IExportOption = {})
// demo
const base64 = await gMap.exportLayersToImage(
        {x: 0, y: 0, width: 500, height: 354},
        {type: 'base64', format: 'image/png'}
    );
const blob = await gMap.exportLayersToImage(
        {x: 0, y: 0, width: 500, height: 354},
        {type: 'blob', format: 'image/png'}
    );
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|bounds|导出视野范围|是|--|IRectShape|
|option|其他可选项配置|否|--|IExportOption|

**IExportOption**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|layers|导出图层list|否|当前Map上的layers|Layer[]|
|type|导出数据形式（支持base64或blob)|否|base64|string|
|format|图片格式（支持image/png或image/jpeg)|否|image/png|string|

## destroy
AILabel.Map实例销毁【如果在切换实例时最好要将上一次实例进行destroy】
```javascript
gMap && gMap.destroy();
```

## events
事件监听
```javascript
// define
events.on(eventType: EEventType, callback: Function);
// demo
gMap.events.on('boundsChanged', () => {console.log('bounds has changed')});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|eventType|时间枚举类型|是|--|EEventType|
|callback|回调函数|是|--|Function|

**EEventType**

|参数|说明|类型|callback|
|---|---|---|---|
|boundsChanged|视野范围发生变化|string|BoundsChanged|
|featureSelected|在绘制模式下双击feature触发选中|string|FeatureSelected|
|featureUnselected|当模式切换或单击其他地方触发|string|FeatureUnselected|
|drawDone|绘制结束时触发|string|DrawDone|
|featureUpdated|feature编辑完成触发|string|FeatureUpdated|
|featureDeleted|目前只针对点双击选中右键触发|string|FeatureDeleted|
|click|单击事件|string|MouseCallback|
|dblClick|双击事件|string|MouseCallback|
|mouseDown|鼠标按下|string|MouseCallback|
|mouseMove|鼠标移动|string|MouseCallback|
|mouseUp|鼠标抬起|string|MouseCallback|
|mouseOut|鼠标移出|string|MouseCallback|
|mouseOver|鼠标进入|string|MouseCallback|

**BoundsChanged**
```javascript
// define
callback: () => void
// demo
gMap.events.on('boundsChanged', callback);
```

**FeatureSelected**
```javascript
// define
callback: (feature: Feature) => void
// demo
gMap.events.on('featureSelected', callback);
```

**FeatureUnselected**
```javascript
// define
callback: (feature: Feature) => void
// demo
gMap.events.on('featureUnselected', callback);
```

**DrawDone**
```javascript
// define
callback: (mapMode: EMapMode, shape) => void
// demo
gMap.events.on('drawDone', callback);
```

**FeatureUpdated**
```javascript
// define
callback: (feature: Feature, shape) => void
// demo
gMap.events.on('featureUpdated', callback);
```

**FeatureDeleted**
```javascript
// define [目前只针对点在选中态右键触发]
callback: (feature:PointFeature) => void
// demo
gMap.events.on('featureDeleted', callback);
```

**MouseCallback**
```javascript
// define
callback: (point:IBasePoint) => void
// demo
gMap.events.on('click', callback);
```

**IBasePoint**

|参数|说明|类型|
|---|---|---|
|screen|屏幕坐标|IPoint|
|global|实际坐标|IPoint|

## slots
事件拦截器：callback返回值false，会阻断后续流程
```javascript
// define
slots.on(eventType: EEventSlotType, callback: Function);
// demo
// 此示例为双击选中feature对象时阻止系统默认的高亮点样式，改为自定义样式
// gMap.slots.on('drawActivePoint', (point, overLayerInstance) => {
gMap.slots.on('drawActiveMiddlePoint', (point, overLayerInstance) => {
    overLayerInstance.addCircleFeature(
        {sr: 3.5, cx: point.x, cy: point.y},
        {
            clear: false,
            style: {strokeStyle: '#00f', fillStyle: '#00f', stroke: true, fill: true, lineWidth: 1}
        }
    );
    return false;
});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|eventType|时间枚举类型|是|--|EEventSlotType|
|callback|回调函数|是|--|Function|

**EEventSlotType**

|参数|说明|类型|callback|
|---|---|---|---|
|drawActivePoint|绘制高亮节点触发|string|DrawActivePoint|
|drawActiveMiddlePoint|绘制高亮节点中间待添加节点触发|string|DrawActiveMiddlePoint|

# AILabel.Layer.Image
图片图层
## 实例化
```javascript
// define
constructor(id: string, image: IImageInfo, props: IObject = {}, style: ILayerStyle = {})
// demo
const gFirstImageLayer = new AILabel.Layer.Image(
   'first-layer-image', // id
   {
       src: 'https://img2.baidu.com/it/u=2053804264,1341330775&fm=26&fmt=auto&gp=0.jpg',
       width: 500, // 图片宽度
       height: 354, // 图片高度
       crossOrigin: false, // 图片是否跨域
       position: { // 图片左上角对应的坐标位置
           x: -250,
           y: 177
       },
       grid: { // 3 * 3
           columns: [{color: '#9370DB'}, {color: '#FF6347'}],
           rows: [{color: '#9370DB'}, {color: '#FF6347'}]
       }
   }, // imageInfo
   {name: '第一个图片图层'}, // props
   {zIndex: 5} // style
);
gMap.addLayer(gFirstImageLayer);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|image|图片配置信息|是|--|IImageInfo|
|props|属性信息|是|--|IObject|
|style|样式|是|--|ILayerStyle|

**IImageInfo**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|src|图片地址|是|--|string|
|width|图片宽度|是|--|number|
|height|图片高度|是|--|number|
|crossOrigin|图片是否跨域，主要用于图片导出时使用, 要根据实际情况设置，当图片导出时，需要图片的responseHeader-CORS设置允许跨域|否|false|boolean|
|position|图片位置|否|{x:0,y:0}|IPoint|
|grid|图片网格|否|{columns: [], rows: []}|IGridInfo|

**IGridInfo**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|columns|列配置|否|[]|IGridItemInfo[]|
|rows|行配置|否|[]|IGridItemInfo[]|

**IGridItemInfo**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|color|线颜色|否|'#333333'|string|
|width|线宽|否|1|number|

**ILayerStyle**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|zIndex|层级|否|1|number|
|opacity|透明度|否|1.0|number|

## updateGrid
更新网格
```javascript
// define
updateGrid(gridInfo: IGridInfo)
// demo
gFirstImageLayer.updateGrid({columns: [{color: '#333'}], rows: [{color: '#666'}]});
```

## events
事件监听
```javascript
// define
events.on(eventType: ELayerImageEventType, callback: Function);
// demo
gFirstImageLayer.events.on('loadStart', (url, instance) => {
   console.log('--loadStart--');
});
gFirstImageLayer.events.on('loadEnd', (url, instance) => {
   console.log('--loadEnd--');
});
gFirstImageLayer.events.on('loadError', (url, instance) => {
   console.log('--loadError--');
});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|eventType|时间枚举类型|是|--|ELayerImageEventType|
|callback|回调函数|是|--|Function|

**ELayerImageEventType**

|参数|说明|类型|
|---|---|---|
|loadStart|图片开始加载|LoadStart|
|loadEnd|加载成功|LoadEnd|
|loadError|加载失败|LoadError|

# AILabel.Layer.Feature
矢量图层（用于承载Feature.Point, Feature.Line, Feature.Polyline, Feature.Polygon, Feature.Rect, Feature.Circle等矢量要素的展示）
## 实例化
```javascript
// define
constructor(id: string, props: IObject = {}, style: ILayerStyle = {})
// demo
const gFirstFeatureLayer = new AILabel.Layer.Feature(
   'first-layer-feature', // id
   {name: '第一个矢量图层'}, // props
   {zIndex: 10} // style
);
gMap.addLayer(gFirstFeatureLayer);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|props|属性信息|是|--|IObject|
|style|样式|是|--|ILayerStyle-上文|

## addFeature
添加矢量要素（Feature.Point, Feature.Line, Feature.Polyline, Feature.Polygon, Feature.Rect, Feature.Circle等）
```javascript
// define
addFeature(feature: Feature, option?: IFeatureAddOption)
// demo (AILabel.Feature.Polygon见下文)
const gFirstFeaturePolygon = new AILabel.Feature.Polygon(
   'first-feature-polygon', // id
   {points: [
       {x: 0, y: 0}, {x: 100, y: 100},
       {x: 100, y: 200}
   ]}, // shape
   {name: '第一个多边形'}, // props
   {strokeStyle: '#FFD500', lineWidth: 1} // style
);
gFirstFeatureLayer.addFeature(gFirstFeaturePolygon);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|feature|待添加feature|是|--|Feature|
|option|可选配置项|否|{clear: false}|IFeatureAddOption|

**IFeatureAddOption**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|clear|添加feature是否清空当前layer上已存在的features|否|false|boolean|

## removeFeatureById
移除指定featureId的feature
```javascript
// define
removeFeatureById(targetFeatureId: string)
// demo
const polygonFeature = new AILabel.Feature.Polygon(...);
gFirstFeatureLayer.addFeature(polygonFeature);
gFirstFeatureLayer.removeFeatureById(polygonFeature.id);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|targetFeatureId|待删除feature-id|是|--|string|

## getFeatureById
获取指定featureId的feature，如果没有，则返回null
```javascript
// define
getFeatureById(targetFeatureId: string)
// demo
const polygonFeature = new AILabel.Feature.Polygon(...);
gFirstFeatureLayer.addFeature(polygonFeature);
gFirstFeatureLayer.getFeatureById(polygonFeature.id);
```

## getAllFeatures
获取当前Layer.Feature上的所有features
```javascript
// define
getAllFeatures(): Feature[]
// demo
const polygonFeature = new AILabel.Feature.Polygon(...);
gFirstFeatureLayer.addFeature(polygonFeature);
const allFeatures = gFirstFeatureLayer.getAllFeatures();
```

## removeAllFeatures
移出当前featureLayer上所有features
```javascript
// define
removeAllFeatures()
// demo
const polygonFeature = new AILabel.Feature.Polygon(...);
gFirstFeatureLayer.addFeature(polygonFeature);
gFirstFeatureLayer.removeAllFeatures();
```

## getTargetFeatureWithPoint
根据point获取捕捉到的features中第一个，如果没有则返回null
```javascript
// define
getTargetFeatureWithPoint(point: IPoint): Feature | null
// demo
gFirstFeatureLayer.getTargetFeatureWithPoint({x,y});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|point|targetPoint点|是|--|IPoint|

# AILabel.Layer.Marker
注记层【注：此层为Map内置图层，不对外暴露二次开发进行实例】；
gMap.markerLayer即为AILabel.Layer.Marker
## 实例化
内置实例，不需要进行二次开发进行实例

## addMarker
添加marker注记
```javascript
// define
addMarker(marker: Marker, option?: IObject)
// demo
const marker = new AILabel.Marker(...);
gMap.markerLayer.addMarker(marker);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|marker|待添加marker|是|--|AILabel.Marker|
|option|保留字段|否|--|IObject|

## removeMarkerById
移除指定markerId的marker
```javascript
// define
removeMarkerById(targetMarkerId: string)
// demo
const marker = new AILabel.Marker(...);
gMap.markerLayer.addMarker(marker);
gMap.markerLayer.removeMarkerById(marker.id);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|targetMarkerId|待删除marker-id|是|--|string|

## getMarkerById
获取指定markerId的marker，如果没有，则返回null
```javascript
// define
getMarkerById(targetMarkerId: string)
// demo
const marker = new AILabel.Marker(...);
gMap.markerLayer.addMarker(marker);
gMap.markerLayer.getMarkerById(marker.id);
```
## getAllMarkers
获取Layer.Marker上的所有markers
```javascript
// define
getAllMarkers(): Marker[]
// demo
const marker = new AILabel.Marker(...);
gMap.markerLayer.addMarker(marker);
const allMarkers = gMap.markerLayer.getAllMarkers();
```

## removeAllMarkers
移除所有markers
```javascript
// define
removeAllMarkers()
// demo
const marker = new AILabel.Marker(...);
gMap.markerLayer.addMarker(marker);
gMap.markerLayer.removeAllMarkers();
```

# AILabel.Layer.Text
文本图层，显示文本对象
## 实例化
```javascript
// define
constructor(id: string, props: IObject = {}, style: ILayerStyle = {})
// demo
const gFirstTextLayer = new AILabel.Layer.Text(
   'first-layer-text', // id
   {name: '第一个文本图层'}, // props
   {zIndex: 12, opacity: 1} // style
);
gMap.addLayer(gFirstTextLayer);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|props|属性信息|是|--|IObject|
|style|样式|是|--|ILayerStyle-上文|

## addText
添加text文本
```javascript
// define
addText(text: Text, option?: ITextAddOption)
// demo (AILabel.Text见下文)
const text = new AILabel.Text(...);
gFirstTextLayer.addText(text);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|text|待添加text|是|--|Text|
|option|可选配置项|否|{clear: false}|ITextAddOption|

**IFeatureAddOption**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|clear|添加text是否清空当前layer上已存在的texts|否|false|boolean|

## removeTextById
移除指定textId的text
```javascript
// define
removeTextById(targetTextId: string)
// demo
const text = new AILabel.Text(...);
gFirstTextLayer.addText(text);
gFirstTextLayer.removeTextById(text.id);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|targetTextId|待删除text-id|是|--|string|

## getTextById
获取指定textId的text，如果没有，则返回null
```javascript
// define
getTextById(targetTextId: string)
// demo
const text = new AILabel.Text(...);
gFirstTextLayer.addText(text);
gFirstTextLayer.getTextById(text.id);
```

## getAllTexts
获取Layer.Text上的所有texts对象
```javascript
// define
getAllTexts(): Text[]
// demo
const text = new AILabel.Text(...);
gFirstTextLayer.addText(text);
const allTexts = gFirstTextLayer.getAllTexts();
```

## removeAllTexts
移除所有texts
```javascript
// define
removeAllTexts()
// demo
const text = new AILabel.Text(...);
gFirstTextLayer.addText(text);
gFirstTextLayer.removeAllTexts();
```

# AILabel.Layer.Mask
文本图层，显示文本对象
## 实例化
```javascript
// define
constructor(id: string, props: IObject = {}, style: ILayerStyle = {})
// demo
const gFirstMaskLayer = new AILabel.Layer.Mask(
   'first-layer-mask', // id
   {name: '第一个涂抹图层'}, // props
   {zIndex: 11, opacity: .5} // style
);
gMap.addLayer(gFirstMaskLayer);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|props|属性信息|是|--|IObject|
|style|样式|是|--|ILayerStyle-上文|

## addAction
添加涂抹Action，此处我们把绘制【DrawAction】/擦除【ClearAction】/数据回显【ImageAction】定义为action
```javascript
// define
addAction(action: Action, option?: IObject)
// demo (AILabel.Action见下文)
const drawAction = new AILabel.Action.Draw(...);
gFirstMaskLayer.addAction(drawAction);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|action|待添加Action|是|--|Action|
|option|保留字段-可选配置项|否||IObject|

**Action**

|参数|说明|类型|
|---|---|---|
|Draw|涂抹Action|Action.Draw-见下文|
|Clear|擦除Action|Action.Clear-见下文|
|Image|回显数据Action|Action.Image-见下文|

## removeActionById
移除指定action
```javascript
// define
removeActionById(targetActionId: string)
// demo (AILabel.Action见下文)
const drawAction = new AILabel.Action.Draw(...);
gFirstMaskLayer.addAction(drawAction);
gFirstMaskLayer.removeActionById(drawAction.id);
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|targetActionId|待删除action-id|是|--|string|

## removeAllActions
移除所有actions
```javascript
// define
removeAllActions()
// demo (AILabel.Action见下文)
const drawAction = new AILabel.Action.Draw(...);
gFirstMaskLayer.addAction(drawAction);
gFirstMaskLayer.removeAllActions();
```

## getAllActions
获取Layer.Mask上的所有actions
```javascript
// define
getAllActions(): Action[]
// demo (AILabel.Action见下文)
const drawAction = new AILabel.Action.Draw(...);
gFirstMaskLayer.addAction(drawAction);
const allActions = gFirstMaskLayer.getAllActions();
```

## getRleData
根据分类获取分类分类rle数据, 截取某个范围的rle数据
```javascript
// define
getRleData(bounds: IRectShape)
// demo (AILabel.Action见下文)
const imageAction = new AILabel.Action.Image(...);
const drawAction = new AILabel.Action.Draw(...);
const clearAction = new AILabel.Action.Clear(...);
gFirstMaskLayer.addAction(imageAction);
gFirstMaskLayer.addAction(drawAction);
gFirstMaskLayer.addAction(clearAction);
const rleData = gFirstMaskLayer.getRleData({x: -250, y: 177, width: 500, height: 354});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|bounds|矩形范围|是|--|IRectShape-见上文|

# AILabel.Feature
Feature.Point, Feature.Line, Feature.Polyline, Feature.Polygon, Feature.Rect, Feature.Circle等子类的基类
## 实例化
子类复写构造函数

## updateShape
改变矢量要素shape信息
```javascript
// define
updateShape(shape: IFeatureShape)
// demo
const feature = new AILabel.Feature.Point(...);
feature.updateShape(newPointShape)
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|shape|待更新的图形shape信息|是|--|IFeatureShape|

**IFeatureShape枚举**

|参数|说明|类型|
|---|---|---|
|shape|待更新的图形shape信息|IFeatureShape|

## setStyle
设置feature样式
```javascript
// define
setStyle(style: IFeatureStyle, option?: IObject)
// demo
const feature = new AILabel.Feature.Point(...);
feature.setStyle({fillStyle: '#FF0000'});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|style|待更新的图形style|是|--|IFeatureStyle|
|option|保留字段-可选配置项|否|--|IObject|

## captureWithPoint
判断point是否捕捉到当前feature
```javascript
// define
captureWithPoint(point: IPoint): boolean
// demo
const feature = new AILabel.Feature.Point(...);
const isCaptured = feature.captureWithPoint{x, y};
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|point|捕捉点|是|--|IPoint|

# AILabel.Feature.Point
点对象【实心】
## 实例化
```javascript
// define
constructor(id: string, shape: IPointShape, props: IObject = {}, style: IFeatureStyle = {}, option?: IObject)
// demo
const gFirstFeaturePoint = new AILabel.Feature.Point(
   'first-feature-point', // id
   {x: -100, y: -100, sr: 3}, // shape
   {name: '第一个点'}, // props
   {fillStyle: '#00f'} // style
);
gFirstFeatureLayer.addFeature(gFirstFeaturePoint);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IPointShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|
|option|保留字段可选配置项|否|--|IObject|

**IPointShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|x|坐标x|是|--|number|
|y|坐标y|是|--|number|
|r|半径（实际坐标系半径，会伴随放大缩小变化）|否|--|number|
|sr|半径（屏幕坐标系半径，不会伴随放大缩小变化）|否|--|number|
注：r 和 sr 【sr与r只会存在一个，如果同时存在，r优先级高】

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Feature.Line
线段对象
## 实例化
```javascript
// define
constructor(id: string, shape: ILineShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const gFirstFeatureLine = new AILabel.Feature.Line(
   'first-feature-line', // id
   {start: {x: 10, y: 10}, end: {x: 100, y: -100}, width: 10}, // shape
   {name: '第一个线段'}, // props
   {strokeStyle: '#FF4500', lineCap: 'round'} // style
);
gFirstFeatureLayer.addFeature(gFirstFeatureLine);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|ILineShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**ILineShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|start|起点|是|--|IPoint-见上文|
|end|终点|是|--|IPoint-见上文|
|width|线宽（实际坐标系宽）；如果不设置，将会取style-lineWidth绘制|否|--|number|

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Feature.Polyline
多段线对象
## 实例化
```javascript
// define
constructor(id: string, shape: IPolylineShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const polylineFeature = new AILabel.Feature.Polyline(
  'first-feature-polyline', // id
  {points: data, width}, // shape
  {name: '第一个矢量图层'}, // props
  drawingStyle // style
);
gFirstFeatureLayer.addFeature(polylineFeature);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IPolylineShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**IPolylineShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|points|多段线节点集合|是|--|IPoint[]-见上文|
|width|线宽（实际坐标系宽）；如果不设置，将会取style-lineWidth绘制|否|--|number|

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Feature.Rect
矩形对象
## 实例化
```javascript
// define
constructor(id: string, shape: IRectShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const gFirstFeatureRect = new AILabel.Feature.Rect(
   'first-feature-rect', // id
   {x: -50, y: 50, width: 100, height: 100}, // shape
   {name: '第一个矢量图层'}, // props
   {strokeStyle: '#808080', lineWidth: 1} // style
);
gFirstFeatureLayer.addFeature(gFirstFeatureRect);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IRectShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**IRectShape**
见上文

## getPoints
获取矩形四个顶点坐标集合
```javascript
// define
getPoints(): IPoint[]
// demo
const gFirstFeatureRect = new AILabel.Feature.Rect(...);
const rectPoints = gFirstFeatureRect.getPoints();
```

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Feature.Polygon
多边形对象
## 实例化
```javascript
// define
constructor(id: string, shape: IPolygonShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const gFirstFeaturePolygon = new AILabel.Feature.Polygon(
   'first-feature-polygon', // id
   {points: [
       {x: 0, y: 0}, {x: 100, y: 100},
       {x: 100, y: 200}
   ]}, // shape
   {name: '第一个多边形'}, // props
   {strokeStyle: '#FFD500', lineWidth: 1} // style
);
gFirstFeatureLayer.addFeature(gFirstFeaturePolygon);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IPolygonShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**IPolygonShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|points|多边形顶点集合|是|--|IPoint[]-见上文|
|inner|保留字段|否|--|[]|

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Feature.Circle
圆对象
## 实例化
```javascript
// define
constructor(id: string, shape: ICircleShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const gFirstFeatureCircle = new AILabel.Feature.Circle(
   'first-feature-circle', // id
   {cx: 0, cy: 0, r: 100}, // shape
   {name: '第一个矢量图层'}, // props
   {fillStyle: '#F4A460', strokeStyle: '#D2691E', globalAlpha: 1} // style
);
gFirstFeatureLayer.addFeature(gFirstFeatureCircle);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|ICircleShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**ICircleShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|cx|坐标x|是|--|number|
|cy|坐标y|是|--|number|
|r|半径（实际坐标系半径，会伴随放大缩小变化）|否|--|number|
|sr|半径（屏幕坐标系半径，不会伴随放大缩小变化）|否|--|number|
注：r 和 sr 【sr与r只会存在一个，如果同时存在，r优先级高】

## updateShape
见AILabel.Feature

## setStyle
见AILabel.Feature

## captureWithPoint
见AILabel.Feature

# AILabel.Action
Action.Draw, Action.Clear, Action.Image等子类的基类
## 实例化
子类复写构造函数

# AILabel.Action.Draw
涂抹对象【众所周知，涂抹/擦除的动作分为down->move->up，实际上绘制的就是一条具有宽度的具有多个点的多段线】
## 实例化
```javascript
// define
constructor(id: string, category: string, shape: IDrawActionShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const drawMaskAction = new AILabel.Mask.Draw(
  'first-action-draw', // id
  '铅笔',
  {points: data, width}, // shape
  {name: '港币', price: '1元'}, // props
  {strokeStyle: '#FF0000'} // style
);
gFirstMaskLayer.addAction(drawMaskAction);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|category|当前action类型|是|--|string|
|shape|空间信息|是|--|IDrawActionShape|
|props|属性信息|是|--|IObject|
|style|样式|是|--|IFeatureStyle-上文|

**IDrawActionShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|points|多段线节点集合|是|--|IPoint[]-见上文|
|width|线宽（实际坐标系宽）；如果不设置，将会取style-lineWidth绘制涂抹|否|--|number|

## setStyle
设置action样式【除Action.Image】
```javascript
// define
setStyle(style: IFeatureStyle, option?: IObject)
// demo
const drawAction = new AILabel.Action.Draw(...);
drawAction.setStyle({strokeStyle: '#FF0000'});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|style|待更新的图形style|是|--|IFeatureStyle|
|option|保留字段-可选配置项|否|--|IObject|

# AILabel.Action.Clear
涂抹擦除对象【众所周知，涂抹/擦除的动作分为down->move->up，实际上绘制的就是一条具有宽度的具有多个点的多段线】
## 实例化
```javascript
// define
constructor(id: string, shape: IDrawActionShape, props: IObject = {}, style: IFeatureStyle = {})
// demo
const clearMaskAction = new AILabel.Mask.Clear(
  'first-action-clear', // id
  {points: data, width} // shape
);
gFirstMaskLayer.addAction(clearMaskAction);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IDrawActionShape|
|props|原则上不需要|否|--|IObject|
|style|原则上不需要|否|--|IFeatureStyle-上文|

**IDrawActionShape**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|points|多段线节点集合|是|--|IPoint[]-见上文|
|width|线宽（实际坐标系宽）；如果不设置，将会取style-lineWidth绘制擦除|否|--|number|

# AILabel.Action.Image
涂抹数据的回显时，如果返回rle数据，前端需要需要进行像素级处理，此时相当耗性能，此对象的设计就是为了既能满足涂抹数据的回显，又能尽可能最大的优化性能而产生；
注：对后端要求：需要按照把每一个分类涂抹rle数据生成图片指定大小的二值.png图片
## 实例化
```javascript
// define
constructor(id: string, category: string, image: IImageInfo, props: IObject = {}, style: IFeatureStyle = {})
// demo
const gFirstMaskImageAction = new AILabel.Mask.Image(
   'first-image-action', // id
   '钢笔',
   {
       src: './mask_min.png',
       width: 500,
       height: 354,
       crossOrigin: false,
       position: { // 图片左上角坐标
           x: -250,
           y: 177
       }
   }, // imageInfo
   {}
);
gFirstMaskLayer.addAction(gFirstMaskImageAction);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|shape|空间信息|是|--|IImageInfo|
|props|属性信息|否|--|IObject|
|style|原则上不需要|否|--|IFeatureStyle-上文|

**IImageInfo**
见上文

# AILabel.Marker
注记marker对象
## 实例化
```javascript
// define
constructor(id: string, marker: IMarkerInfo, props: IObject = {}, option: IObject = {})
// demo
const gFirstMarker = new AILabel.Marker(
   'first-marker', // id
   {
       src: './marker.png',
       position: { // marker坐标位置
           x: 0,
           y: 0
       },
       offset: {
           x: -16,
           y: 32
       }
   }, // markerInfo
   {name: '第一个marker注记'} // props
);
gMap.markerLayer.addMarker(gFirstMarker);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|marker|marker信息|是|--|IMarkerInfo|
|props|属性信息|否|--|IObject|
|option|保留字段|否|--|IObject|

**IMarkerInfo**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|src|icon路径|是|--|string|
|position|位置信息|是|--|IPoint|
|offset|偏移量（屏幕坐标）|否|{x: 0, y: 0}|IPoint|

## enableDragging
启用marker可拖拽【默认不可拖拽】
```javascript
// define
enableDragging(): void
// demo
const gFirstMarker = new AILabel.Marker(...);
gFirstMarker.enableDragging();
```

## disableDragging
禁用marker可拖拽【默认不可拖拽】
```javascript
// define
disableDragging(): void
// demo
const gFirstMarker = new AILabel.Marker(...);
gFirstMarker.disableDragging();
```

## updatePosition
更新marker的位置
```javascript
// define
updatePosition(position: IPoint)
// demo
const gFirstMarker = new AILabel.Marker(...);
gFirstMarker.updatePosition({x: 0, y: 0});
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|position|位置信息|是|--|IPoint|

## events
事件监听
```javascript
// define
events.on(eventType: EMarkerEventType, callback: Function);
// demo
marker.events.on('click', () => {console.log('marker clicked')});
```

**params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|eventType|时间枚举类型|是|--|EMarkerEventType|
|callback|回调函数|是|--|Function|

**EMarkerEventType**

|参数|说明|类型|
|---|---|---|---|
|click|单击事件|string|
|mouseDown|mouseDown事件|string|
|mouseUp|mouseUp事件|string|
|mouseOver|鼠标移入|string|
|mouseOut|鼠标移出|string|
|dragStart|拖拽前|string|
|dragging|拖拽中|string|
|dragEnd|拖拽结束（会返回拖拽后的最新位置信息）|string|
|rightClick|右键单击|string|

# AILabel.Text
text文本对象
## 实例化
```javascript
// define
constructor(id: string, text: ITextInfo, props: IObject = {}, style: ITextStyle = {})
// demo
const gFirstText = new AILabel.Text(
   'first-text', // id
   {text: '中华人民共和国', position: {x: 0, y: 0}, offset: {x: 0, y: 0}}, // shape
   {name: '第一个文本对象'}, // props
   {fillStyle: '#F4A460', strokeStyle: '#D2691E', background: true, globalAlpha: 1, fontColor: '#0f0'} // style
);
gFirstTextLayer.addText(gFirstText);
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|id|唯一标识|是|--|string|
|text|text信息|是|--|ITextInfo|
|props|属性信息|否|--|IObject|
|style|样式信息|否|--|ITextStyle|

**ITextInfo**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|text|text文字|是|--|string|
|position|位置信息|是|--|IPoint|
|offset|偏移量（屏幕坐标）|否|{x: 0, y: 0}|IPoint|

**ITextStyle**、
继承自IFeatureStyle，新增属性字段如下

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|background|是否展示文字背景|否|--|boolean|
|fontColor|字体颜色|否|--|string|

## updatePosition
更新text的位置
```javascript
// define
updatePosition(position: IPoint)
// demo
const gFirstText = new AILabel.Text(...);
gFirstText.updatePosition({x: 0, y: 0});
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|position|位置信息|是|--|IPoint|

## updateText
更新text的文本
```javascript
// define
updateText(text: string)
// demo
const gFirstText = new AILabel.Text(...);
gFirstText.updateText('中华人民共和国');
```

**Params**

|参数|说明|是否必填|默认|类型|
|---|---|---|---|---|
|text|待更新文本|是|--|string|

# AILabel.Util
通用工具方法
## MathUtil.getMiddlePoint
获取两点之间的中心点
```javascript
getMiddlePoint(start: IPoint, end: IPoint): IPoint
```

## MathUtil.distance
计算两点之间的距离
```javascript
distance(start: IPoint, end: IPoint): number
```

## EventUtil.getButtonIndex
获取鼠标左右键index
```javascript
getButtonIndex(event: MouseEvent): number
```

# 联系作者
## author

- author: 丁扬
- email: dingyang9642@126.com
- wx: dingyang9642
- qq: 378301400

# 开源协议

## Apache License

请遵循：Apache License 2.0

