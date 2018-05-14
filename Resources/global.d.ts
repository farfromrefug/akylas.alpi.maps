
/// <reference path="/Volumes/data/dev/titanium/dist/modules/iphone/akylas.commonjs/5.0/documentation/akylas.commonjs.d.ts" />
/// <reference path="/Volumes/data/dev/titanium/dist/modules/iphone/akylas.commonjs/5.0/documentation/lodash.d.ts" />

declare var app: IApp;

declare var __LIST__: string;
declare var __MARKERS__: string;
declare var __ITEMS__: string;
declare var __ROUTES__: string;
declare var __DEVELOPMENT__: boolean;
declare var _EVENT_ITEMS_MOVED_: string;
declare var _EVENT_ITEMS_ADDED_: string;
declare var _EVENT_ITEMS_CHANGED_: string;
declare var _EVENT_ITEMS_REMOVED_: string;
declare var _EVENT_ROUTES_MOVED_: string;
declare var _EVENT_ROUTES_ADDED_: string;
declare var _EVENT_ROUTES_CHANGED_: string;
declare var _EVENT_ROUTES_REMOVED_: string;


declare interface WindowManager extends AK.IWindowManager {
    leftmenu: LeftMenu
    mainwindow: MainWindow
    topWindow: TiWindow
    rootWindow: TiWindow
    slidemenu: SlideMenu
}

declare class HTTPPromise<T> extends Promise<T> {
    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void)
    request: HTTPClient
    cancel()
}
declare class SlideMenu extends TiWindow {
    constructor(args?);
    toggleLeftView();
    toggleRightView();
    closeViews();
}


declare interface ListEvent<T> {
    item: T,
    section: ListSection,
    sectionIndex: number,
    itemIndex: number,
    editing?: boolean
    accessoryClicked?: boolean
    searchResult?: boolean
    listView: ListView,
    bindId?: string
}

declare interface WindowParams extends AKWindowParams {
    item?: Item
    itemDesc?: ItemType
    itemHandler?: ItemHandler
    mapHandler?: MapWindow
}
