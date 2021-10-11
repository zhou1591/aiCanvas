import _assign from 'lodash/assign';

import {IObject, IPoint} from '../gInterface';

import Map from '../gMap';

import {EControlType} from './gEnum';
export default class Control {
    // controlId
    public id: string
    // controlType
    public type: EControlType
    // control位置
    public position: IPoint
    // props属性
    public props: IObject
    // option属性
    public option: IObject

    // props: domId
    public domId: string
    public dom: HTMLElement

    // control-container
    public map: Map

    // function: constructor
    constructor(id: string, type: EControlType, props?: IObject, option?: IObject) {
        this.id = id;
        this.type = type;
        this.props = props || {};
        this.option = option || {};

        this.domId = `control-grid-${id}-wrapper`;
        this.createContainer();
    }

    createContainer() {
        if (!this.dom) {
            this.dom = document.createElement('div');
            this.dom.setAttribute('id', this.domId);
            this.dom.style.position = 'absolute';
            this.dom.style.left = '0';
            this.dom.style.top = '0';
            this.dom.style.zIndex = '20';
        }
    }

    // function: trigger when control add to map
    onAdd(map: Map): void {
        // 首先判断当前layer是否已经被添加至map对象中
        this.map = map;
        this.map.dom.appendChild(this.dom);
    }

    // trigger when control remove from map
    // map exits first
    onRemove(): void {
        const controlElement = document.getElementById(this.domId);
        controlElement && controlElement.remove();
    }

    //
    updatePosition(position: IPoint) {
        this.position = position;
        this.refresh();
    }

    // 刷新当前数据
    refresh() {}

    // 打印测试输出
    printInfo() {

    }
}
