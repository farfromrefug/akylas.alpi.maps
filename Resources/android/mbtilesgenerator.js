var service = Ti.Android.currentService;
var intent = service.getIntent();
// var teststring = intent.getStringExtra('message') + ' (instance ' + service.serviceInstanceId + ')';

Ti.API.debug('android service starting ');

var mbTilesGenerator = require('lib/mbtilesgenerator/generator');
// recorder.on_stop = function(){
//     Ti.API.debug('android service recorder stop ');
//     recorder.GC();
//     service.stop();
// };

// recorder.start();