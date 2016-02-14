var Promise = require('./promise-simple');
var Step = require('./step');
var EARTH_RADIUS = 6378.137;
// Number of requests for each step set.
var STEP_REQUEST_SIZE = 96;
var dataDir = Ti.Filesystem.applicationDataDirectory;
var mbtilesHoldingDir = Ti.Filesystem.getFile(dataDir, 'mbtiles');
if (!mbtilesHoldingDir.exists()) {
  mbtilesHoldingDir.createDirectory();
}
var DB_DIR = mbtilesHoldingDir.nativePath;
if (!_.endsWith(DB_DIR, '/')) {
  DB_DIR += '/';
}
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

/**
 * Compute the area in square kilometers of a lat lng quad.
 * @param b the bounds {left:, bottom:, right:, top:}
 */
var boundsToArea = function(b) {
  var r2 = Math.pow(EARTH_RADIUS, 2);
  sdebug('Earth radius is ' + r2);
  // Area of lat bottom to the north-pole
  var alat1 = 2 * Math.PI * r2 * (1 - Math.sin(b.sw.latitude * Math.PI / 180));
  // Area of lat top to the north-pole
  var alat2 = 2 * Math.PI * r2 * (1 - Math.sin(b.ne.latitude * Math.PI / 180));
  // Area of lat portion strip
  var alat = alat1 - alat2;
  // Area of lat portion between left and right lngs.
  var a = alat * (Math.abs(b.sw.longitude - b.ne.longitude) / 360);
  return a;
};

/**
 * Validate bounds
 * @param b the bounds {left:, bottom:, right:, top:}
 */
