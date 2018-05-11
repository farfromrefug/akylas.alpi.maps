/// <reference path="/Volumes/data/mguillon/Library/Application Support/Titanium/mobilesdk/osx/7.0.0.AKYLAS/titanium.d.ts" />
/// <reference path="./TemplateModule.d.ts" />
/// <reference path="./AKInclude/akylas.global.d.ts" />
/// <reference path="./AKInclude/akylas.lang.d.ts" />
/// <reference path="./AKInclude/akylas.ti.d.ts" />
/// <reference path="./AKInclude/App.d.ts" />
/// <reference path="./AKInclude/MicroEvent.d.ts" />
/// <reference path="./AKInclude/WindowManager.d.ts" />
/// <reference path="./AKInclude/UI/BaseWindow.d.ts" />
/// <reference path="./AKInclude/UI/AnimatedWindow.d.ts" />
/// <reference path="./AKInclude/UI/AppTabController.d.ts" />
/// <reference path="./AKInclude/UI/AppTabView.d.ts" />
/// <reference path="./AKInclude/UI/NavigationBar.d.ts" />

declare function akPath(name: string, dir: string): string;
declare function akRequire(moduleId: string): any;
declare function akInclude(moduleId: string);
declare function debounce(func: (...args: any[]) => any, wait: number, immediate?: boolean): (...args: any[]) => any;
declare function sdebug(...strings: any[]);
declare function sinfo(...strings: any[]);
declare function serror(...strings: any[]);
declare function stringify(value: any, space?: string | number);
declare function tr(id: string,  _data?:string | object, _default?: string): string;
declare function trc(id: string,  _data?:string | object, _default?: string): string;
declare function tru(id: string,  _data?:string | object, _default?: string): string;
declare function trt(id: string,  _data?:string | object, _default?: string): string;
declare var __APPLE__: boolean;
declare var __ANDROID__: boolean;
declare var __PRODUCTION__: boolean;
declare var __DEVELOPMENT__: boolean;
declare var __SIMULATOR__: boolean;
declare var __dirname: string;

declare var ak: AK.AK;

interface String {
    assign(...args)
}
interface Object {
    assignDeep(target: Object, ...sources): Object;
    bindAssign(target: Object, ...sources): Object;
    defaults(target: Object, ...sources): Object;
    deepCopy(source: Object): Object;
    isObject(source): Boolean;
    get(source: Object, keys: string[]): any;
}

declare class View extends Ti.UI.View { GC?() }
declare class TiWindow extends Ti.UI.Window {
    winGCId?: string; GC?()
    akmanaged?: boolean
    handleOpen?: boolean
    handleClose?: boolean
    _closing?: boolean
    manager?: NavWindow
    winManager?: AK.IWindowManager
    winId?: number
    toDoAfterOpening?()
}

declare class ButtonBar extends Ti.UI.ButtonBar { GC?() }
declare class TextArea extends Ti.UI.TextArea { GC?() }
declare class ImageView extends Ti.UI.ImageView { GC?() }
declare class OptionDialog extends Ti.UI.OptionDialog { GC?() }
declare class ListView extends Ti.UI.ListView { GC?() }
declare class CollectionView extends Ti.UI.ListView { GC?() }//temp needs doc on ti side for collection
declare class ListSection extends Ti.UI.ListSection { GC?() }
declare class CollectionSection extends Ti.UI.ListSection { GC?() } //temp needs doc on ti side for collection
declare class Button extends Ti.UI.Button { GC?() }
declare class ScrollableView extends Ti.UI.ScrollableView {
    strip?: TiDict | View
    GC?()
}
declare class Picker extends Ti.UI.Picker { GC?() }
declare class ScrollView extends Ti.UI.ScrollView { GC?() }
declare class TextField extends Ti.UI.TextField { GC?() }
declare class Label extends Ti.UI.Label { GC?() }
declare class AlertDialog extends Ti.UI.AlertDialog { GC?() }
declare class WebView extends Ti.UI.WebView { GC?() }
declare class HTTPClient extends Ti.Network.HTTPClient { GC?() }
declare class Window extends TiWindow { GC?() }
declare class TCPSocket extends Ti.Network.Socket.TCP { GC?() }

declare class BaseWindow extends TiWindow {
    // navWindow: Boolean
    isOpened: boolean
    navWindow?: boolean
    exitOnBack?: boolean

    underContainer?: View
    winOpeningArgs?: titanium.openWindowParams
    winClosingArgs?: titanium.openWindowParams
    openMe(args?)
    closeMe(args?)
    hideMe?(args?)
    onOpen?(args?)
    onClose?(args?)
    shouldShowBackButton(backTitle: string)
    showLoading(args?)
    hideLoading(args?)
    addPropertiesToGC(key: string)
}

