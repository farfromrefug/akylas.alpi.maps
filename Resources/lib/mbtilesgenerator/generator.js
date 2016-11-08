var Promise = require('./promise-simple');
var Utils = require('./utils');
var WMS_ORIGIN_X = -20037508.34789244;
var WMS_ORIGIN_Y = 20037508.34789244;
var WMS_MAP_SIZE = 20037508.34789244 * 2;
// Number of requests for each step set.
var STEP_REQUEST_SIZE = 30;
var dataDir = Ti.Filesystem.applicationDataDirectory;
var mbtilesHoldingDir = Ti.Filesystem.getFile(dataDir, 'mbtiles');
if (!mbtilesHoldingDir.exists()) {
  mbtilesHoldingDir.createDirectory();
}
var DB_DIR = mbtilesHoldingDir.nativePath;
if (!_.endsWith(DB_DIR, '/')) {
  DB_DIR += '/';
}
this['_'] = this['_'] || require('lib/lodash');

Ti.App.on('mbtiles_generator_command', function(e) {
  Ti.API.debug('mbtiles_generator_command', e.command, e.token);
  switch (e.command) {
    case 'start':
      requestMBTiles(e.layer, e.bounds, e.minZoom, e.maxZoom);
      break;
    case 'stop':
      {
        var running = mbTilesStatusService.get(e.token);
        sdebug(_.keys(running));
        if (running && running.request) {
          running.request.stop();
        }
        break;
      }
    case 'pause':
      {
        var running = mbTilesStatusService.get(e.token);
        if (running && running.request) {
          running.request.pause();
        }
        break;
      }
    case 'resume':
      {
        var running = mbTilesStatusService.get(e.token);
        if (running && running.request) {
          running.request.resume();
        }
        break;
      }
    case 'playpause':
      {
        var running = mbTilesStatusService.get(e.token);
        if (running && running.request) {
          running.request.playpause();
        }
        break;
      }
  }
});
/**
 * Get Tile x y from Latitude, Longitude and tile numbers
 * @param lat in degrees
 * @param lng in degrees
 * @param z
 * @returns {*[]}
 */
var latLngToTileXYForZoom = function(lat, lng, z) {
  var n = Math.pow(2, z);
  var x = n * ((lng + 180) / 360);
  var latRad = lat * 2 * Math.PI / 360;
  var y = n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2;
  return [Math.floor(x), Math.floor(y)];
};




