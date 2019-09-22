import { EventEmitter } from 'events';
import * as Utils from './utils';

declare global {
    type MBTilesGenerator = MBTilesGntr;
    type TilesRequest = TilesRq;
    interface ProviderRequestLayer extends MapTileSourceKeys, ProviderOptions {
        doneCount?: number;
        count?: number;
        token?: string;
        timestamp?: number;
    }

    interface DownloadEvent {
        request: TilesRequest;
        progress: number;
        runningRequestsCount?: number;
        doneCount?: number;
    }

    interface TilesStatus {
        status: string;
        doneCount: number;
        progress: number;
        request: TilesRequest;
    }

    interface TilesLayer extends Provider {
        token: string;
        count: number;
        doneCount: number;
        timestamp: number;
    }
}

// Promise = require('./promise-simple');
var WMS_ORIGIN_X = -20037508.34789244;
var WMS_ORIGIN_Y = 20037508.34789244;
var WMS_MAP_SIZE = 20037508.34789244 * 2;
// Number of requests for each step set.
var STEP_REQUEST_SIZE = 10;
var STEP_WAIT_TIME = 200;
var PAUSED_WAIT_TIME = 1000;
var dataDir = Ti.Filesystem.applicationDataDirectory;
var mbtilesHoldingDir = Ti.Filesystem.getFile(dataDir, 'mbtiles');
if (!mbtilesHoldingDir.exists()) {
    mbtilesHoldingDir.createDirectory();
}
var DB_DIR = mbtilesHoldingDir.nativePath;
// var tilebelt = require('@mapbox/tilebelt');

if (!_.endsWith(DB_DIR, '/')) {
    DB_DIR += '/';
}
this['_'] = this['_'] || require('lib/lodash');

Ti.App.on('mbtiles_generator_command', function(e: { command: string; token?: string; layer?: ProviderRequestLayer; bounds?: Region; minZoom?: number; maxZoom?: number }) {
    console.debug('mbtiles_generator_command', e.command, e.token);
    switch (e.command) {
        case 'start':
        case 'startpaused':
            generator.requestMBTiles(e.layer, e.bounds, e.minZoom, e.maxZoom, e.command === 'startpaused');
            break;
        case 'stop': {
            var running = mbTilesStatusService.get(e.token);
            console.debug(_.keys(running));
            if (running && running.request) {
                running.request.stop();
            }
            break;
        }
        case 'pause': {
            var running = mbTilesStatusService.get(e.token);
            if (running && running.request) {
                running.request.pause();
            }
            break;
        }
        case 'resume': {
            var running = mbTilesStatusService.get(e.token);
            if (running && running.request) {
                running.request.resume();
            }
            break;
        }
        case 'playpause': {
            var running = mbTilesStatusService.get(e.token);
            if (running && running.request) {
                running.request.playpause();
            }
            break;
        }
    }
});

