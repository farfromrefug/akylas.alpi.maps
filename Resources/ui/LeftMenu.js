ak.ti.constructors.createLeftMenu = function(_args) {

    function createIconItem(_icon, _id, _text) {
        return app.templates.row.cloneTemplateAndFill('menu', {
            properties: {
                callbackId: _id,
            },
            icon: {
                text: _icon
            },
            label: {
                text: _text || trc(_id)
            }
        });
    }

    // function createSwitchItem(_icon, _id, _value) {
    //     return app.templates.row.cloneTemplateAndFill('menuswitch', {
    //         // template: 'switch',
    //         properties: {
    //             callbackId: _id,
    //         },
    //         icon: {
    //             text: _icon
    //         },
    //         label: {
    //             text: trc(_id)
    //         },
    //         switch: {
    //             callbackId: _id,
    //             value: _value
    //         }
    //     });
    // }
    var aboutText = app.info.publisher + ' v' + app.info.version;
    if (app.info.deployType !== 'production') {
        aboutText += '.' + app.info.buildNumber + '\nbuild: ' + moment(app.info.buildDate).format('lll') + '\n';
    }
    var devModeCount = 0,
        devModeTimer;
    var self = new View({
        properties: _args,
        childTemplates: [{
                properties: {
                    rid: 'leftMenuAbout'
                },
                childTemplates: [{
                    type: 'Ti.UI.Label',
                    properties: {
                        rid: 'leftMenuAboutLogo'
                    },
                    events: {
                        click: function() {
                            if (devModeTimer) {
                                clearTimeout(devModeTimer);
                                devModeTimer = null;
                            }
                            devModeCount++;
                            devModeTimer = setTimeout(function() {
                                devModeCount = 0;
                            }, 1000);
                            if (devModeCount === 9) {
                                app.confirmAction({
                                    tapOutDismiss:false,
                                    message:'',
                                    customView: {

                                        type: 'Ti.UI.TextField',
                                        bindId: 'textfield',
                                        properties: {
                                            rclass: 'CustomAlertTF',
                                            hintText: trc('enter_password'),
                                        }
                                    },
                                    title: trc('developer_mode')
                                }, function(e) {
                                    if (!e.cancel && e.source.textfield.value ===
                                        app.servicesKeys.akylas) {
                                        app.setDeveloperMode(!app.developerMode);

                                    }
                                });
                            }
                        }
                    }
                }, {
                    type: 'Ti.UI.Label',
                    properties: {
                        rid: 'leftMenuAboutMain'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    properties: {
                        rid: 'leftMenuAboutSub',
                        text: aboutText
                    }
                }],
            }, {
                // type:'Ti.UI.View'
            },
            // createSwitchItem(String.fromCharCode(0xe096), 'offline_mode', app.offlineMode),
            createIconItem('\ue28f', 'modules'),
            createIconItem($sSettings, 'settings'),
            createIconItem('\ue1ec', 'send_feedback')
        ].concat((app.info.deployType === 'development' && app.modules.plcrashreporter) ? [
            createIconItem('\ue601', 'trigger_crash')
        ] : []),
        events: {
            click: app.debounce(function(e) {
                sdebug('click', e);
                var callbackId = e.source.callbackId || e.bindId;
                switch (callbackId) {
                    case 'trigger_crash':
                        app.modules.plcrashreporter.triggerCrash();
                        break;
                    case 'send_feedback':
                        Ti.UI.createEmailDialog({
                            subject: "[" + app.info.name + "][Feedback]",
                            toRecipients: ['contact@akylas.fr'],
                            // barColor: $cTheme.main,
                            // html:true,
                            messageBody: (JSON.stringify(app.deviceinfo) +
                                '\n' + JSON.stringify(app.info))
                        }).open();
                        break;
                    case 'modules':
                        app.ui.createAndOpenWindow('ModulesWindow');
                        break;
                    case 'settings':
                        app.ui.createAndOpenWindow('SettingsWindow');
                        break;
                }
                // alert('click', callbackId);
            }),
            change: app.debounce(function(e) {
                var callbackId = e.source.callbackId || e.bindId;
                // alert('change' + callbackId +  e.source);
                switch (callbackId) {
                    case 'offline_mode':
                        app.setOfflineMode(e.value);
                        break;
                }
            })
        }

    });

    // ak.ti.add(self, {
    //     properties: {
    //         rid: 'leftMenuAboutRow'
    //     },
    //     childTemplates: [{
    //         type: 'Ti.UI.Label',
    //         bindId: 'main',
    //         properties: {
    //             rid: 'leftMenuAboutRowMain'
    //         }
    //     }, {
    //         type: 'Ti.UI.Label',
    //         properties: {
    //             rid: 'leftMenuAboutRowSub',
    //             text: aboutText
    //         }
    //     }],
    //     events: {
    //         click: app.debounce(function() {
    //             if (app.modules.testfairy) {
    //                 app.modules.testfairy.submitFeedback();
    //             }
    //         })
    //     }
    // });

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        self = null;
    });
    return self;
};