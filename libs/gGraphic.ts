//
import _assign from 'lodash/assign';
import _forEach from 'lodash/forEach';
import _isFunction from 'lodash/isFunction';
import _isNumber from 'lodash/isNumber';
import _includes from 'lodash/includes';
import _isBoolean from 'lodash/isBoolean';

import {IObject, IPoint} from './gInterface';
import {ICircleShape, IFeatureStyle, ILineShape, IPointShape, IPolylineShape, IRectShape} from './feature/gInterface';
import {IGImage} from './layer/gInterface';
import CanvasLayer from './layer/gLayerCanvas';
import {ITextInfo, ITextStyle} from './text/gInterface';
import { ECanvasTextBaseLine } from './gEnum';

export type CanvasContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export default class Graphic {

    static defaultStyle: IObject = {
        fillStyle: '#FF0000',
        strokeStyle: '#FF0000',
        lineWidth: 1,
        font: 'normal 12px Arial',
        globalAlpha: 1,
        lineCap: 'round',
        lineJoin: 'round',
        shadowOffsetX: 0, // 阴影Y轴偏移
        shadowOffsetY: 0, // 阴影X轴偏移
        shadowBlur: 0, // 模糊尺寸
    }

    // 需要进行dpr转换的样式属性
    static formatStyle: IObject = {
        'lineWidth': (value: number) => value * CanvasLayer.dpr,
        'font': (value: string) => {
            const fontSize = value.replace(/[^0-9.]/ig, '');
            const newFontSize = parseInt(fontSize, 10) * CanvasLayer.dpr;
            const reg = new RegExp(`${fontSize}`, 'g');
            const newValue = value.replace(reg, `${newFontSize}`);
            return newValue;
        },
    }

    // 设置canvas-style
    static setStyle(ctx: CanvasContext2D, style: IFeatureStyle = {}) {
        const fullStyle = _assign({}, Graphic.defaultStyle, style);
        _forEach(fullStyle, (value: any, key: string) => {
            if (_isFunction(Graphic.formatStyle[key])) {
                const dprValue = Graphic.formatStyle[key](value);
                // 排除方法被覆盖，比如fill/stroke
                !_isFunction(ctx[key]) && (ctx[key] = dprValue);

            }
            else {
                // 排除方法被覆盖，比如fill/stroke
                !_isFunction(ctx[key]) && (ctx[key] = value);
            }
        });
    }

    // 多段线绘制
    static drawPolyline(ctx: CanvasContext2D, shape: IPolylineShape, style: IFeatureStyle, option?: IObject) {
        const {format, limitCount = 2} = option;
        const formatShape = _isFunction(format) ? format(shape) : shape;
        const {points, width} = formatShape;
        const pointsLength = points.length;
        // 校验
        if (pointsLength < limitCount) {
            return;
        }
        Graphic.setStyle(ctx, style);
        _isNumber(width) && (ctx.lineWidth = width);

        // 绘制
        ctx.beginPath();
        const {x: startX, y: startY} = points[0];
        ctx.moveTo(startX, startY); // 设置起点
        for (let i = 1; i < pointsLength; i++) {
            const {x: middleX, y: middleY} = points[i];
            ctx.lineTo(middleX, middleY);
        }
        ctx.stroke();
    }

    // 线绘制
    static drawLine(ctx: CanvasContext2D, shape: ILineShape, style: IFeatureStyle, option?: IObject) {
        Graphic.setStyle(ctx, style);
        const {format} = option || {};
        const formatShape = _isFunction(format) ? format(shape) : shape;
        const {start, end, width} = formatShape;
        _isNumber(width) && (ctx.lineWidth = width);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y); // 设置起点
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    // 矩形绘制
    static drawRect(ctx: CanvasContext2D, shape: IRectShape, style: IFeatureStyle, option?: IObject) {
        const {format} = option || {};
        const stroke = _isBoolean(style.stroke) ? style.stroke : true;
        const fill = _isBoolean(style.fill) ? style.fill : false;
        const formatShape = _isFunction(format) ? format(shape) : shape;

        const {x: startX, y: startY, width, height} = formatShape;
        const endX = startX + width;
        const endY = startY + height;
        // 矩形点
        const rectPoints = [
            {x: startX, y: startY},
            {x: endX, y: startY},
            {x: endX, y: endY},
            {x: startX, y: endY}
        ];
        Graphic.drawPolygon(ctx, rectPoints, style, {fill, stroke});
    }

    // 多边形绘制
    static drawPolygon(ctx: CanvasContext2D, points: IPoint[], style: IFeatureStyle, option?: IObject) {
        const {format, limitCount = 2, closePath = true} = option;
        const stroke = _isBoolean(style.stroke) ? style.stroke : true;
        const fill = _isBoolean(style.fill) ? style.fill : false;

        // 校验
        if(!points)return
        const pointsLength = points.length;
        if (pointsLength < limitCount) {
            return;
        }
        Graphic.setStyle(ctx, style);
        // 绘制
        ctx.beginPath();
        const {x: startX, y: startY} = _isFunction(format) ? format(points[0]) : points[0];
        ctx.moveTo(startX, startY); // 设置起点
        for (let i = 1; i < pointsLength; i++) {
            const {x: middleX, y: middleY} = _isFunction(format) ? format(points[i]) : points[i];
            ctx.lineTo(middleX, middleY);
        }
        closePath && ctx.closePath(); // 是否闭合
        fill && ctx.fill();
        if (stroke) {
            ctx.globalAlpha = 1; // 字体不能设置透明
            ctx.stroke();
        }
    }

    // 圆绘制
    static drawCircle(ctx: CanvasContext2D, shape: ICircleShape, style: IFeatureStyle, option?: IObject) {
        const {format} = option;
        const stroke = _isBoolean(style.stroke) ? style.stroke : true;
        const fill = _isBoolean(style.fill) ? style.fill : false;

        const formatShape = _isFunction(format) ? format(shape) : shape;
        const {cx, cy, r} = formatShape;

        Graphic.setStyle(ctx, style);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        fill && ctx.fill();
        if (stroke) {
            ctx.globalAlpha = 1; // 字体不能设置透明
            ctx.stroke();
        }
    }

    // 绘制点
    static drawPoint(ctx: CanvasContext2D, shape: IPointShape, style: IFeatureStyle, option?: IObject) {
        const {format} = option;

        const formatShape = _isFunction(format) ? format(shape) : shape;
        const {x, y, r = 2} = formatShape;

        Graphic.setStyle(ctx, style);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 图片绘制
    static drawImage(ctx: CanvasContext2D, imageInfo: IGImage, option?: IObject) {
        const {image, x, y, width, height} = imageInfo;
        ctx.drawImage(image, x, y, width, height);
    }
    // 文本绘制
    static drawText(ctx: CanvasContext2D, textInfo: ITextInfo, style: ITextStyle, option?: IObject) {
        const withBackground = style.background;
        const {format} = option;
        const fill = _isBoolean(style.fill) ? style.fill : true;
        const formatTextInfo = _isFunction(format) ? format(textInfo) : textInfo;
        const {text, position, offset} = formatTextInfo;

        // 首先判断text文本是否为空，如果为空，就不进行绘制，直接返回
        if (!text) {
            return;
        }

        Graphic.setStyle(ctx, style);
        const x = position.x + offset.x;
        const y = position.y - offset.y;

        const lineWidth = ctx.lineWidth;
        const paddingVertical = 3 * CanvasLayer.dpr;
        const paddingHorizontal = 4 * CanvasLayer.dpr;
        const isBottom = ctx.textBaseline === ECanvasTextBaseLine.Bottom;
        const isTop = ctx.textBaseline === ECanvasTextBaseLine.Top;
        const isMiddle = ctx.textBaseline === ECanvasTextBaseLine.Middle;

        if (withBackground) {
            // 绘制容器矩形
            const textWidth = ctx.measureText(text).width;
            const fontSize = parseInt(ctx.font.replace(/[^0-9.]/ig, ''), 10);
            const width = textWidth + paddingHorizontal * 2;
            const height = fontSize + paddingVertical * 2;

            let rectLTY = position.y;
            isBottom && (rectLTY = rectLTY - height);
            isTop && (rectLTY = rectLTY); // 不同更换Y坐标
            isMiddle && (rectLTY = rectLTY - height / 2); // 不同更换Y坐标

            const rectShape = {
                x: position.x + offset.x,
                y: rectLTY - offset.y,
                width,
                height
            };
            Graphic.drawRect(ctx, rectShape, {...(style || {}), fill: true});
        }

        // 执行文本绘制
        ctx.globalAlpha = 1; // 字体不能设置透明
        if (fill) {
            ctx.fillStyle = style.fontColor;
            (isBottom && withBackground) && ctx.fillText(text, x + paddingHorizontal, y - paddingVertical + lineWidth);
            (isMiddle && withBackground) && ctx.fillText(text, x + paddingHorizontal, y);
            (isTop && withBackground) && ctx.fillText(text, x + paddingHorizontal, y + paddingVertical + lineWidth);
            !withBackground && ctx.fillText(text, x, y);
        }
        else {
            ctx.strokeStyle = style.fontColor;
            (isBottom && withBackground) && ctx.strokeText(text, x + paddingHorizontal, y - paddingVertical + lineWidth);
            (isMiddle && withBackground) && ctx.strokeText(text, x + paddingHorizontal, y);
            (isTop && withBackground) && ctx.strokeText(text, x + paddingHorizontal, y + paddingVertical + lineWidth);
            !withBackground && ctx.strokeText(text, x, y);
        }
    }

    static drawArrow(ctx: CanvasContext2D, shape: IObject, radians: number , style: ITextStyle, option?: IObject) {
        const {format} = option || {};
        const formatShape = _isFunction(format) ? format(shape) : shape;
        const {position, points = []} = formatShape;
        Graphic.setStyle(ctx, style);

        ctx.save();
        ctx.beginPath();
        ctx.translate(position.x, position.y);
        ctx.rotate(radians);

        _forEach(points, (point: IPoint, index: number) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            }
            else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.restore();
        ctx.fill();
        ctx.stroke();
    }
}
