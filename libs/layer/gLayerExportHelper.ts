import _forEach from 'lodash/forEach';
import _assign from 'lodash/assign';
import _last from 'lodash/last';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import _filter from 'lodash/filter';
import _uniq from 'lodash/uniq';

import {IPoint, ISize} from '../gInterface';

import CanvasLayer from './gLayerCanvas';
import {IRectShape} from '../feature/gInterface';
import Feature from '../feature/gFeature';
import Text from '../text/gText';
import ImageLayer from './gLayerImage';
import Graphic from '../gGraphic';

export type IObjectItem = Feature | Text;

// 格式
const IMAGE_FORMAT = {
    BASE64: 'base64',
    BLOB: 'blob'
};

export default class ExportHelperLayer  {
    public bounds: IRectShape // canvas大小

    public canvas: HTMLCanvasElement
    public canvasContext: CanvasRenderingContext2D

    public objects: Array<IObjectItem> = [] // 当前maskLayer中所有的actions

    // 伪造map对象，给feature使用
    public map = {
        // 空属性/方法
        activeFeature: null,
        setActiveFeature() {},
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

    // override 创建Canvas层
    createRenderCanvas() {
        const {width, height} = this.bounds;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width * CanvasLayer.dpr;
        this.canvas.height = height * CanvasLayer.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.canvasContext = this.canvas.getContext('2d');
        Graphic.drawRect(
            this.canvasContext,
            {x: 0, y: 0, width: this.canvas.width, height: this.canvas.height},
            {fill: true, fillStyle: '#fff', stroke: false}
        );
    }

    // 添加object至当前HelperLayer中
    addObject(object: IObjectItem) {
        object.onAdd(this);
        this.objects.push(object);
    }

    // 添加objects至当前HelperLayer中
    addObjects(objects: Array<IObjectItem>) {
        _forEach(objects, (object: IObjectItem) => this.addObject(object));
    }

    // 添加imag至当前canvas
    putImage(image: HTMLImageElement) {
        this.canvasContext.drawImage(image, 0, 0);
    }

    // 添加图片
    addImageLayer(imageLayer: ImageLayer) {
        // 执行坐标转换
        const {x: screenX, y: screenY} = this.map.transformGlobalToScreen(imageLayer.position);

        const dpr = CanvasLayer.dpr;
        const scale = this.map.getScale();
        const {width, height} = imageLayer.imageInfo;
        const screenWidth = width * scale;
        const screenHeight = height * scale;

        (imageLayer.image && imageLayer.imageSuccess) && Graphic.drawImage(
            this.canvasContext,
            {
                image: imageLayer.image,
                x: screenX * dpr,
                y: screenY * dpr,
                width: screenWidth * dpr,
                height: screenHeight * dpr
            },
            {}
        );
    }

    /**
     * type: 输出类型，目前支持base64/blob两种格式
     * format: 图片格式： ‘image/png ｜ image/jpeg’,
     * quality：图片质量
     */
    convertCanvasToImage(type: string, format: string, quality: number) {
        if (type === IMAGE_FORMAT.BASE64) {
            return this.convertCanvasToBase64(format, quality);
        }
        else if (type === IMAGE_FORMAT.BLOB) {
            return this.convertCanvasToBlob(format, quality);
        }

        return new Promise((resolve, reject) => {
            reject(new Error('export params error：' + type));
        });
    }

    // 转blob
    convertCanvasToBlob(format: string, quality: number) {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(blob => {
                this.canvas = null;
                const {width, height} = this.bounds;
                this.resizeBlobImage(blob, {width, height}, format, resolve, reject);
            }, format, quality);
        });
    }
    // 重设图片大小
    resizeBlobImage(blob: Blob, size: ISize, format: string = 'image/png', resolve: Function, reject: Function) {
        const image = new Image();
        const url = URL.createObjectURL(blob);
        image.src = url;

        // create an off-screen canvas
        const {width, height} = size;
        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // set its dimension to target size
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        image.onload = () => {
            // no longer need to read the blob so it's revoked
            URL.revokeObjectURL(url);
            // drawImage
            ctx.drawImage(image, 0, 0, width, height);
            canvas.toBlob(blob => {
                canvas = null;
                resolve(blob);
            }, format, 1);
        };
        image.onerror = () => {
            reject(new Error('resize image error'));
        };
    }


    // 转base64
    convertCanvasToBase64(format: string, quality: number) {
        // 获取base64
        let base64 = this.canvas.toDataURL(format);
        // 释放内存
        this.canvas = null;
        // resize图片大小（因为dpr的存在，会导致大小变成dpr倍）
        const {width, height} = this.bounds;
        return this.resizeBase64Image(base64, {width, height}, format);
    }

    // 重设图片大小
    resizeBase64Image(base64: string, size: ISize, format: string = 'image/png') {
        const image = new Image();
        image.src = base64;

        // create an off-screen canvas
        const {width, height} = size;
        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // set its dimension to target size
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        return new Promise((resolve, reject) => {
            image.onload = () => {
                // drawImage
                ctx.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL(format));
            };
            image.onerror = () => {
                reject(new Error('resize image error'));
            };
        });
    }

    // @override
    refresh() {
        // 绘制objects中所有object对象
        _forEach(this.objects, (object: IObjectItem) => object.refresh());
    }

    // 清空canvas画布
    clear() {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // // 格式转换
    // _fixImageType(format: string) {
    //     format = format.toLowerCase().replace(/jpg/i, 'jpeg');
    //     const r = format.match(/png|jpeg|bmp|gif/)[0];
    //     return 'image/' + r;
    // }

    // // 测试图片下载
    // _testImageDownload(downloadUrl: string, fileName: string = 'export.png'){
    //     let aLink = document.createElement('a');
    //     aLink.style.display = 'none';
    //     aLink.href = downloadUrl;
    //     aLink.download = fileName;
    //     // 触发点击-然后移除
    //     document.body.appendChild(aLink);
    //     aLink.click();
    //     document.body.removeChild(aLink);
    // }
}
