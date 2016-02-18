var service = Ti.App.currentService;

//that service is started every time the app goes to background on iOS. It is enough to keep our recording window running
//so all the intelligence is still in the recording window screen

Ti.API.debug('ios background service started');
var timer = setInterval(function() {
    Ti.API.debug('ios background service running');
    //simple timer doing nothing to keep the service running
}, 30000);

service.addEventListener('stop', function() {
Ti.API.debug('ios background service stopped');
    clearInterval(timer);
    timer = undefined;

});