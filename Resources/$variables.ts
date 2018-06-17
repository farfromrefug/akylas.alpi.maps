class Variables {
    constructor() {
        this.backgroundColor = this.white;
        this.cText = this.black;
        this.cMenuText = this.white;
    }
    nbButtonWidth:number
    leftMenuWidth:number
    navBarHeight = Ti.App.defaultNavBarHeight
    navBarTop = (app.deviceinfo.isAndroid && app.deviceinfo.SDKVersion < 19) ? 0 : Ti.App.defaultStatusBarHeight

    menuPaddingLeft = 15
    viewBorderPadding = 15
    mapActionBtnWidth = 50
    markerInfoHolderHeight = 46
    markerInfoWidth = 58
    markerInfoExtraHeight = 64
    itemActionBarHeight = 54
    licenseRowHeight = 55
    iconicfontfamily = 'mapme'
    cTheme = app.createThemeColors('#0CA3CA')
    cMenuBack = '#2D2D2Cfe'
    black = '#000000'
    white = '#ffffff'
    gray = '#bdbdbd'
    grayLigther = '#bbb'
    backgroundColor: string
    cText: string
    cMenuText: string
    cPin = app.colors.red.color
    cLink = '#3ebbef'
    sLogo = '\ue6d5'
    sMenu = '\ue610'
    sList = '\ue0dc'
    sSettings = '\ue2cb'
    sGps2 = '\ue0a7'
    sGps = '\ue604'
    sGpsOff = '\ue0a5'
    sCompass = '\ue28e'
    sOptions = '\ue616'
    sHOptions = '\ue20f'
    sWater = '\ue611'
    sDirections = '\ue1c8'
    sPlace = '\ue052'
    sTrace = '\ue613'
    sPin = '\ue618'
    sElevation = '\ue04e'
    sElevationProfile = '\ue6ae'
    sLayers = '\ue608'
    sLayersClear = '\ue609'
    sDist = '\ue284'
    sVDist = '\ue213'
    sDplus = '\ue041'
    sDmin = '\ue044'
    sNav = '\ue1f5'
    sSpeed = '\ue6d1'
    sGpsDevice = '\ue612'
    sVisible = '\ue306'
    sRefresh = '\ue00e'
    sHidden = '\ue307'
    sAdd = '\ue069'
    sEdit = '\ue076'
    sCheck = '\ue60e'
    sQuery = '\ue069'
    sRound = '\ue13b'
    sPause = '\ue019'
    sAlert = '\ue610'
    sCancel = '\ue606'
    sClose = '\ue070'
    sNext = '\ue60e'
    sSearch = '\ue2ca'
    sLeft = '\ue61a'
    sRight = '\ue61b'
    sDown = '\ue10f'
    sUp = '\ue112'
    sRightSmall = '\ue111'
    sExpand = '\ue10f'
    sCaretDown = '\uf0d7'
    sStar = '\ue60b'
    sLanguage = '\ue614'
    sSubtitles = '\ue02b'
    sArrowDown = '\ue201'
    sEditMove = '\ue0da'
    sPaint = '\ue079'
    sMap = '\ue60a'
    sRouting = '\ue6b5'
    sShare = '\ue083'
    sLine = '\ue614'
    sWalking = '\ue1d0'
    sDriving = '\ue632'
    sCycling = '\ue1cc'
    sGoogle = '\uf1a0'
    sAddNote = '\ue6bf'
    sExternal = '\ue6c0'
    sAkylas = '\ue6cf'
    sLicenses = '\uf02d'
    sCopyright = '©'
    sCC = '\uf25e'
    TSCountrolsHeight: number
    gfHeaderHeight: number
}

declare var $: Variables;
$ = new Variables();