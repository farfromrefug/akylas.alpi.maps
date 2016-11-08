exports.data = {
    dropped: {
        defaultTitle: trc('dropped_pin'),
        title: trc('dropped'),
        icon: app.icons.circle,
        color: $cTheme.main,
        canBeHidden: true,
        settings: {}
    },
    photo: {
        showInfoWindow: true,
        isCollection: true,
        title: trc('photos'),
        defaultTitle: trc('photo'),
        icon: app.icons.camera,
        color: '#1B85B8',
        iconSettings: {
            // style: 2
        },
        settings: {
            searchKeys: ['latitude', 'longitude']
        }
    },
    searchitem: {
        iconSettings: {
            style: 0,
            scale: 0.9
        },
        hidden: true,
        title: trc('search_results'),
        defaultTitle: trc('amenity'),
        color: '#EA4C32',
        routeColor: '#88EA4C32',
        routeSelectedColor: '#EA4C32',
        routeClass:'SearchRoute',
        icon: app.icons.search,
        settings: {}
    },
    weather_station: {
        iconSettings: {
            style: 0
        },
        hidden: true,
        title: trc('weather_stations'),
        defaultTitle: trc('weather_station'),
        color: 'blue',
        icon: app.icons.weather,
        settings: {}
    },
    satitem: {
        iconSettings: {
            style: 0,
            scale: 0.9
        },
        hidden: true,
        title: trc('search_results'),
        defaultTitle: trc('amenity'),
        color: $white,
        icon: app.icons.search,
        settings: {}
    },
    peak: {
        title: trc('peaks'),
        defaultTitle: trc('peak'),
        osm: [{
            type: 'node',
            features: '[natural=peak]'
        }],
        icon: app.icons.peak,
        color: '#7EB443',
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    },
    saddle: {
        title: trc('moutain_passes'),
        defaultTitle: trc('moutain_pass'),
        osm: [{
            type: 'node',
            features: '[natural=saddle]'
        }],
        icon: app.icons.pass,
        color: '#4E3E31',
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    },
    trails: {
        title: trc('hiking trails'),
        defaultTitle: trc('hiking trail'),
        outType:'geom',
        osm: [{
            type: 'way',
            features: '[highway=path][sac_scale]',
            recurse:'<'
        // }, {
        //     type: 'node',
        //     features: '(w)',
        //     noRegion: true
        }],
        icon: String.fromCharCode(0xe801),
        color: '#c54646',
        iconSettings: {
            style: 0
        },
        usingWays: true,
        settings: {
            geofeature: true,
        }
    },
    refuge: {
        title: trc('refuges'),
        defaultTitle: trc('refuge'),
        osm: [{
            type: 'node',
            features: '[tourism~hut]'
        }, {
            type: 'way',
            features: '[tourism~hut]'
        }, {
            type: 'node',
            features: '[amenity=shelter][shelter_type!=public_transport]'
        }, {
            type: 'way',
            features: '[amenity=shelter][shelter_type!=public_transport]'
        }],
        filterFunc: function(item) {
            // return true;
            return item.tags.wall !== 'no' &&
                item.tags.building !== 'roof' &&
                item.tags.tourism !=='information';
        },
        icon: app.icons.house,
        color: '#D37724',
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    },
    sign: {
        title: trc('guideposts'),
        defaultTitle: trc('guidepost'),
        osm: [{
            type: 'node',
            features: '[information=guidepost]'
        }],
        icon: app.icons.guidepost,
        minZoom: 11,
        iconSettings: {
            style: 2
        },
        color: '#F6D23A',
        settings: {
            geofeature: true,
        }
    },

    lake: {
        title: trc('lakes'),
        defaultTitle: trc('lake'),
        osm: [{
            type: 'rel',
            features: '[natural=water]'
        }, {
            type: 'way',
            features: '[natural=water]'
        }],
        icon: app.icons.water,
        color: '#6395EE',
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    },
    water: {
        // searchable: false,
        title: trc('water_sources'),
        defaultTitle: trc('water_source'),
        osm: [{
            type: 'node',
            features: '[amenity=drinking_water]'
        }, {
            type: 'node',
            features: '[natural=spring][drinking_water=yes]'
        }],
        icon: app.icons.water,
        iconSettings: {
            style: 2,
            scale:0.8
        },
        // minZoom: 15,
        color: '#0069CE',
        settings: {
            geofeature: true,
        }
    },
    glacier: {
        // searchable: false,
        title: trc('glaciers'),
        osm: [{
            type: 'rel',
            features: '[natural=glacier]'
        }, {
            type: 'way',
            features: '[natural=glacier]'
        }],
        // features: '[amenity=drinking_water]',
        icon: app.icons.ice,
        color: '#6395EE',
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    },
    viaferrata: {
        title: trc('via_ferrata'),
        defaultTitle: trc('via_ferrata'),
        outType:'geom',
        osm: [{
            type: 'way',
            features: '[highway=via_ferrata]',
            recurse:'<'
        }],
        icon: app.icons.via_ferrata,
        color: '#D9983A',
        iconSettings: {
            style: 0
        },
        usingWays: true,
        settings: {
            geofeature: true,
            refugesinfo: false,
        }

    }
};