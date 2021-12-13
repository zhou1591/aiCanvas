
/**
 * @user: zjs
 * @Date: 2021-12-13 15:39:33
 * @description: 计算不规则多边形面积
 * @param {*} vertices XY坐标数组
 */
export function calcPolygonArea({points}) {
  let total = 0;
  for (let i = 0, l = points.length; i < l; i++) {
    const addX = points[i].x;
    const addY = points[i == points.length - 1 ? 0 : i + 1].y;
    const subX = points[i == points.length - 1 ? 0 : i + 1].x;
    const subY = points[i].y;

    total += (addX * addY * 0.5);
    total -= (subX * subY * 0.5);
  }

  return Math.abs(total);
}
/**
 * @user: zjs
 * @Date: 2021-12-13 16:45:19
 * @description: 计算圆面积
 */

export function calcCircleArea({ r }) {
  return Math.PI * Math.pow(r, 2);
}
/**
 * @user: zjs
 * @Date: 2021-12-13 16:45:19
 * @description: 计算矩形面积
 */

export function calcRectArea({ width, height }) {
  return width * height
}