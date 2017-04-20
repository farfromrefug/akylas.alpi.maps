class MapModule extends TiEventEmitter {
    markers: any
    window: AppWindow
    parent: any
    mapView: MapView
    id: string
    onModuleAction?: Function
    canSpreadModuleAction?: Function
    onModuleLongAction?: Function
    canSpreadLongModuleAction?: Function
    onInit?: Function
    GC() {
        this.markers = null;
        this.window = null;
        this.parent = null;
        this.mapView = null;
    }

    spreadModuleAction(_params) {
        return (this.onModuleAction && this.onModuleAction(_params)) ||
            (this.canSpreadModuleAction && !this.canSpreadModuleAction(_params));
    }
    spreadLongModuleAction(_params) {
        return (this.onModuleLongAction && this.onModuleLongAction(_params)) ||
            (this.canSpreadLongModuleAction && !this.canSpreadLongModuleAction(_params));
    }
    runAction(_action, _item, _desc, _callback) {
        app.itemHandler.handleItemAction(_action, _item, _desc, _callback, this.window,
            this.parent);
    }
}

class ContentModule extends MapModule {
    GC() { }
    hasSettings() {
        return true;
    }
}
