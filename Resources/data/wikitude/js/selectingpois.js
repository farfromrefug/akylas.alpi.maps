// implementation of AR-Experience (aka "World")
var World = {
	// you may request new data from server periodically, however: in this sample data is only requested once
	isRequestingData: false,

	// true once data was fetched
	initiallyLoadedData: false,

	// different POI-Marker assets
	markerDrawable_idle: null,
	markerDrawable_selected: null,
	markerDrawable_directionIndicator: null,
	markerDrawables: {},

	// list of AR.GeoObjects that are currently shown in the scene / World
	markerList: {},

	// The last selected marker
	currentMarker: null,

	// called to inject new POI data
	loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {
		AR.context.destroyAll();

		// show radar & set click-listener
		PoiRadar.show();
		// $('#radarContainer').unbind('click');
		// $("#radarContainer").click(PoiRadar.clickedRadar);
		// empty list of visible markers
		World.markerList = {};
		// World.updateStatusMessage('loadPoisFromJsonData');
		World.markerDrawables = {
			'default': new AR.ImageResource("assets/marker_idle.png"),
			'selected': new AR.ImageResource("assets/marker_selected.png"),
			'direction': new AR.ImageResource("assets/indi.png"),
		};
		// Start loading marker assets:
		// Create an AR.ImageResource for the marker idle-image
		// Create an AR.ImageResource for the marker selected-image
		// World.markerDrawable_selected = new AR.ImageResource("assets/marker_selected.png");
		// Create an AR.ImageResource referencing the image that should be displayed for a direction indicator. 
		// World.markerDrawable_directionIndicator = new AR.ImageResource("assets/indi.png");

		var currentPoi, currentPlaceNr;
		// loop through POI-information and create an AR.GeoObject (=Marker) per POI
		for (currentPlaceNr = 0; currentPlaceNr < poiData.length; currentPlaceNr++) {
			World.addPoi(poiData[currentPlaceNr]);
		}

		World.updateDistanceToUserValues();

		World.updateStatusMessage(poiData.length + ' places loaded');
	},
	addPoi: function addPoiFn(poi) {
		if (!poi.hasOwnProperty('altitude')) {
			poi.altitude = AR.CONST.UNKNOWN_ALTITUDE;
		}
		World.markerList[poi.id] = (new Marker(poi));
	},
	removePoi: function removePoiFn(poi) {
		var marker = World.markerList[poi.id];
		if (marker) {
			marker.destroy();
			delete World.markerList[poi.id];
		}
	},
	updatePoi: function updatePoiFn(poi) {
		var marker = World.markerList[poi.id];
		if (marker) {
			marker.destroy();
			World.addPoi(poi);
		}
	},
	// sets/updates distances of all makers so they are available way faster than calling (time-consuming) distanceToUser() method all the time
	updateDistanceToUserValues: function updateDistanceToUserValuesFn() {
		for (var i = 0; i < World.markerList.length; i++) {
			World.markerList[i].distanceToUser = World.markerList[i].markerObject.locations[0].distanceToUser();
		}
	},
	// loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {
	// 	// empty list of visible markers
	// 	World.markerList = [];

	// 	// Start loading marker assets:
	// 	// Create an AR.ImageResource for the marker idle-image
	// 	World.markerDrawable_idle = new AR.ImageResource("assets/marker_idle.png");
	// 	// Create an AR.ImageResource for the marker selected-image
	// 	World.markerDrawable_selected = new AR.ImageResource("assets/marker_selected.png");
	// 	// Create an AR.ImageResource referencing the image that should be displayed for a direction indicator. 
	// 	World.markerDrawable_directionIndicator = new AR.ImageResource("assets/indi.png");

	// 	// loop through POI-information and create an AR.GeoObject (=Marker) per POI
	// 	for (var currentPlaceNr = 0; currentPlaceNr < poiData.length; currentPlaceNr++) {
	// 		var singlePoi = {
	// 			"id": poiData[currentPlaceNr].id,
	// 			"latitude": parseFloat(poiData[currentPlaceNr].latitude),
	// 			"longitude": parseFloat(poiData[currentPlaceNr].longitude),
	// 			"altitude": parseFloat(poiData[currentPlaceNr].altitude),
	// 			"title": poiData[currentPlaceNr].name,
	// 			"description": poiData[currentPlaceNr].description
	// 		};

	// 		/*
	// 			To be able to deselect a marker while the user taps on the empty screen, 
	// 			the World object holds an array that contains each marker.
	// 		*/
	// 		World.markerList.push(new Marker(singlePoi));
	// 	}

	// 	World.updateStatusMessage(currentPlaceNr + ' places loaded');
	// },

	// updates status message shon in small "i"-button aligned bottom center
	updateStatusMessage: function updateStatusMessageFn(message, isWarning) {

		// var themeToUse = isWarning ? "e" : "c";
		// var iconToUse = isWarning ? "alert" : "info";

		// $("#status-message").html(message);
		// $("#popupInfoButton").buttonMarkup({
		// 	theme: themeToUse
		// });
		// $("#popupInfoButton").buttonMarkup({
		// 	icon: iconToUse
		// });
	},

	//location updates,
	//fired every time you call architectView.setLocation() in native environment
	locationChanged: function locationChangedFn(lat, lon, alt, acc) {
		// store user's current location in World.userLocation, so you always know where user is
		World.userLocation = {
			'latitude': lat,
			'longitude': lon,
			'altitude': alt,
			'accuracy': acc
		};

		// request data if not already present
		// if (!World.initiallyLoadedData) {
		// World.requestDataFromServer(lat, lon);
		// World.initiallyLoadedData = true;
		// } else if (World.locationUpdateCounter === 0) {
		// update placemark distance information frequently, you max also update distances only every 10m with some more effort
		World.updateDistanceToUserValues();
		// }
		World.sendEvent('location', {
			coords: World.userLocation
		});
		// helper used to update placemark information every now and then (e.g. every 10 location upadtes fired)
	},
	sendEvent: function(_type, _data) {
		if (!_data) {
			_data = {};
		}
		_data.type = _type
		var architectSdkUrl = "architectsdk://event?data=" + encodeURIComponent(JSON.stringify(_data));
		/*
			The urlListener of the native project intercepts this call and parses the arguments. 
			This is the only way to pass information from JavaSCript to your native code. 
			Ensure to properly encode and decode arguments.
			Note: you must use 'document.location = "architectsdk://...' to pass information from JavaScript to native. 
			! This will cause an HTTP error if you didn't register a urlListener in native architectView !
		*/
		document.location = architectSdkUrl;
	},
	// fired when user pressed maker in cam
	onMarkerSelected: function onMarkerSelectedFn(marker) {

		// deselect previous marker
		if (World.currentMarker) {
			if (World.currentMarker.poiData.id == marker.poiData.id) {
				return;
			}
			World.currentMarker.setDeselected(World.currentMarker);
		}

		// highlight current one
		marker.setSelected(marker);
		World.currentMarker = marker;
		World.sendEvent('selected', {
			poiData: marker.poiData
		});
	},

	// screen was clicked but no geo-object was hit
	onScreenClick: function onScreenClickFn() {
		if (World.currentMarker) {
			World.currentMarker.setDeselected(World.currentMarker);
			World.sendEvent('unselected', {
				poiData: World.currentMarker.poiData
			});
			World.currentMarker = null;
		}
	},

	// request POI data
	// requestDataFromLocal: function requestDataFromLocalFn(centerPointLatitude, centerPointLongitude) {
	// 	var poisToCreate = 20;
	// 	var poiData = [];

	// 	for (var i = 0; i < poisToCreate; i++) {
	// 		poiData.push({
	// 			"id": (i + 1),
	// 			"longitude": (centerPointLongitude + (Math.random() / 5 - 0.1)),
	// 			"latitude": (centerPointLatitude + (Math.random() / 5 - 0.1)),
	// 			"description": ("This is the description of POI#" + (i + 1)),
	// 			// use this value to ignore altitude information in general - marker will always be on user-level
	// 			"altitude": AR.CONST.UNKNOWN_ALTITUDE,
	// 			"name": ("POI#" + (i + 1))
	// 		});
	// 	}
	// 	World.loadPoisFromJsonData(poiData);
	// }

};

/* 
	Set a custom function where location changes are forwarded to. There is also a possibility to set AR.context.onLocationChanged to null. In this case the function will not be called anymore and no further location updates will be received. 
*/
AR.context.onLocationChanged = World.locationChanged;

/*
	To detect clicks where no drawable was hit set a custom function on AR.context.onScreenClick where the currently selected marker is deselected.
*/
AR.context.onScreenClick = World.onScreenClick;