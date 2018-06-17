// import {ContentModule} from '../ui/mapModules/MapModule'
import { ContentModule } from '../ui/mapModules/MapModule';
exports.settings = {
    color: '#1B85B8',
    name: 'panoramio',
    description: 'panoramio_desc',
    preferencesSections: [{
        items: [{
            id: 'copryrights',
            type: 'link',
            url: 'http://www.panoramio.com/help/copyright'
        }]
    }]
};
exports.lang = {
    en: {
        "panoramio_desc": "search and display photos from Panoramio on the map.",
    },
    fr: {
        "panoramio_desc": "cherche et affiche les photos de Panoramio sur la carte",
    }
};
exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        htmlIcon = app.utilities.htmlIcon,
        cleanUpString = app.api.cleanUpString,
        key = 'panoramio',
        self = new ContentModule(_args);

    var baseUrl = 'http://www.panoramio.com/map/get_panoramas.php';

    function geoSearch(_params, _feature, _itemHandler) {
        var region = _.remove(_params, 'region');
        return app.api.call({
            url: 'http://www.panoramio.com/map/get_panoramas.php',
            silent: _.remove(_params, 'silent'),
            params: Object.assign({
                set: 'public',
                from: 0,
                to: Ti.App.Properties.getInt('panoramio.max', 50),
                size: 'original',
                mapfilter: true,
                minx: region.sw.longitude,
                miny: region.sw.latitude,
                maxx: region.ne.longitude,
                maxy: region.ne.latitude,
            }, _params)
        }).then(function(result) {
            var results = _.map(result.photos, function(photo) {
                return itemHandler.createAnnotItem(type, parseObject(photo));
            });
            return results;
        });
    }
    var type = itemHandler.initializeType(key, {
        title: trc('panoramio'),
        defaultTitle: trc('panoramio'),
        apiMethod: geoSearch,
        apiParams: {
            to: 50,
        },
        icon: app.icons.panorama,
        color: '#1B85B8',
        iconSettings: {
            style: 0
        }
    });

    function getProp(obj, key) {
        var result = obj[key];
        if (result) {
            return result;
        }
    }

    function parseObject(_obj) {
        var props = _obj;
        var thumbnail =
            'http://mw2.google.com/mw-panoramio/photos/thumbnail/' +
            props.photo_id + '.jpg';
        var original = props.photo_file_url;
        var result = {
            panoramio: {
                id: props.photo_id,
                url: props.photo_url,
                creator: props.owner_name,
                object: props
            },
            id: props.photo_id,
            title: props.photo_title,
            thumbnail: thumbnail,
            latitude: props.latitude,
            longitude: props.longitude,
            photos: [{
                thumbnail: thumbnail,
                width: props.width,
                height: props.height,
                image: original,
                attribution: {
                    logo: '/images/panoramio_logo.png',
                    link: props.photo_url,
                    author: props.owner_name,
                    author_link: props.owner_url
                },
            }],

            timestamp: props.upload_date
        };
        return result;
    }

    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            // view = null;
        }),
        onInit: function() {},
        shouldBeEnabledByDefault: function() {
            return false;
        },
        // getSearchFilters: function() {
        //     return {
        //         id: key,
        //         icon: type.icon,
        //         color: type.color,
        //         text: key,
        //     };
        // },
        // getSearchCalls: function(memo, _params) {
        // memo[key] = _.partial(search, _params);
        // },
        // getDetailsCalls: function(memo, _query, _item, _desc) {
        // if (_item.c2c) {
        //     memo[key] = _.partial(getDetails, _item);
        // }
        // },
        getGeoFeatures: function(memo) {
            memo[key] = type;
        },
        getItemTypes: function(memo) {
            memo[key] = type;
        },

    });
    return self;
};