// import MapModule from './MapModule'
import { MapModule } from './MapModule';
// import * as convert from '../../lib/convert';
import * as Utils from '../../lib/mbtilesgenerator/utils';

// exports.settings = {
//     name: trc('waymarktrails'),
//     description: 'waymarktrails_desc'
// };

export class WayMarkedTrailsModule extends MapModule {
    constructor(_context, _args, _additional) {
        super(_args);
    }
    GC() {
        super.GC();
    }
    jsonSources: { [k: string]: MapTileSource } = {};
    getAPIUrl(id: string) {
        return 'https://' + id + '.waymarkedtrails.org/api';
    }
    getJSONTileSource = (id: string) => {
        if (!this.jsonSources[id]) {
            this.jsonSources[id] = new MapTileSource({
                url: this.getAPIUrl(id) + '/tiles/{z}/{x}/{y}.json'
            });
        }
        return this.jsonSources[id];
    };
    onTileClicked = e => {
        const tile = e.tile;
        let sourceId;
        if (tile.sourceid === 'lonvia.hikingroutes') {
            sourceId = 'hiking';
        } else if (tile.sourceid === 'lonvia.cycleroutes') {
            sourceId = 'cycling';
        }
        console.log('onTileClicked', tile, sourceId, this.parent.getZoom());
        if (sourceId) {
            let dataSource = this.getJSONTileSource(sourceId);
            var t = Utils.latLngToTileXYForZoom(tile.latitude, tile.longitude, 12);
            dataSource.getTileData(t[0], t[1], 12, e2 => {
                // console.log('got tile data', e2.data.text);
                if (e) {
                    dataSource.searchFeatures(
                        {
                            radius: 400 / this.parent.getZoom(),
                            position: [tile.latitude, tile.longitude],
                            geojson: e2.data
                        },
                        (results: any[]) => {
                            if (results.length > 0) {
                                console.log('searchResusts', results);
                                const relations = _.uniq(_.flattenDeep(results.map(r => JSON.parse(r.toprelations))));
                                console.log('relations', relations);
                                const apiURL = this.getAPIUrl(sourceId);
                                if (relations.length === 1) {
                                    app.api.getJSON(apiURL + '/details/relation/' + relations[0]).then(r => {
                                        console.debug(r);
                                        app.showMessage(r.name);
                                    });
                                } else if (relations.length > 1) {
                                    console.log('relations', relations);
                                    app.api.getJSON(apiURL + '/list/by-ids', { ids: relations }).then(results => {
                                        console.debug(results);
                                        app.showMessage(results.results.map(r=>r.name).join(' '));
                                    });
                                }
                            }
                        }
                    );
                }
            });
        }
    };
}
export function create(_context, _args, _additional) {
    return new WayMarkedTrailsModule(_context, _args, _additional);
}
