import { EventEmitter } from 'events'
import { ItemHandler } from '../../lib/itemHandler'

// declare global {
// type MapModule =  MapModule_
// type ContentModule =  ContentModule_
type MapModuleSettings = ModuleSettings
// }
export interface ModuleSettings {
    canBeDisabled: boolean
    description?: string
    name?: string
    preferencesSections: {
        title: string
        items: {
            id: string
            type: string
            title: string
            subtitle: string
            url: string
        }[]
    }[]
}
export class MapModule extends EventEmitter {
    constructor(_args?) {
        super();
    }
    itemHandler = app.itemHandler
    settings?: ModuleSettings
    markers: any
    window: AppWindow
    parent: MapWindow
    mapView: MapView
    id: string
    onModuleAction?(args)
    canSpreadModuleAction?(args)
    onModuleLongAction?(args)
    canSpreadLongModuleAction?(args)
    onInit?()
    onSettingsClickOrChange?(e: any, parentWindow: ModuleWindow)
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
    runAction = (_action: string, _item?: Item, _desc?: ItemType, _callback?: Function) => {
        this.itemHandler.handleItemAction(_action, _item, _desc, _callback, this.window,
            this.parent);
    }
}

export class ContentModule extends MapModule {
    GC() { }
    hasSettings() {
        return true;
    }
}
