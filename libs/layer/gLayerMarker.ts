import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _filter from 'lodash/filter';
import _find from 'lodash/find';

import {IObject} from '../gInterface';
import {ILayerStyle} from './gInterface';
import {ELayerType} from './gEnum';
import Marker from '../marker/gMarker';
import Layer from './gLayer';

export default class MarkerLayer extends Layer  {
    public markers: Marker[] = [] // 当前MarkerLayer中所有的markers

    // function: constructor
    constructor(id: string, props: IObject = {}, style: ILayerStyle = {}) {
        super(id, ELayerType.Marker, props, style);
    }

    // 添加marker至当前MarkerLayer中
    addMarker(marker: Marker, option?: IObject) {
        marker.onAdd(this);
        this.markers.push(marker);
    }

    // 删除marker
    removeMarkerById(targetMarkerId: string) {
        const newMarkers = _filter(this.markers, (marker: Marker) => {
            const markerId = marker.id;
            if (markerId === targetMarkerId) {
                marker.onRemove();
                return false;
            }
            return true;
        });
        // 重新设置最新的markers
        this.markers = newMarkers;

        this.refresh();
    }

    // 获取指定marker对象
    getMarkerById(targetMarkerId: string) {
        return _find(this.markers, ({id}) => (id === targetMarkerId));
    }

    // 获取所有markers
    getAllMarkers(): Marker[] {
        return this.markers;
    }

    // 删除所有markers
    removeAllMarkers() {
        const newMarkers = _filter(this.markers, (marker: Marker) => {
            marker.onRemove();
            return false;
        });
        // 重新设置最新的markers
        this.markers = newMarkers;

        this.refresh();
    }

    // @override 重写container大小，设置为0
    resize() {
        this.dom.style.width = '0px';
        this.dom.style.height = '0px';
    }

    // @override
    refresh() {
        super.refresh();
        _forEach(this.markers, (marker: Marker) => marker.refresh());
    }
}