// Classes
function Tile(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
// interface Request {
//   layer: Provider
//   bounds: Region
//   token: string
// }

const cartoModule = require('akylas.carto');

export class TilesRq extends EventEmitter {
    timestamp: number;
    layer: ProviderRequestLayer;
    paused = false;
    stopped = false;
    doneCount: number;
    size: number;
    count: number;
    minZoom: number;
    maxZoom: number;
    area: number;
    bounds: Region;
    dataSource: MapTileSource;
    constructor(layer: ProviderRequestLayer, public db: titanium.DatabaseDB, public token: string, public file: string, data: Utils.MBtilesInfo) {
        super();
        this.layer = _.omit(layer, 'token', 'count', 'doneCount', 'timestamp');
        const props = Object.assign(_.omit(this.layer, 'url', 'opacity', 'visible', 'layer'), this.layer.options || {}, {
            url: layer.url,
            // layer: this.layer,
            cacheable: true
            // autoHd: true
        });
        console.log('TilesRq', layer.token, layer.count, layer.doneCount, layer.timestamp, this.layer);
        console.log('props', props);
        this.dataSource = cartoModule.createTileSource(props);
        this.paused = layer.doneCount > 0;
        this.doneCount = layer.doneCount;
        this.bounds = data.bounds;
        this.timestamp = layer.timestamp || new Date().getTime();
        Object.assign(this, data);
    }

    pause = () => {
        var data = mbTilesStatusService.get(this.token);
        console.debug('pause', _.pick(data, 'doneCount', 'count', 'progress'));

        this.paused = true;
        Ti.App.emit('mbtiles_generator_state', {
            request: this,
            progress: data.progress
        });
    };
    playpause = () => {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
    };
    resume = () => {
        var data = mbTilesStatusService.get(this.token);
        console.debug('resume', _.pick(data, 'doneCount', 'count', 'progress'));
        this.paused = false;
        Ti.App.emit('mbtiles_generator_state', {
            request: this,
            progress: data.progress
        });
    };
    stop = () => {
        var data = mbTilesStatusService.get(this.token);
        console.debug('stop', _.pick(data, 'doneCount', 'count', 'progress'));
        this.db.file.deleteFile();
        this.stopped = true;
        mbTilesStatusService.remove(this.token);
        Ti.App.emit('mbtiles_generator_cancelled', {
            request: this,
            runningRequestsCount: mbTilesStatusService.getCount()
        });
    };
}
class TilesStatusService extends EventEmitter {
    mbtilesStatus: { [k: string]: TilesStatus } = {};
    /**
     * Add new MBTiles to map
     * @param token
     */
    create = (token: string, request: TilesRequest) => {
        // console.debug('create', token, request);
        if (!this.mbtilesStatus[token]) {
            this.mbtilesStatus[token] = {
                status: 'generating',
                doneCount: request.doneCount,
                progress: (request.doneCount && request.doneCount / request.count * 100) || 0,
                request: request
            };
        }
    };
    remove = (token: string) => {
        // console.debug('remove', token);
        if (this.mbtilesStatus[token]) {
            delete this.mbtilesStatus[token];
        }
    };

    /**
     * Update MBTiles status in map
     * @param token
     * @param status
     * @param progress
     */
    update = (token: string, status: string, doneCount: number, totalCount: number) => {
        // console.debug('update', token, status, doneCount, totalCount);
        var data = this.mbtilesStatus[token];
        if (data) {
            data.status = status;
            data.progress = Math.min(doneCount / totalCount * 100, 100);
            data.doneCount = doneCount;
            if (data.request) {
                Ti.App.emit('mbtiles_generator_update', {
                    request: data.request,
                    status: data.status,
                    progress: data.progress,
                    doneCount: data.doneCount
                });
                // data.request.emit('update', data);
            }
            //   console.debug('update', _.pick(data, 'doneCount', 'count', 'progress'), totalCount);
        }
    };
    get = (token: string) => {
        return this.mbtilesStatus[token];
    };
    getCount = () => {
        return _.size(this.mbtilesStatus);
    };
}

const mbTilesStatusService = new TilesStatusService();

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
var initMBTilesRequest = function(layer: ProviderRequestLayer, data: Utils.MBtilesInfo, paused = false) {
    // Create temporary sqlite DB file
    var token = layer.token || guid();
    if (/mvt|carto\.|pbf/.test(JSON.stringify(layer.url))){
      token += '_pbf'
    } 
    var file = token + '.mbtiles';
    // Ti.Database.open(token);
    var db = Ti.Database.open(token);
    // var db = Ti.Database.open(DB_DIR + file);
    // var db = new sqlite3.Database(file);
    //   console.debug('initMBTilesRequest', token, layer, data);
    var request = new TilesRq(layer, db, token, file, data);
    request.paused = paused;
    mbTilesStatusService.create(token, request);
    Ti.App.emit('mbtiles_generator_start', {
        request: request,
        progress: mbTilesStatusService.get(token).progress
    });
    return request;
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile bounds
 */
var processMBTiles = function(request: TilesRequest, bounds: Region, minZoom: number, maxZoom: number) {
    var alreadyStared = request.doneCount > 0;
    const layer = request.layer;

    return Promise.resolve()
        .then(() => {
            console.debug('Processing MBTiles for bounds:', layer, bounds, minZoom, maxZoom);
            // fs.readFile('conf/schema.sql', 'utf8', function(err, data) {
            //   if (err) {
            //     console.error('Error while loading schema: ' + err);
            //     throw err;
            //   }
            if (alreadyStared) {
                console.debug('sending already started', request.doneCount, request.count);
                mbTilesStatusService.update(request.token, 'generating', request.doneCount, request.count);
                return;
            }
            return createTables(request.db, ['CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);', 'CREATE TABLE metadata (name text, value text);']);
        })
        .then(function() {
            if (alreadyStared) {
                return;
            }
            console.debug('storing metadata', layer);
            // required MetaData for mbtiles spec
            var metaData = {
                name: layer.name,
                maxzoom: maxZoom,
                minzoom: minZoom,
                type: 'baselayer',
                version: 1,
                description: layer.attribution,
                format: 'png',
                bounds: bounds.sw.longitude + ',' + bounds.sw.latitude + ',' + bounds.ne.longitude + ',' + bounds.sw.latitude
            };
            console.debug('metaData', metaData);
            if (layer.options && layer.options.variantName) {
                metaData.name += ' (' + layer.options.variantName + ')';
            }
            // Insert metadata into db
            return insertMetadata(request.db, metaData);
        })
        .then(function() {
            // Fetch then store tiles
            return fetchAndStoreTiles(request, bounds, minZoom, maxZoom);
        })
        .then(function() {
            // All tiles have been stored. Close db.
            if (!request.stopped) {
                request.db.close();
                const newPath = DB_DIR + request.file
                //move file
                request.db.file.move(newPath);

                //get real file size now
                request.size = Ti.Filesystem.getFile(newPath).size;

                console.debug('MBTile computed successfully. File output is available in ' + newPath);
                // Persist tile state
                mbTilesStatusService.update(request.token, 'done', request.count, request.count);
                mbTilesStatusService.remove(request.token);
            }
            // Open file, send binary data to client, and remove file.
            // Ti.Filesystem.getFile(DB_DIR + token + '.sqlite').read()
            // fs.readFile(request.file, function(err, data) {
            // });
        })
        .catch(function(e) {
            console.debug('catch', e, 'for request', JSON.stringify(request));
            request.db.close();
            if (e.message !== 'stopped') {
                //else already handled
                request.stop();
                //trick to get the error to throw up
                Ti.App.emit('error', {
                    error: e
                });
                // return Promise.reject(e);
            }
        });
};

/**
 * Create mbtiles tables
 * @param db the database
 * @param data the queries to execute
 * @returns {Promise}
 */
var createTables = function(db, _tables) {
    return new Promise(function(resolve, reject) {
        try {
            //   console.debug("createTables", _tables);
            db.execute('BEGIN'); // begin the transaction
            for (var i = 0; i < _tables.length; i++) {
                db.execute(_tables[i]); // begin the transaction
            }
            db.execute('COMMIT'); // begin the transaction
            //   console.debug('createTables done');
            resolve();
        } catch (e) {
            resolve(); //already done
        }
    });
};

/**
 * Insert metadata into mbtile
 * @param db the database
 * @param metaData the metadata object
 * @returns {Promise}
 */
var insertMetadata = function(db, metaData) {
    return new Promise(function(resolve, reject) {
        console.debug('Inserting Metadata');
        // db.serialize(function() {
        // var stmt = db.prepare('INSERT INTO metadata VALUES (?, ?)');
        try {
            for (var key in metaData) {
                db.execute('INSERT INTO metadata VALUES (?, ?)', key, metaData[key]);
                // stmt.run(key, metaData[key]);
            }
            // stmt.finalize();
            console.debug('Metadata inserted successfully.');
            // });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Insert a tile using an sqlite statement
 * @param stmt the statement
 * @param tile the tile metadata
 * @param data the tile blob
 * @param callback once it is done
 */
var insertTile = function(tileData) {
    if (!tileData || !tileData.data) {
        console.error('not inserting empty tile ', tileData);
        return;
    }
    var tile = tileData.tile;
    var data = tileData.data;
    var request = tileData.request;
    // var insertTile = function(stmt, tile, data, callback) {
    request.db.execute('INSERT INTO tiles VALUES (?, ?, ?, ?)', tile.z, tile.x, (1 << tile.z) - 1 - tile.y, data);

    tileData.data = null;
    if (typeof data.clearData === 'function') {
      data.clearData();
    }
    // stmt.run(tile.z, tile.x, Math.pow(2, tile.z) - tile.y - 1, data);
    // callback();
};

/**
 * Process step by step fetch of tiles and parallel store into db
 * @param bounds the requested bounds
 * @param db the database
 * @returns {Promise} a promise resolved when finished.
 */
var fetchAndStoreTiles = function(request: TilesRequest, bounds: Region, minZoom: number, maxZoom: number) {
    // List tiles
    var tilesChunks = listTiles(request, bounds, minZoom, maxZoom); //separated in chunks
    var totalCount = (tilesChunks.length - 1) * STEP_REQUEST_SIZE + _.last(tilesChunks).length;
    var doneCount = request.doneCount || 0;
    //   console.debug('totalCount', totalCount);
    //   console.debug('doneCount', doneCount);
    //   console.debug((totalCount - doneCount) + " tiles to process.");
    var firstNeeded = Math.floor(doneCount / STEP_REQUEST_SIZE);
    //   console.debug('tilesChunks length', tilesChunks.length);
    //   console.debug('firstNeeded', firstNeeded);
    if (firstNeeded > 0) {
        tilesChunks.splice(0, firstNeeded);
    }
    //   console.debug('tilesChunks length', tilesChunks.length);
    // Start off with a promise that always resolves
    return _.reduce(
        tilesChunks,
        function(sequence, tiles, i) {
            sequence = sequence
                .then(function() {
                    return new Promise(function(resolve, reject) {
                        if (!!request.stopped) {
                            throw 'stopped';
                        }
                        var wait = function() {
                            if (!!request.paused) {
                                setTimeout(wait, PAUSED_WAIT_TIME);
                            } else {
                                resolve();
                            }
                        };
                        if (!!request.paused) {
                            wait();
                        } else {
                            setTimeout(resolve, STEP_WAIT_TIME);
                        }
                    });
                })
                .then(function() {
                    // console.debug('fetching', tiles.length, 'tiles');
                    return fetchTilesChunk(request, tiles);
                })
                .then(function() {
                    // console.debug('finished fetching');
                    mbTilesStatusService.update(request.token, 'generating', (i + firstNeeded + 1) * STEP_REQUEST_SIZE, totalCount);
                });
            return sequence;
        },
        Promise.resolve()
    ).then(function() {
        console.debug('Rendering done');
        mbTilesStatusService.remove(request.token);
        setTimeout(function() {
            Ti.App.emit('mbtiles_generator_done', {
                request: request,
                runningRequestsCount: mbTilesStatusService.getCount()
            });
        }, 0);
    });
};

var countTiles = function(layer, bounds, minZoom, maxZoom) {
    var count = 0;

    for (var z = minZoom; z <= maxZoom; z++) {
        var coords1 = Utils.latLngToTileXYForZoom(bounds.ne.latitude, bounds.sw.longitude, z);
        var coords2 = Utils.latLngToTileXYForZoom(bounds.sw.latitude, bounds.ne.longitude, z);
        // Adjust to process at least one tile for each zoom (lower zoom levels)
        if (coords1[0] === coords2[0]) {
            coords2[0] += 1;
        }
        if (coords1[1] === coords2[1]) {
            coords2[1] += 1;
        }
        count += (Math.max(coords1[0], coords2[0]) - Math.min(coords1[0], coords2[0]) + 1) * (Math.max(coords1[1], coords2[1]) - Math.min(coords1[1], coords2[1]) + 1);
    }
    console.debug('countTiles', bounds, minZoom, maxZoom, count);
    return count;
};

/**
 * Make a list of the necessary tiles to compute and embed into the mbtile according to bounds.
 * @param bounds the requested bounds
 * @returns {Array} the array of tiles
 */

interface Tile {
    x: number;
    y: number;
    z: number;
}
var listTiles = function(request: TilesRequest, bounds: Region, minZoom: number, maxZoom: number) {
    var tiles: Tile[][] = [];
    var layer = request.layer;

    var chunk: Tile[];
    var counter = 0,
        totalCount = 0;

    for (var z = minZoom; z <= maxZoom; z++) {
        var coords1 = Utils.latLngToTileXYForZoom(bounds.sw.latitude, bounds.sw.longitude, z);
        var coords2 = Utils.latLngToTileXYForZoom(bounds.ne.latitude, bounds.ne.longitude, z);
        // var coords1 = latLngToTileXYForZoom(bounds.ne.latitude, bounds.sw.longitude, z);
        // var coords2 = latLngToTileXYForZoom(bounds.sw.latitude, bounds.ne.longitude, z);
        // Adjust to process at least one tile for each zoom (lower zoom levels)
        // if (coords1[0] === coords2[0]) {
        //     coords2[0] += 1;
        // }
        // if (coords1[1] === coords2[1]) {
        //     coords2[1] += 1;
        // }

        for (var y = Math.min(coords1[1], coords2[1]); y <= Math.max(coords1[1], coords2[1]); y++) {
          for (var x = Math.min(coords1[0], coords2[0]); x <= Math.max(coords1[0], coords2[0]); x++) {
                if (counter == 0) {
                    chunk = [];
                    tiles.push(chunk);
                }
                // var t = new Tile(x, y, z);
                chunk.push({
                    x: x,
                    y: y,
                    z: z
                });
                totalCount++;
                counter = (counter + 1) % STEP_REQUEST_SIZE;
            }
        }
    }
    //   console.debug('Listing tiles for bounds', bounds, minZoom, maxZoom, totalCount++, ((tiles.length - 1) * STEP_REQUEST_SIZE + _.last(tiles).length));
    return tiles;
};

/**
 * Closure for tile fetch
 * @param tiles the set of tiles to fetch
 * @param stmt the statement to run queries in
 * @returns {Function} the function
 */
var fetchTilesChunk = function(request: TilesRequest, tiles: Tile[]) {
    return Promise.resolve()
        .then(function() {
            // console.debug('BEGIN');
            request.db.execute('BEGIN'); // begin the transaction
        })
        .then(function() {
            // return _.reduce(tiles, function (m, tile) {

            //   m = m.then(function () {
            //     return fetchTile(request, tile).then(insertTile);
            //   });
            //   return m;
            // }, Promise.resolve());
            return Promise.all(
                _.map(tiles, function(tile) {
                    return fetchTile(request, tile);
                })
            );
        })
        .then(function(result) {
            // console.log('fetched', result.length);
            result.forEach(insertTile);
            result = null;
        })
        .then(function() {
            // console.debug('COMMIT');
            request.db.execute('COMMIT'); // end the transaction
        });
    // return new Promise(function (resolve, reject) {
    //   _(tiles).map(_.partial(fetchTile, request)).reduce(function (sequence, fetchPromise) {
    //     // Use reduce to chain the promises together,
    //     // adding content to the page for each chapter
    //     return sequence.then(function () {
    //       // Wait for everything in the sequence so far,
    //       // then wait for this chapter to arrive.
    //       return fetchPromise;
    //     }).then(function (data) {
    //       if (data) {
    //         insertTile(data.request, data.tile, data.data)
    //         data = null;
    //       }
    //     });
    //   }, Promise.resolve().then(function () {
    //     // console.debug('BEGIN');
    //     request.db.execute('BEGIN'); // begin the transaction
    //   })).then(function () {
    //     // console.debug('COMMIT');
    //     request.db.execute('COMMIT'); // end the transaction
    //     resolve();
    //   }).catch(function (e) {
    //     reject(e);
    //   });
    // });
    // return function() {

    //   for (var i = 0; i < tiles.length; i++) {
    //     var t = tiles[i];
    //     fetchTile(request, t, 0, function(data) {
    //       // Once fetch is done, store tile
    //       // insertTile(stmt, t, data, next);
    //       insertTile(request, t, data, next);
    //     });
    //   }
    //   request.db.execute('COMMIT'); // begin the transaction
    // };
};

function getSubdomain(t: Tile, subdomains: String) {
    // console.debug('getSubdomain', subdomains);
    if (subdomains) {
        var index = (t.x + t.y) % subdomains.length;
        return subdomains.charAt(index);
    } else {
        return '';
    }
}

function getTileUrl(request: TilesRequest, t: Tile) {
    var url = request.layer.url.replace('{s}', getSubdomain(t, request.layer.subdomains || 'abc'));
    if (url.indexOf('{bbox}') >= 0) {
        var tileSize = WMS_MAP_SIZE / Math.pow(2, t.z);
        var minx = WMS_ORIGIN_X + t.x * tileSize;
        var maxx = WMS_ORIGIN_X + (t.x + 1) * tileSize;
        var miny = WMS_ORIGIN_Y - (t.y + 1) * tileSize;
        var maxy = WMS_ORIGIN_Y - t.y * tileSize;
        return url.replace('{bbox}', minx + ',' + miny + ',' + maxx + ',' + maxy);
    } else {
        return url
            .replace('{x}', t.x + '')
            .replace('{y}', t.y + '')
            .replace('{z}', t.z + '');
    }
}

var fetchTile = function(request: TilesRequest, t: Tile) {
    var dataSource = request.dataSource;

    // var url = getTileUrl(request, t);
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // function get(request, gattempts, resolve, reject) {
        //     var wait = function() {
        //         if (!!request.paused) {
        //             setTimeout(function() {
        //                 get(request, gattempts, resolve, reject);
        //             }, PAUSED_WAIT_TIME);
        //         }
        //     };
        //     if (!!request.paused) {
        //         wait();
        //         return;
        //     }
        const data = dataSource.getTileData(t.x, t.y, t.z, function(e) {
            if (e) {
                resolve({
                    data: e.data,
                    tile: t,
                    request: request
                });
            } else {
                reject('empty response');
            }
        });

        // console.debug('fetchTile', url, request.layer.userAgent, gattempts);
        // Do the usual XHR stuff
        // var req = new HTTPClient({
        //     headers: request.layer.userAgent && {
        //         'User-Agent': request.layer.userAgent
        //     },
        //     onload: function(e) {
        //         // console.debug('onload', url);
        //         if (request.stopped) {
        //             reject(Error('stopped'));
        //         } else if (!request.stopped && this.responseData) {
        //             // callback(e.data.toBase64());
        //             resolve({
        //                 data: this.responseData,
        //                 tile: t,
        //                 request: request
        //             });
        //             // } else if (attempts < 3) {
        //             // fetchTile(request, t, attempts++, callback);
        //         } else {
        //             reject(Error('no data for url:' + url));
        //         }
        //     },
        //     onerror: function(e) {
        //         console.debug('onerror', url, gattempts, e.code, e.error);
        //         if (request.stopped) {
        //             reject('stopped');
        //         } else if (request.paused) {
        //             wait();
        //         } else if (gattempts < 3) {
        //             setTimeout(function() {
        //                 get(request, gattempts + 1, resolve, reject);
        //             }, 2000);
        //         } else {
        //             reject(e.error);
        //         }
        //     }
        // });
        // req.open('GET', url);
        // Make the request
        // req.send();
        // }
        // get(request, 0, resolve, reject);
    });
};

/**
 * Remove all MBTiles which have no reference in the app or which have been downloaded already.
 */
// exports.removeOldMBTiles = function () {
//   mbTilesStatusService.remove(token);
// };

export class MBTilesGntr {
    /**
     * Retrieve MBTiles data for current token.
     * @param token
     */
    getMBTilesState(token: string) {
        return mbTilesStatusService.get(token);
    }

    /**
     * Returns the future token to retrieve MBTiles once ready.
     * @param bounds the MBTiles bounds
     * @returns a string value
     */
    requestMBTiles(layer: ProviderRequestLayer, bounds: Region, minZoom: number, maxZoom: number, paused = false) {
        console.log('requestMBTiles', layer, bounds, minZoom, maxZoom, paused);
        var data = Utils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom);
        if (layer.token && layer.doneCount > 0) {
            //resuming force same minZoom, maxZoom
        } else {
            layer.doneCount = 0;
            minZoom = Math.max(Math.max(1, layer.minZoom || 0), minZoom);
            maxZoom = Math.min(Math.min(22, layer.maxZoom || 22), maxZoom);
        }

        console.debug('requestMBTiles', bounds, minZoom, maxZoom);
        var request = initMBTilesRequest(layer, data, paused);
        processMBTiles(request, bounds, minZoom, maxZoom);
        return request;
    }

    /**
     * Returns a promise whose resolution will return an mbtile with the requested bounds.
     * @param bounds
     * @returns {Promise} the MBTile
     */
    requestMBTilesSync(layer: ProviderRequestLayer, bounds: Region, minZoom: number, maxZoom: number) {
        var request = initMBTilesRequest(layer, Utils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom));
        processMBTiles(request, bounds, minZoom, maxZoom);
        return request;
    }
}

const generator = new MBTilesGntr();
exports.load = function(_context) {
    return generator as MBTilesGenerator;
};
