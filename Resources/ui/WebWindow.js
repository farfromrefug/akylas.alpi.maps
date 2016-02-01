ak.ti.constructors.createWebWindow = function(_args) {
	_args = _args || {};
	_args.title = _args.title || ' ';
	var floating = _args.floating === true,
		imageLink, note,
		currentItem = _.remove(_args, 'item'),
		mapHandler = _.remove(_args, 'mapHandler'),
		itemHandler = _.remove(_args, 'itemHandler'),
		itemDesc = _.remove(_args, 'itemDesc'),
		url = _.remove(_args, 'url');
	// if (floating) {
	// 	_.assign(_args, {
	// 		// navBarHidden: true,
	// 		customNavBar: true,
	// 		// modal: floating,
	// 		// backgroundColor: 'transparent'
	// 	});
	// }
	if (!_.startsWith(url, 'http')) {
		url = 'http://' + url;
	}

	var phoneReg =
		/^(?:(tel|telprompt):)?\s*(?:\+?(\d{1,3}))?([-. (]*(\d{2,3})[-. )]*)?((\d{2,3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)$/g;

	function getLinkSRCAtPoint(x, y) {
		var styleProp = "display";

		function allElementsFromPoint(x, y) {
			var element, elements = [];
			var old_visibility = [];
			while (elements.length < 4) {
				element = document.elementFromPoint(x, y);
				if (!element || element === document.documentElement) {
					break;
				}
				elements.push(element);
				old_visibility.push(element.style.visibility);
				element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
			}
			for (var k = 0; k < elements.length; k++) {
				elements[k].style.visibility = old_visibility[k];
			}

			// elements.reverse();
			return elements;
		}
		var result = allElementsFromPoint(x, y),
			dataStore, i, e;
		for (i = 0; i < result.length; i++) {
			e = result[i];
			//loop through elementsArray until you find the td you're interested in
			dataStore = e.getAttribute('data-store');
			if (e.href) {
				var match = e.href.match(/imgurl=(.*?)&/);
				if (match && match.length > 0) {
					return match[1];
				}
			}
			if (dataStore) {
				dataStore = JSON.parse(dataStore);
				// console.log(dataStore);
				if (dataStore.imgsrc) {
					// console.log(dataStore.imgsrc);
					return dataStore.imgsrc;
				}
			}
			if (e.src && !/^data:/.test(e.src)) {
				return e.src;
			}
		}

	}

	function onNetworkChange(e) {
		if (e.connected) {
			webview.applyProperties({
				html: null,
				url: url
			});
			api.off('networkchange', onNetworkChange);
		}
	}

	var webView = new WebView({
		rclass: 'AppWebView',
		url: url,
	});
	if (!app.api.networkConnected) {
		webView.html = trc('cant_open_url_no_connection');
		app.api.on('networkchange', onNetworkChange);
	} else {
		webView.url = url;
	}
	if (__APPLE__ && currentItem) {
		var viewWidth = webView.rect.width;
		var checkForImageNote = function(e) {
			if (webView === null) {
				return;
			}
			var innerWidth = parseFloat(webView.evalJS('window.innerWidth'));
			if (!innerWidth) {
				return;
			}
			sdebug('innerWidth', innerWidth);

			var f = innerWidth / viewWidth;
			var x = (e.x * f);
			var y = (e.y * f);
			var line = 'getLinkSRCAtPoint(' + x + ',' + y + ');';
			sdebug('line', line);
			imageLink = webView.evalJS(line);
			if (!/https?:/.test(imageLink)) {
				imageLink = undefined;
			} // if (!imageLink) {
			note = webView.evalJS('window.getSelection().toString()');
			if (note) {
				note = note.replace(/^[\r\n|\n|\r]+|[\r\n|\n|\r]+$/g, "");
			} else {
				note = '';
			}

			// }

			toolBar.applyProperties({
				image: {
					image: imageLink || ''
				},
				note: {
					enabled: true,
					visible: note.length > 0
				}
			});
			sdebug('imageLink', imageLink);
			sdebug('note', note);
		}
		var scrolling = false;
		webView
		// .on('scroll', function(e) {
			// scrolling = true;
			// sdebug('scroll');
		// })
		.on('touchend', function(e) {
			// sdebug('touchend');
			if (loaded && !scrolling) {
			_.delay(checkForImageNote, 500, e);
			}
			// scrolling = false;
		}).on('postlayout', function(e) {
			 viewWidth = webView.rect.width;
		}).on('longpress', function(e) {
			// sdebug('longpress', e);
			if (loaded) {
				checkForImageNote(e);
			}

		});
	}

	function createToolbarButton(_id, _icon, _args) {
		return {
			type: 'Ti.UI.Button',
			bindId: _id,
			properties: _.assign({
				rclass: 'WebToolbarButton',
				title: _icon,
				enabled: false
			}, _args)
		};
	}
	// {
	// 		icon: $sShare,
	// 		callback: function() {}
	// 	}
	var toolBar = new View({
		layout: 'horizontal',
		height: $navBarHeight,
		backgroundColor: _args.barColor || $cTheme.main,
		childTemplates: [
			createToolbarButton('back', $sLeft),
			createToolbarButton('forward', $sRight), {
				// 	type: 'Ti.UI.ActivityIndicator',
				// 	bindId: 'indicator',
				// 	properties: {
				// 		rclass: 'WebToolbarButton',
				// 		// style: Ti.UI.ActivityIndicatorStyle.BIG,
				// 		visible: true
				// 	}
				// }, {
				type: 'Ti.UI.View'
			},
			createToolbarButton('note', app.icons.note, {
				visible: false
			}), {
				type: 'Ti.UI.ImageView',
				bindId: 'image',
				properties: {
					borderRadius: 2,
					width: 50,
					top: 2,
					bottom: 2,
					left: 4,
					right: 4
				}

			},
			createToolbarButton('more', String.fromCharCode(0xe2a9))
		],
		events: {
			click: app.debounce(function(e) {
				var bindId = e.bindId;
				var colors = app.getColors(currentItem, itemDesc);
				sdebug('click', bindId);
				if (bindId === 'back') {
					webView.goBack();
				} else if (bindId === 'forward') {
					webView.goForward();
				} else if (bindId === 'refresh') {
					webView.reload();
				} else if (bindId === 'note') {
					if (note) {
						var phoneNb = note.match(phoneReg);
						if (phoneNb) {
							sdebug(phoneNb);
							app.confirmAction({
								message: phoneNb[0],
								title: trc('add_phone') + '?'
							}, function() {
								app.showMessage(trc('phone_added'), colors);
								itemHandler.updateItem(currentItem, itemDesc, {
									tags: {
										phone: phoneNb[0]
									}
								}, mapHandler);
							});
						} else {
							app.confirmAction({
								message: note,
								customView: {
									type: 'Ti.UI.View',
									properties: {
										layout: 'vertical',
										height: 'SIZE',
									},
									childTemplates: [{
										type: 'Ti.UI.TextField',
										bindId: 'textfield',
										properties: {
											rclass: 'CustomAlertTF',
											hintText: trc('enter_note_title'),
										}
									}]
								},
								title: trc('add_note') + '?'
							}, function(f) {
								if (!f.cancel) {
									var test = f.source;
									sdebug('fuck', test);
									sdebug(test.children);
									var test2 = test.textfield;
									var title = test2.value;
									if (title && title.length > 0) {
										app.showMessage(trc('note_added'), colors);
										itemHandler.updateItem(currentItem, itemDesc, {
											newNotes: [{
												title: title,
												text: note
											}]
										}, mapHandler);
									} else {
										app.showAlert(trc('enter_a_note_title'));
									}
								}
							});
						}
					}

				} else if (bindId === 'image') {
					if (imageLink) {
						app.confirmAction({
							title: trc('add_image') + '?',
							message: '',
							image: imageLink
						}, function() {
							sdebug('confirmedAction');
							self.showLoading();
							if (_.isString(imageLink)) {
								app.api.call({
									url: imageLink,
									onData: function(e) {
										var image = e.responseData;
										var imageId = moment().valueOf();
										var imageName = 'image_' + imageId + '.jpg';
										Ti.Filesystem.getFile(app.getImagePath(imageName)).write(image);
										app.showMessage(trc('photo_added'), colors);
										itemHandler.updateItem(currentItem, itemDesc, {
											newPhotos: [{
												originalLink: imageLink,
												width: image.width,
												height: image.height,
												image: imageName
											}]
										}, mapHandler);
										self.hideLoading();
									},
									onError: self.hideLoading
								});
							} else {
								var image = imageLink.image; //blob
								var imageId = moment().valueOf();
								var imageName = 'image_' + imageId + '.jpg';
								Ti.Filesystem.getFile(app.getImagePath(imageName)).write(image);
								app.showMessage(trc('photo_added'), colors);
								itemHandler.updateItem(currentItem, itemDesc, {
									newPhotos: [{
										width: image.width,
										height: image.height,
										image: imageName
									}]
								}, mapHandler);
								self.hideLoading();
							}
						});
					}

				} else if (bindId === 'more') {
					var options = ['share'];
					if (__APPLE__) {
						options.push('open_safari');
					}
					if (__ANDROID__ || Ti.Platform.canOpenURL('googlechrome://')) {
						options.push('open_chrome');
					}

					new OptionDialog({
						options: _.map(options, function(value,
							index) {
							return trc(value);
						}),
						buttonNames: [trc('cancel')],
						cancel: 0,
						tapOutDismiss: true
					}).on('click', (function(e) {
						if (!e.cancel) {
							var url = webView.url;
							var option = options[e.index];
							switch (option) {
								case 'share':
									app.share({
										text: url
									});
									break;
								case 'open_safari':
									Ti.Platform.openURL(url);
									break;
								case 'open_chrome':
									if (__APPLE__) {
										Ti.Platform.openURL(url.replace('http', 'googlechrome'));
									}
									break;
							}
						}
					})).show();
				}
			})
		}
	});

	var refreshButton = new Button({
		rclass: 'WebToolbarButton',
		title: $sRefresh,
		enabled: true
	}).on('click', app.debounce(function() {
		if (webView.loading) {
			webView.stopLoading();
		} else {
			webView.reload();
		}
	}));
	_args.rightNavButtons = [refreshButton];
	_args.bottomToolbar = toolBar;
	_args.bottomToolbarVisible = true;

	// _args.bottomToolbar = ak.ti.style({
	//     type: 'AkylasAdmob.View',
	//     properties: {
	//         rclass: 'AdmobView',
	//         // location: app.currentLocation
	//     },
	//     events: {
	//         load: function(e) {
	//             self.showBottomToolbar();
	//         }
	//     }
	// });

	var self = new AppWindow(_args);
	var loadingIndicatorView = new View({
		properties: {
			backgroundColor: '#00ffffff',
			height: $navBarHeight + $navBarTop
		},
		childTemplates: [{
			type: 'Ti.UI.View',
			bindId: 'progress',
			properties: {
				width: 0,
				left: 0,
				backgroundColor: $cTheme.dark
			}
		}]
	});
	self.container.navBar.add(loadingIndicatorView, 0);

	var hideLoadingTimer, loaded;

	function setProgress(_progress) {
		if (webView == null) {
			return;
		}
		if (_progress === 0) {
			loaded = false;
			//start loading
			loadingIndicatorView.applyProperties({
				progress: {
					width: 0,
					opacity: 1
				}
			});

			loadingIndicatorView.animate({
				backgroundColor: '#44ffffff',
				cancelRunningAnimations: true,
				duration: 600,
				restartFromBeginning: true,
				repeat: Ti.UI.INFINITE,
				autoreverse: true
			});
			if (hideLoadingTimer) {
				clearTimeout(hideLoadingTimer);
				hideLoadingTimer = null;
			}
			refreshButton.title = $sClose;
			toolBar.applyProperties({
				more: {
					enabled: false
				}
			});
		}
		if (_progress === 1) {
			loaded = true;
			var title = webView.evalJS('document.title');
			sdebug('load', title);
			self.container.applyProperties({
				titleView: {
					text: title
				}
			});
			if (!hideLoadingTimer) {
				hideLoadingTimer = setTimeout(function() {
					if (webView == null) {
						return;
					}
					loadingIndicatorView.cancelAllAnimations();
					refreshButton.title = $sRefresh;
					// sdebug('update webview', webView.canGoBack(), webView.canGoForward());
					toolBar.applyProperties({
						back: {
							enabled: webView.canGoBack()
						},
						forward: {
							enabled: webView.canGoForward()
						},
						more: {
							enabled: true
						}
					});
					if (currentItem && __APPLE__) {
						webView.evalJS(getLinkSRCAtPoint + ";");
					}
				}, 200);
			}
			//start loading
			loadingIndicatorView.progress.animate({
				width: 'FILL',
				opacity: 0,
				duration: 200
			}, function() {

			});
			// loadingIndicatorView.animate({

			// });
		} else {
			loadingIndicatorView.progress.animate({
				width: Math.round(_progress * 100) + '%',
				duration: 100
			});
		}
	}
	self.container.add(webView, 1);
	

	webView.on('load', function(e) {
			// sdebug('on load done load', e.url);
		// setProgress(1);
	}).on('loadprogress', function(e) {
		// if (e.progress !== 1) {
			sdebug('loadprogress', e.progress);
			setProgress(e.progress);
		// }
	}).on('error', function(e) {
		setProgress(1);
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

	function onClipboardChange(e) {
		if (e.text) {
			note = e.text;
		} else if (e.url) {
			note = unescape(e.url);
		}
		sdebug(note);
		if (/\.(jpg|jpeg|bmp|png)$/i.test(note)) {
			imageLink = note;
			note = '';
		}
		toolBar.applyProperties({
			image: {
				image: imageLink
			},
			note: {
				enabled: true,
				visible: note.length > 0
			}
		});
		sdebug(e, imageLink, note);
	}
	if (currentItem) {
		Ti.UI.Clipboard.on('change', onClipboardChange);
	}
	// self.onOpen = app.composeFunc(self.onOpen, function() {
	// 	if (floating) {
	// 		self.fakeBack.backgroundColor = '#88000000';
	// 	}
	// });

	//END OF CLASS. NOW GC 
	self.GC = app.composeFunc(self.GC, function() {
		if (hideLoadingTimer) {
			clearTimeout(hideLoadingTimer);
			hideLoadingTimer = null;
		}
		app.api.off('networkchange', onNetworkChange);
		refreshButton = null;
		webView = null;
		toolBar = null;
		mapHandler = null;
		self = null;
		
		Ti.UI.Clipboard.off('change', onClipboardChange);

	});
	return self;
};