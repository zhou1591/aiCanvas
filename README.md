# AILabel

## 定义
AILabel类库是一款集打点、线段、多段线、矩形、多边形、圆圈、涂抹等多标注形式于一体，附加文本（Text）、标记（Marker）、缩略图（EagleMap）、Scale（比例尺）等控件以及Util等辅助工具的在线Web端标注工具库。目前已被广泛应用于多标注项目中。

## 文档

源代码（star点起来）：https://github.com/dingyang9642/AILabel<br/>
API文档：http://ailabel.com.cn/public/ailabel/api/index.html<br/>
Demo文档：http://ailabel.com.cn/public/ailabel/demo/index.html<br/>
Demo1文档：http://ailabel.com.cn/public/ailabel/demo/label/index.html<br/>
npm地址：https://www.npmjs.com/package/ailabel<br/>

老版API文档（小于v5.0.0）：https://dingyang9642.github.io/AILabel/old_version_docs/#/<br/>

## 目录结构
- libs: AILabel源码
- demo: AILabel-demo
- doc: AILabel-api文档
- website: AILabel官网【待开发】

## 环境安装及运行

**libs**
> npm i<br/>
> npm run dev // 启动rollup<br/>
> open demo->index.html<br/>

**doc**
> npm i<br/>
> npm run build<br/>

## 快速开始

**第一个小栗子**

图片层的添加

```javascript
// 声明容器
const gMap =new AILabel.Map(CONTAINER_ID, {
    center: {x: 250, y: 177},
    zoom: 800,
    mode: 'PAN' // 绘制线段
});

// 显示一张图片
const gFirstImageLayer = new AILabel.Layer.Image(
    'first-layer-image', // id
    {
        src: image.src,
        width: image.width,
        height: image.height,
        position: { // 图片左上角坐标
            x: 0,
            y: 0
        }
    }, // imageInfo
    {name: '第一个图片图层'}, // props
    {zIndex: 5} // style
);
gMap.addLayer(gFirstImageLayer);
```

**图形绘制/编辑**

多边形绘制编辑举例

```javascript
// 添加矢量图层（用于展示矢量图形）
const gFirstFeatureLayer = new AILabel.Layer.Feature(
    'first-layer-feature', // id
    {name: '第一个矢量图层'}, // props
    {zIndex: 10} // style
);
gMap.addLayer(gFirstFeatureLayer);

// gMap实例添加events事件监听
gMap.events.on('drawDone', (type: EMapMode, data) => {
    if (type === 'POLYGON') {
        const polygonFeature = new AILabel.Feature.Polygon(
            `${+new Date()}`, // id
            {points: data}, // shape
            {name: '矢量图形'}, // props
            drawingStyle // style
        );
        gFirstFeatureLayer.addFeature(polygonFeature);
    }
    else if (...) {
        // 其他类型Feature绘制完成处理
    }
}
```

## TODO
- P0: 增加配置项支持绘制过程中右键拖拽
- P0: 箭头直线类型支持

- P0: Control.Scale 开发
- P0: Control.EagleMap 开发
- P0: ROI 开发
- P1: Feature.Rect 支持中心展示十字丝
- P1: Feature.Rect 旋转
- P2: Layer.Image 旋转
- P3: 3D 支持
- ...

## 开源协议
请遵循：Apache License 开源协议