// Classes
function Tile(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

var mbTilesStatusService = (function() {
  var self = new MicroEvent({
    mbtilesStatus: {},
    /**
     * Add new MBTiles to map
     * @param token
     */
    create: function(token, request) {
      // sdebug('create', token, request);
      if (!this.mbtilesStatus[token]) {
        this.mbtilesStatus[token] = {
          status: "generating",
          doneCount: request.doneCount,
          progress: ((request.doneCount && (request.doneCount / request.count * 100)) || 0),
          request: request
        };
      }
    },
    remove: function(token) {
      // sdebug('remove', token);
      if (this.mbtilesStatus[token]) {
        delete this.mbtilesStatus[token];
      }
    },

    /**
     * Update MBTiles status in map
     * @param token
     * @param status
     * @param progress
     */
    update: function(token, status, doneCount, totalCount) {
      // sdebug('update', token, status, doneCount, totalCount);
      var data = this.mbtilesStatus[token];
      if (data) {
        data.status = status;
        data.progress = doneCount / totalCount * 100;
        data.doneCount = doneCount;
        if (data.request) {
          Ti.App.emit('mbtiles_generator_update', {
            request: data.request,
            status: data.status,
            progress: data.progress,
            doneCount: data.doneCount,
          });
          // data.request.emit('update', data);
        }
        sdebug('update', _.pick(data, 'doneCount', 'count', 'progress'), totalCount);
    }
    },
    get: function(token) {
      return this.mbtilesStatus[token];
    },
    getCount: function() {
      return _.size(this.mbtilesStatus);
    }

  });
  return self;
})();

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
var initMBTilesRequest = function(layer, data) {
  // Create temporary sqlite DB file
  var token = layer.token || guid();
  var file = token + '.mbtiles';
  // Ti.Database.open(token);
  var db = Ti.Database.open(token);
  // var db = Ti.Database.open(DB_DIR + file);
  // var db = new sqlite3.Database(file);
  sdebug('initMBTilesRequest', token, layer, data);
  var request = new MicroEvent(_.assign(data, {
    layer: _.omit(layer, 'token', 'count', 'doneCount', 'timestamp'),
    timestamp: layer.timestamp || (new Date()).getTime(),
    db: db,
    token: token,
    paused: layer.doneCount > 0,
    doneCount: layer.doneCount,
    file: file,
    pause: function() {
      var data = mbTilesStatusService.get(this.token);
      sdebug('pause', _.pick(data, 'doneCount', 'count', 'progress'));
      
      this.paused = true;
      Ti.App.emit('mbtiles_generator_state', {
        request: this,
        progress: data.progress
      });
    },
    playpause: function() {
      if (this.paused) {
        this.resume();
      } else {
        this.pause();
      }
    },
    resume: function() {
      var data = mbTilesStatusService.get(this.token);
      sdebug('resume', _.pick(data, 'doneCount', 'count', 'progress'));
      this.paused = false;
      Ti.App.emit('mbtiles_generator_state', {
        request: this,
        progress: data.progress
      });
    },
    stop: function() {
      var data = mbTilesStatusService.get(this.token);
      sdebug('stop', _.pick(data, 'doneCount', 'count', 'progress'));
      
      this.stopped = true;
      mbTilesStatusService.remove(this.token);
      Ti.App.emit('mbtiles_generator_cancelled', {
        request: this,
        runningRequestsCount: mbTilesStatusService.getCount()
      });
    }
  }));
  mbTilesStatusService.create(token, request);
  Ti.App.emit('mbtiles_generator_start', {
    request: request,
    progress: mbTilesStatusService.get(token).progress
  });
  return request;
};

/**
 * Returns the future token to retrieve MBTiles once ready.
 * @param bounds the MBTiles bounds
 * @returns a string value
 */
var requestMBTiles = exports.requestMBTiles = function(layer, bounds, minZoom, maxZoom) {
  var data = Utils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom);
  if (layer.token && layer.doneCount > 0) {
    //resuming force same minZoom, maxZoom
  } else {
    minZoom = Math.max(Math.max(1, layer.minZoom || 0), minZoom);
    maxZoom = Math.min(Math.min(22, layer.maxZoom || 22), maxZoom);
  }

  sdebug('requestMBTiles', bounds, minZoom, maxZoom);
  var request = initMBTilesRequest(layer, data);
  processMBTiles(request, bounds, minZoom, maxZoom);
  return request;
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile
 */
exports.requestMBTilesSync = function(layer, bounds, minZoom, maxZoom) {
  var request = initMBTilesRequest(layer, Utils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom))
  processMBTiles(request, bounds, minZoom, maxZoom);
  return request;
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile bounds
 */
var processMBTiles = function(request, bounds, minZoom, maxZoom) {

  return new Promise(function(resolve, reject) {
    sdebug("Processing MBTiles for bounds:" + JSON.stringify(bounds));
    var layer = request.layer;
    // fs.readFile('conf/schema.sql', 'utf8', function(err, data) {
    //   if (err) {
    //     console.error('Error while loading schema: ' + err);
    //     throw err;
    //   }
    var alreadyStared = request.doneCount > 0;
    var promise = Promise.resolve().then(function() {
        if (alreadyStared) {
          sdebug('sending already started', request.doneCount, request.count);
          mbTilesStatusService.update(request.token, "generating", request.doneCount, request.count);
          return;
        }
        return createTables(request.db, [
          "CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);",
          "CREATE TABLE metadata (name text, value text);"
        ])
      }).then(function() {
        if (alreadyStared) {
          return;
        }
        sdebug('storing metadata');
        // required MetaData for mbtiles spec
        var metaData = {
          "name": layer.name,
          maxzoom:maxZoom,
          minzoom:minZoom,
          "type": "baselayer",
          "version": 1,
          "description": layer.attribution,
          "format": "png",
          "bounds": bounds.sw.longitude + ',' + bounds.sw.latitude + ',' + bounds.ne.longitude + ',' +
            bounds
            .sw.latitude
        };
        sdebug('metaData', metaData);
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
          //move file
          Ti.Filesystem.getFile(request.db.nativePath).move(DB_DIR + request.file);
          
          //get real file size now
          request.size = Ti.Filesystem.getFile(DB_DIR + request.file).size;
          
          sdebug('MBTile computed successfully. File output is available in ' + request.file);
          // Persist tile state
          mbTilesStatusService.update(request.token, "done", request.count, request.count);
          mbTilesStatusService.remove(request.token);
          // Open file, send binary data to client, and remove file.
          // Ti.Filesystem.getFile(DB_DIR + token + '.sqlite').read()
          // fs.readFile(request.file, function(err, data) {
          resolve(request);
        }

        // });
        // });

      }).catch(reject);
    // });
  }).catch(function(e) {
    sdebug('catch', e, 'for request', JSON.stringify(request));
    request.db.close();
    // request.db.remove();
    mbTilesStatusService.remove(request.token);
    sdebug('about to remove', DB_DIR + request.file);
    // Ti.Filesystem.getFile(DB_DIR + request.file).deleteFile();
    Ti.Filesystem.getFile(request.db.nativePath).deleteFile();
    if (e.message !== 'stopped') {
      request.emit('mbtiles_generator_cancelled', {
        request: e.request,
        runningRequestsCount: mbTilesStatusService.getCount()
      });
      sdebug('processMBTiles error:', e);
      //trick to get the error to throw up
      setTimeout(function() {
        throw e;
      }, 0);
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
      sdebug("createTables", _tables);
      db.execute('BEGIN'); // begin the transaction
      for (var i = 0; i < _tables.length; i++) {
        db.execute(_tables[i]); // begin the transaction
      }
      db.execute('COMMIT'); // begin the transaction
      sdebug('createTables done');
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
    sdebug('Inserting Metadata');
    // db.serialize(function() {
    // var stmt = db.prepare('INSERT INTO metadata VALUES (?, ?)');
    for (var key in metaData) {
      db.execute('INSERT INTO metadata VALUES (?, ?)', key, metaData[key]);
      // stmt.run(key, metaData[key]);
    }
    // stmt.finalize();
    sdebug('Metadata inserted successfully.');
    // });
    resolve();
  });
};

/**
 * Insert a tile using an sqlite statement
 * @param stmt the statement
 * @param tile the tile metadata
 * @param data the tile blob
 * @param callback once it is done
 */
var insertTile = function(request, tile, data) {
  // var insertTile = function(stmt, tile, data, callback) {
  // sdebug('Inserting Tile');
  request.db.execute('INSERT INTO tiles VALUES (?, ?, ?, ?)', tile.z, tile.x, Math.pow(2, tile.z) - tile.y - 1, data);
  // stmt.run(tile.z, tile.x, Math.pow(2, tile.z) - tile.y - 1, data);
  // callback();
};

/**
 * Process step by step fetch of tiles and parallel store into db
 * @param bounds the requested bounds
 * @param db the database
 * @returns {Promise} a promise resolved when finished.
 */
var fetchAndStoreTiles = function(request, bounds, minZoom, maxZoom) {
  // List tiles
  var tilesChunks = listTiles(request, bounds, minZoom, maxZoom); //separated in chunks
  var totalCount = ((tilesChunks.length - 1) * STEP_REQUEST_SIZE + _.last(tilesChunks).length);
  var doneCount = request.doneCount || 0;
  sdebug('totalCount', totalCount);
  sdebug('doneCount', doneCount);
  sdebug((totalCount - doneCount) + " tiles to process.");
  var firstNeeded = Math.floor(doneCount / STEP_REQUEST_SIZE);
  sdebug('tilesChunks length', tilesChunks.length);
  sdebug('firstNeeded', firstNeeded);
  if (firstNeeded > 0) {
    tilesChunks.splice(0, firstNeeded);
  }
  sdebug('tilesChunks length', tilesChunks.length);
  // Start off with a promise that always resolves
  return _.reduce(tilesChunks, function(sequence, tiles, i) {
    sequence = sequence.then(function() {
      return new Promise(function(resolve, reject) {
        if (!!request.stopped) {
          throw 'stopped';
        }
        var wait = function() {
          if (!!request.paused) {
            setTimeout(wait, 2000);
          } else {
            resolve();
          }
        }
        if (!!request.paused) {
          wait();
        } else {
          setTimeout(resolve, 100);
        }
      });
    }).then(function() {
      // sdebug('fetching', tiles.length, 'tiles');
      return fetchTilesFunction(request, tiles);
    }).then(function() {
      // sdebug('finished fetching');
      mbTilesStatusService.update(request.token, "generating", (i + firstNeeded + 1) * STEP_REQUEST_SIZE,
        totalCount);
    });
    return sequence;
  }, Promise.resolve()).then(function() {
    sdebug('Rendering done');
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

    var coords1 = latLngToTileXYForZoom(bounds.ne.latitude, bounds.sw.longitude, z);
    var coords2 = latLngToTileXYForZoom(bounds.sw.latitude, bounds.ne.longitude, z);
    // Adjust to process at least one tile for each zoom (lower zoom levels)
    if (coords1[0] === coords2[0]) {
      coords2[0] += 1;
    }
    if (coords1[1] === coords2[1]) {
      coords2[1] += 1;
    }
    count += (Math.max(coords1[0], coords2[0]) - Math.min(coords1[0], coords2[0]) + 1) *
      (Math.max(coords1[1], coords2[1]) - Math.min(coords1[1], coords2[1]) + 1);

  }
  sdebug('countTiles', bounds, minZoom, maxZoom, count);
  return count;
};

/**
 * Make a list of the necessary tiles to compute and embed into the mbtile according to bounds.
 * @param bounds the requested bounds
 * @returns {Array} the array of tiles
 */
var listTiles = function(request, bounds, minZoom, maxZoom) {
  var tiles = [];
  var layer = request.layer;

  var chunk;
  var counter = 0, totalCount = 0;

  for (var z = minZoom; z <= maxZoom; z++) {
    var coords1 = latLngToTileXYForZoom(bounds.ne.latitude, bounds.sw.longitude, z);
    var coords2 = latLngToTileXYForZoom(bounds.sw.latitude, bounds.ne.longitude, z);
    // Adjust to process at least one tile for each zoom (lower zoom levels)
    if (coords1[0] === coords2[0]) {
      coords2[0] += 1;
    }
    if (coords1[1] === coords2[1]) {
      coords2[1] += 1;
    }

    for (var x = Math.min(coords1[0], coords2[0]); x <= Math.max(coords1[0], coords2[0]); x++) {
      for (var y = Math.min(coords1[1], coords2[1]); y <= Math.max(coords1[1], coords2[1]); y++) {
        if (counter == 0) {
          chunk = [];
          tiles.push(chunk);
        }
        // var t = new Tile(x, y, z);
        chunk.push({
          x: x,
          y: y,
          z: z,
        });
        totalCount++;
        counter = (counter + 1) % STEP_REQUEST_SIZE;
      }
    }
  }
  sdebug('Listing tiles for bounds', bounds, minZoom, maxZoom, totalCount++, ((tiles.length - 1)*STEP_REQUEST_SIZE + _.last(tiles).length));
  return tiles;

};

/**
 * Closure for tile fetch
 * @param tiles the set of tiles to fetch
 * @param stmt the statement to run queries in
 * @returns {Function} the function
 */
var fetchTilesFunction = function(request, tiles) {
  return new Promise(function(resolve, reject) {
    _(tiles).map(_.partial(fetchTile, request)).reduce(function(sequence, fetchPromise) {
      // Use reduce to chain the promises together,
      // adding content to the page for each chapter
      return sequence.then(function() {
        // Wait for everything in the sequence so far,
        // then wait for this chapter to arrive.
        return fetchPromise;
      }).then(function(data) {
        if (data) {
          insertTile(data.request, data.tile, data.data)
        }
      });
    }, Promise.resolve().then(function() {
      // sdebug('BEGIN');
      request.db.execute('BEGIN'); // begin the transaction
    })).then(function() {
      // sdebug('COMMIT');
      request.db.execute('COMMIT'); // end the transaction
      resolve();
    }).catch(function(e) {
      reject(e);
    });
  });
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

function getSubdomain(t, subdomains) {
  // sdebug('getSubdomain', subdomains);
  if (subdomains) {
    var index = (t.x + t.y) % subdomains.length;
    return subdomains.charAt(index);
  } else {
    return '';
  }
}

function getTileUrl(request, t) {
  var url = request.layer.url.replace('{s}', getSubdomain(t, request.layer.subdomains || 'abc'));
  if (url.indexOf('{bbox}') >= 0) {
    var tileSize = WMS_MAP_SIZE / Math.pow(2, t.z);
    var minx = WMS_ORIGIN_X + t.x * tileSize;
    var maxx = WMS_ORIGIN_X + (t.x + 1) * tileSize;
    var miny = WMS_ORIGIN_Y - (t.y + 1) * tileSize;
    var maxy = WMS_ORIGIN_Y - t.y * tileSize;
    return url.replace('{bbox}', minx + ',' + miny + ',' + maxx + ',' + maxy);
  } else {
    return url.replace('{x}', t.x).replace('{y}', t.y).replace('{z}', t.z);
  }
}

var fetchTile = function(request, t) {
  var url = getTileUrl(request, t);
  // Return a new promise.
  return new Promise(function(resolve, reject) {

    function get(request, gattempts, resolve, reject) {
      // sdebug('fetchTile', url, request.layer.userAgent, gattempts);
      // Do the usual XHR stuff
      var req = new HTTPClient({
        headers: (request.layer.userAgent && {
          'User-Agent': request.layer.userAgent
        }),
        onload: function(e) {
          // sdebug('onload', url);
          if (request.stopped) {
            reject(Error('stopped'));
          } else if (!request.stopped && this.responseData) {
            // callback(e.data.toBase64());
            resolve({
              data: this.responseData.toBase64(),
              tile: t,
              request: request
            });
            // } else if (attempts < 3) {
            // fetchTile(request, t, attempts++, callback);
          } else {
            reject(Error('no data for url:' + url));
          }
        },
        onerror: function(e) {
          sdebug('onerror', url, gattempts, e.code, e.error);
          if (request.stopped) {
            reject(Error('stopped'));
          } else if (e.code >= 400) {
            resolve();
          } else if (gattempts < 3) {
            get(request, gattempts + 1, resolve, reject);
          } else {
            reject(Error(e.error));
          }
        }
      });
      req.open('GET', url);
      // Make the request
      req.send();
    }
    get(request, 0, resolve, reject);

  });
}

/**
 * Retrieve MBTiles data for current token.
 * @param token
 */
exports.getMBTilesState = function(token, callback) {
  return mbTilesStatusService.get(token);
};

/**
 * Remove all MBTiles which have no reference in the app or which have been downloaded already.
 */
exports.removeOldMBTiles = function() {
  mbTilesStatusService.remove(token);
};