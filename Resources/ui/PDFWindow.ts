ak.ti.constructors.createPDFWindow = function(_args) {
    var currentItem = _.remove(_args, 'item'),
        mapHandler = _.remove(_args, 'mapHandler'),
        itemHandler = _.remove(_args, 'itemHandler'),
        itemDesc = _.remove(_args, 'itemDesc'),
        file = _.remove(_args, 'file'),

    _args = _args || {};
    _args.title = file.title || file.fileName;
    var filePath =  app.getFilePath(file.fileName);
    // get the html file
    // var htmlData = String(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "data/pdf/index.html").read());
    // change the html to open the custom pdf file
    // htmlData = htmlData.replace(/#PDF_FILE#/gi, Ti.Filesystem.getFile(filePath).nativePath);
    // var url = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'data/pdfjs/web/viewer.html').nativePath + '?file=' + Ti.Filesystem.getFile(filePath).nativePath;

    var webView = new WebView({
        rclass: 'AppWebView',
        url: filePath,
    });

    var self = new AppWindow(_args);

    self.container.add(webView, 1);

    webView.on('load', function(e) {
        // sdebug('on load done load', e.url);
        // setProgress(1);
    }).on('loadprogress', function(e) {
        // if (e.progress !== 1) {
        // sdebug('loadprogress', e.progress);
        // setProgress(e.progress);
        // }
    }).on('error', function(e) {
        // setProgress(1);
    });
    self.onBack = function() {
        var canGoBack = webView.canGoBack();
        sdebug('onBack', canGoBack);
        if (canGoBack) {
            webView.goBack();
        } else {
            self.closeMe();
        }
    };

    // self.onOpen = app.composeFunc(self.onOpen, function() {
    //  if (floating) {
    //      self.fakeBack.backgroundColor = '#00000088';
    //  }
    // });

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        webView = null;
        mapHandler = null;
        self = null;
    });
    return self;
};
