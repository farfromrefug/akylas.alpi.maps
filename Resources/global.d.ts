
declare var app: IApp;

declare var __LIST__: string;
declare var __MARKERS__: string;
declare var __ITEMS__: string;
declare var __ROUTES__: string;
declare var __DEVELOPMENT__: boolean;

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


