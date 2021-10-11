
// 图层类型
export enum ELayerType {
    Image = 'IMAGE',
    Feature = "FEATURE",
    Event = "EVENT",
    Mask = "MASK",
    Text = "TEXT",
    Marker = "MARKER",
    Overlay = "OVERLAY"
};

// 图片层事件类型
export enum ELayerImageEventType {
    LoadStart = "loadStart",
    LoadEnd = "loadEnd",
    LoadError = "loadError"
};
