export enum EDirection {
    DOWN = 'down',
    UP = 'up',
    LEFT = 'left',
    RIGHT = 'right'
};

export enum EXAxisDirection {
    Left = 'left',
    Right = 'right'
};

export enum EYAxisDirection {
    Top = 'top',
    Bottom = 'bottom'
};


export enum ECanvasTextBaseLine {
    Bottom = 'bottom',
    Top = 'top',
    Middle = 'middle'
};

// Map:Mode类型
export enum EMapMode {
    Pan = "PAN", // 浏览
    Ban = "BAN", // 禁止浏览缩放
    MARKER = "MARKER", // 绘制注记
    Point = "POINT", // 绘制点
    Circle = "CIRCLE", // 绘制圆
    Line = "LINE", // 绘制线段
    Polyline = "POLYLINE", // 绘制多段线
    Rect = "RECT", // 绘制矩形
    Polygon = "POLYGON", // 绘制多边形
    DrawMask = "DRAWMASK", // 绘制涂抹
    ClearMask = "CLEARMASK", // 清除涂抹
    ImageMask = "IMAGEMASK" // 图片涂抹
};

// map.events.on事件
export enum EEventType {
    BoundsChanged = "boundsChanged", // 视野范围发生变化触发
    FeatureSelected = "featureSelected", // feature选中触发
    FeatureUnselected = "featureUnselected", // feature取消选中触发
    DrawDone = "drawDone", // feature绘制完成
    FeatureUpdated = "featureUpdated", // feature更新完成
    FeatureDeleted = "featureDeleted", // feature删除完成【目前只针对点的右键删除回调】

    // 鼠标事件
    Click = "click",
    DblClick = "dblClick",
    MouseDown = "mouseDown",
    MouseMove = "mouseMove",
    MouseUp = "mouseUp",
    MouseOver = "mouseOver",
    MouseOut = "mouseOut",
};

// 插槽事件处理，可以将用户侧代码进行插入执行
export enum EEventSlotType {
    DrawActivePoint = "drawActivePoint",
    DrawActiveMiddlePoint = "drawActiveMiddlePoint"
};

// 手势类型
export enum ECursorType {
    Grab = "-webkit-grab",
    Grabbing = "-webkit-grabbing",
    Crosshair = "crosshair",
    Pointer = "pointer",
    Move = "move",
    NESW_Resize = "nesw-resize",
    NWSE_Resize = "nwse-resize"
};
export enum EUrlCursorType{
    DrawMask = "crosshair",
    ClearMask = "crosshair"
};
