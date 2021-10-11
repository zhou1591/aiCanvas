import _assign from 'lodash/assign';

import {IObject} from '../gInterface';
import {ILayerStyle} from './gInterface';
import Map from '../gMap';
import {ELayerType} from './gEnum';

export default class Layer {
    // layerId
    public id: string
    // layerType
    public type: ELayerType
    // props
    public props: IObject

    // props: domId
    public domId: string
    public dom: HTMLElement

    /**
     * props: map可选配置项
     * defaultMapOptions: 默认配置项
     * mapOptions: userMapOptions merge defaultMapOptions
    */
    static defaultStyle: ILayerStyle = {
        zIndex: 1,
        opacity: 1.0
    }
    public style: ILayerStyle

    // layer-container
    public map: Map

    // function: constructor
    constructor(id: string, type: ELayerType, props: IObject = {}, style: ILayerStyle = {}) {
        this.id = id;
        this.type = type;
        this.props = props;

        this.style = _assign({}, Layer.defaultStyle, style);
        this.domId = `layer-${id}-wrapper`;
        this.setDom();
    }

    // 创建容器dom元素div
    setDom() {
        if (!this.dom) {
            this.dom = document.createElement('div');
            this.dom.setAttribute('id', this.domId);
            this.dom.style.position = 'absolute';
            this.dom.style.left = '0';
            this.dom.style.top = '0';
        }
        const {zIndex, opacity} = this.style;
        this.dom.style.zIndex = `${zIndex}`;
        this.dom.style.opacity = `${opacity}`;
    }

    // function: trigger when layer add to map
    onAdd(map: Map): void {
        // 首先判断当前layer是否已经被添加至map对象中
        this.map = map;
        this.resize();
    }

    // trigger when layer remove from map
    // map exits first
    onRemove(): void {
        const layerElement = document.getElementById(this.domId);
        layerElement && layerElement.remove();
        this.map = null;
    }

    // 当容器变化时，需要调用触发
    // 以来map:getSize大小进行当前layer的resize
    resize() {
        const {width, height} = this.map.getSize();
        this.dom.style.width = `${width}px`;
        this.dom.style.height = `${height}px`;
    }

    // 刷新当前数据
    // 各子类各自实现
    refresh(refreshDelay: boolean = false) {}

    // 重新resize和刷新
    resizeAndRefresh() {
        this.resize();
        this.refresh();
    }

    // 打印测试输出
    printInfo() {

    }
}
