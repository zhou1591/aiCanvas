// 四叉树
// 默认创建

import _isNumber from 'lodash/isNumber';
import Feature from './feature/gFeature';

import {IRectShape} from "./feature/gInterface";

export default class QTree {
    // 当前节点上包含的对象
    public features: Feature[] = []

    // 四叉树bounds
    public bounds: IRectShape

    // 当前的level层级
    public level:number = 0

    // 当前节点包含的子节点
    public nodes: QTree[] = []

    // function: constructor： 默认创建3层
    constructor(bounds: IRectShape, level: number) {
        this.bounds = bounds;
        _isNumber(level) && (this.level = level);
    }

    // 当前节点的子节点
    split() {
        const {x, y, width, height} = this.bounds;
        const subWidth = width / 2;
        const subHeight = height / 2;
        const sublevel = this.level + 1;
        // 第一象限
        this.nodes.push(new QTree({x: x + subWidth, y, width: subWidth, height: subHeight}, sublevel));
        // 第二象限
        this.nodes.push(new QTree({x, y, width: subWidth, height: subHeight}, sublevel));
        // 第三象限
        this.nodes.push(new QTree({x, y: y - subHeight, width: subWidth, height: subHeight}, sublevel));
        // 第四象限
        this.nodes.push(new QTree({x: x + subWidth, y: y - subHeight, width: subWidth, height: subHeight}, sublevel));
    }

}