declare class NavWindow extends AppWindow {
    window: AppWindow
    navOpenWindow(_win: AppWindow, _args?: TiDict)
    createManagedWindow(constructor?: string, args?: TiDict)
    createAndOpenWindow(_constructor: string, _args?: TiDict, _winArgs?: TiDict)
    openWindow(_win: TiWindow, _args?, _dontCheckOpening?: Boolean)
    closeToRootWindow()
    canGCWindow(_win: TiWindow)
    isOpened: boolean
    closeAllWindows(_args?: TiDict)
    closeCurrentWindow(_args?: TiDict)
    closeWindow(_win: TiWindow, _args?: TiDict)
}

declare class NavigationBar extends View {
    actualNavbar: View
    titleHolder: View
    leftButtonViewHolder: View
    rightButtonViewHolder: View
    setRootWindow(_window)
    setMyVisibility(_visible, _animated, _duration?)
    onstackchange?(event)
    onBackButton?(event)
}

declare class AppTabController extends View {
    container: View
    setLabels(tabs: string[])
    addTab(tab: string)
    setIndex(index: number)
}

declare class AppTabView extends View {
    pager: ScrollableView
    container: View
    currentView: View
    setTab(index: number)
    setTabs(_tabs)
    getTab(_index)
    getTabs()
    moveNext()
}

declare interface TiEvent {
    [k: string]: any
    type?: string
    bindId?: string
    source?: titanium.Proxy
}
declare interface TiMediaEvent extends TiEvent {
    media: titanium.Blob, width: number, height: number
}

declare interface TiImageEvent extends TiEvent {
    image: titanium.Blob
}
declare type TiEventCallback = (e?: TiEvent) => any

declare interface TiListEvent extends TiEvent {
    section: titanium.UIListSection
    item: any
    itemIndex: number
    sectionIndex: number
}
declare interface TiChangeListEvent extends TiListEvent {
    value: string
}

declare interface TiChangeEvent extends TiEvent {
    value: string
}
declare module AK {

    export interface IReduxFn {
        addNaturalConstructor(context: any, constructors: {}, arg1: string, arg2: string)
        style(type: any, obj?: any): any
        includeOverloadRJSS(...args: string[])
        includeRJSS(...args: string[])
        setDefault(selector: string, defaults, orientation?)
    }
    export interface IRedux {
        fn: IReduxFn
    }

    export class TiEmitter extends Emitter {
        addEventListener(name: string, callback: (e: TiEvent) => any): this;
        removeEventListener(name: string, callback: (e: TiEvent) => any): this;
        fireEvent(name: string, e: TiEvent): void;
        emit(name: string, e: TiEvent);
        on(name: string, callback: (e: TiEvent) => any): this;
        once(name: string, callback: (e: TiEvent) => any): this;
        off(name: string, callback: (e: TiEvent) => any): this;
    }

    export class Emitter {
        on(name: string, callback: (...args: any[]) => any): this;
        once(name: string, callback: (...args: any[]) => any): this;
        off(name: string, callback: (...args: any[]) => any): this;
        removeAllListeners(): this;
        emit(name: string, ...args);
    }
    export interface IWindowManager {
        // mainwindow: MainWindow
        androidNav?: boolean
        // slidemenu: SlideMenu
        // topWindow: TiWindow
        handlingOpening?: boolean
        rootWindow: TiWindow
        createAndOpenWindow(_constructor: string, _args?: TiDict, _openingArgs?: TiDict, _dontCheckOpening?: boolean)
        openWindow(_win: TiWindow, _args?: TiDict, _dontCheckOpening?: boolean)
        closeWindow(_win, _args?, _callGC?: Boolean)
        windowSignalsOpened(_win)
        getWindowManager(_win)
    }

}
declare module 'akylas.commonjs/AkInclude/App' {
    export default class AkApp extends AK.App { }
}

declare module 'akylas.commonjs/TemplateModule' {
    export default class TemplateModule extends AK.TemplateModule { }
}

declare module 'akylas.commonjs/AkInclude/MicroEvent' {
    export class TiEventEmitter extends AK.Emitter { }
}

declare interface Error {
    toJSON(): Object
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

declare interface AKWindowParams extends TiPropertiesT<AppWindow> {
    topToolbar?: titanium.UIView | TiPropertiesT<titanium.UIView>
    bottomToolbar?: titanium.UIView | TiPropertiesT<titanium.UIView>
    loadingViewArgs?: TiDict
    listViewArgs?: AKAppListViewParams
}

declare interface AKAppListViewParams extends TiPropertiesT<titanium.UIListView> {
}
declare interface AKCustomAlertViewParams extends TiPropertiesT<titanium.UIView> {
    cancel?: boolean
    hideOnClick?: boolean
    tapOutDismiss?: boolean
    blurBackground?: boolean
    buttonNames?: string[]
    message?: string
    error?: string
    textAlign?: string | number
    image?: string
    title?: string
    customView?: titanium.UIView | TiPropertiesT<titanium.UIView>
}