var isValidBounds = function(b) {
  return b.left >= -180 && b.left <= 180 && b.right >= -180 && b.right <= 180 && b.bottom >= -85 && b.bottom <= 85 &&
    b.top >= -85 && b.top <= 85
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
      if (!this.mbtilesStatus[token]) {
        this.mbtilesStatus[token] = {
          "status": "generating",
          "progress": 0,
          request: request
        };
      }
    },
    remove: function(token) {
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
    update: function(token, status, progress) {
      var data = this.mbtilesStatus[token];
      if (data) {
        data.status = status;
        data.progress = progress;
        if (data.request) {
          data.request.emit('update', data);
        }
      }
    },
    get: function(token) {
      return this.mbtilesStatus[token];
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
  var token = guid();
  var file = token + '.mbtiles';
  // Ti.Database.open(token);
  var db = Ti.Database.open( DB_DIR + file);
  // var db = new sqlite3.Database(file);
  sdebug('initMBTilesRequest', data);
  var request = new MicroEvent(_.assign(data, {
    layer: layer,
    timestamp: (new Date()).getTime(),
    db: db,
    token: token,
    file: file,
    pause: function() {
      sdebug('pause');
      this.paused = true;
    },
    resume: function() {
      sdebug('resume');
      this.paused = false;
    },
    stop: function() {
      sdebug('stop', this.token);
      this.stopped = true;
      mbTilesStatusService.remove(this.token);
      this.emit('cancelled', {
        request: request
      });
    }
  }));
  sdebug('test', request.timestamp);
  mbTilesStatusService.create(token, request);
  return request;
};

/**
 * Returns the future token to retrieve MBTiles once ready.
 * @param bounds the MBTiles bounds
 * @returns a string value
 */
exports.requestMBTiles = function(layer, bounds, minZoom, maxZoom) {
  minZoom = Math.max(Math.max(1, layer.minZoom || 0), minZoom);
  maxZoom = Math.min(Math.min(22, layer.maxZoom || 22), maxZoom);
  sdebug('requestMBTiles', layer, bounds);
  var request = initMBTilesRequest(layer, computeInfoForMBTiles(layer, bounds, minZoom, maxZoom));
  processMBTiles(request, bounds, minZoom, maxZoom);
  return request;
};

var computeInfoForMBTiles = exports.computeInfoForMBTiles = function(layer, bounds, minZoom, maxZoom) {
  minZoom = Math.max(Math.max(1, layer.minZoom || 0), minZoom);
  maxZoom = Math.min(Math.min(22, layer.maxZoom || 22), maxZoom);
  var result = {
    area: boundsToArea(bounds), //square kilometers
    count: countTiles(layer, bounds, minZoom, maxZoom)
  }
  var width = layer.tileSize || 256;
  result.size = 12700 * result.count;
  return result;
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile
 */
exports.requestMBTilesSync = function(layer, bounds, minZoom, maxZoom) {
  var request = initMBTilesRequest(layer, computeInfoForMBTiles(layer, bounds, minZoom, maxZoom))
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
    sdebug("Processing MBTiles for bounds:" + JSON.stringify(bounds), resolve, reject);
    var layer = request.layer;
    // fs.readFile('conf/schema.sql', 'utf8', function(err, data) {
    //   if (err) {
    //     console.error('Error while loading schema: ' + err);
    //     throw err;
    //   }
    createTables(request.db, [
        "CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);",
        "CREATE TABLE metadata (name text, value text);"
      ])
      .then(function() {
        sdebug('storing metadata');
        // required MetaData for mbtiles spec
        var metaData = {
          "name": layer.name,
          "type": "baselayer",
          "version": 1,
          "description": layer.attribution,
          "format": "png",
          "bounds": bounds.sw.longitude + ',' + bounds.sw.latitude + ',' + bounds.ne.longitude + ',' + bounds
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
          sdebug('MBTile computed successfully. File output is available in ' + request.file);
          // Persist tile state
          mbTilesStatusService.update(request.token, "done", 100);
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
    request.db.close();
    request.db.remove();
    mbTilesStatusService.remove(request.token);
    Ti.FileSystem.getFile(request.file).deleteFile();
    if (e !== 'stopped') {
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
      sdebug("createTables");
      db.execute('BEGIN'); // begin the transaction
      for (var i = 0; i < _tables.length; i++) {
        db.execute(_tables[i]); // begin the transaction
      }
      db.execute('COMMIT'); // begin the transaction
      sdebug('createTables done');
      resolve();
    } catch (e) {
      reject(e);
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
  sdebug(((tilesChunks.length - 1) * STEP_REQUEST_SIZE + _.last(tilesChunks).length) + " tiles to process.");
  // fuck
  // Prepare steps
  var steps = [];
  var stepCount = tilesChunks.length;
  // Start off with a promise that always resolves
  var sequence = Promise.resolve();
  return _.reduce(tilesChunks, function(sequence, tiles, i) {
    sequence = sequence.then(function() {

      return fetchTilesFunction(request, tiles);
    }).then(function() {
      finalizeStepFunction(request, i, stepCount);
    }).then(function() {
      sdebug('test1');
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
          setTimeout(resolve, 1000);
        }
      });
    });
    return sequence;
  }, Promise.resolve()).then(function() {
    sdebug('Rendering done');
    setTimeout(function() {
      request.emit('done', {
        request: request
      });
    }, 0);
    mbTilesStatusService.remove(request.token);
    // resolve();
    // }).catch(function(e) {

    //   setTimeout(function() {
    //     throw e;
    //   }, 0);
    //   sdebug('catching', e);
  });
  // var stmt = db.prepare('INSERT INTO tiles VALUES (?, ?, ?, ?)');
  // Use closures to split the tile fetch into sets, to prevent overflows (10000s of http requests at the same time).
  // steps.push(fetchTilesFunction(request, tiles.slice(s * STEP_REQUEST_SIZE, Math.min((s + 1) *
  // STEP_REQUEST_SIZE,
  // tiles.length)), stmt));
  // tiles.length))));
  // steps.push(finalizeStepFunction(stmt, token, s, stepCount));
  // steps.push(finalizeStepFunction(request.token, s, stepCount));
  // }
  // return new Promise(function(resolve, reject) {
  //   // List tiles
  //   var tiles = listTiles(request, bounds);
  //   sdebug(tiles.length + " tiles to process.");

  //   // Prepare steps
  //   var steps = [];
  //   var stepCount = Math.floor(1 + tiles.length / STEP_REQUEST_SIZE);
  //   for (var s = 0; s < stepCount; s++) {
  //     // var stmt = db.prepare('INSERT INTO tiles VALUES (?, ?, ?, ?)');
  //     // Use closures to split the tile fetch into sets, to prevent overflows (10000s of http requests at the same time).
  //     steps.push(fetchTilesFunction(request, tiles.slice(s * STEP_REQUEST_SIZE, Math.min((s + 1) *
  //       STEP_REQUEST_SIZE,
  //       // tiles.length)), stmt));
  //       tiles.length))));
  //     // steps.push(finalizeStepFunction(stmt, token, s, stepCount));
  //     steps.push(finalizeStepFunction(request.token, s, stepCount));
  //   }
  //   // Last step is resolution
  //   steps.push(function() {
  //     sdebug('Rendering done');
  //     resolve();
  //   });
  //   sdebug('steps', steps.length);
  //   // Launch processing
  //   Step.apply(this, steps);

  // });
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
    count += (Math.max(coords1[0], coords2[0]) - Math.min(coords1[0], coords2[0])) *
      (Math.max(coords1[1], coords2[1]) - Math.min(coords1[1], coords2[1]));

  }
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
  var counter = 0;

  sdebug('Listing tiles for bounds', bounds, minZoom, maxZoom);
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
        counter = (counter + 1) % STEP_REQUEST_SIZE;
      }
    }
  }
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
        insertTile(data.request, data.tile, data.data)
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

/**
 * Closure for step finalization
 * @param stmt the statement to close
 * @param token the current token
 * @param s the current step
 * @param stepCount the total number of steps 
 * @returns {Function} the function
 */
// var finalizeStepFunction = function(stmt, token, s, stepCount) {
var finalizeStepFunction = function(request, s, stepCount) {
  // return function() {
  mbTilesStatusService.update(request.token, "generating", Math.floor((s + 1) * 100 / (stepCount + 1)));
  // stmt.finalize();
  // this();
  // }
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
  return request.layer.url.replace('{x}', t.x).replace('{y}', t.y).replace('{z}', t.z).replace('{s}', getSubdomain(
    t,
    request.layer.subdomains));
}

var fetchTile = function(request, t) {
  var url = getTileUrl(request, t);
  // Return a new promise.
  return new Promise(function(resolve, reject) {

    function get(request, gattempts, resolve, reject) {
      // sdebug('fetchTile', url, gattempts);
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
          sdebug('onerror', gattempts, e.code, e.error);
          if (request.stopped) {
            reject(Error('stopped'));
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