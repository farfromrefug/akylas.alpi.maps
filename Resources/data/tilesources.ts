export const data = {
    // AkMap: {
    //     options: {
    //         maxZoom: 24
    //         // style:'style',
    //         // styleFile:'mapzen.zip'
    //     },
    //     url: ["carto.streets", "https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2/{zoom}/{x}/{y}.vector.pbf?access_token=" + app.servicesKeys.mapbox]
    // },
    // MapBoxVector: {
    //     styleFile: "mapbox.zip",
    //     url: "//a.tiles.mapbox.com/v4/{variant}/{zoom}/{x}/{y}.vector.pbf?access_token=" + app.servicesKeys.mapbox,
    //     options: {
    //         attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' + "Map data {attribution.OpenStreetMap}",
    //         variant: "mapbox.mapbox-streets-v7"
    //     },
    //     variants: {
    //         terrain: {
    //             options: {
    //                 variant: "mapbox.mapbox-terrain-v2"
    //             }
    //         }
    //     }
    // },
    // ESRI_Vector: {
    //     url: "https://basemaps.arcgis.com/v1/arcgis/rest/services/{variant}/VectorTileServer/tile/{z}/{y}/{x}.pbf",
    //     options: {
    //         attribution: "Tiles &copy; Esri",
    //         maxZoom: 15,
    //         variant: "World_Basemap"
    //     }
    // },
    RefugesInfo: {
        category: "europe,topo",
        url: "//maps.refuges.info/hiking/{z}/{x}/{y}.png",
        options: {
            attribution: '&copy; <a href="http://www.refuges.info/wiki/licence">Refuges.info</a>, {attribution.OpenStreetMap}',
            forceHTTP: true,
            maxZoom: 18
        }
    },
    OpenSkiMap: {
        category: "ski",
        url: "//tiles.skimap.org/openskimap2x/{z}/{x}/{y}.png",
        options: {
            attribution: '&copy; <a href="http://www.openskimap.org">OpenSkiMap</a>, {attribution.OpenStreetMap}',
            forceHTTP: true
        }
    },
    // OpenSnowMap: {
    //     category: "ski",
    //     url: "//www.opensnowmap.org/tiles-pistes/{z}/{x}/{y}.png",
    //     options: {
    //         opacity: 0.99,
    //         attribution: '&copy; <a href="http://www.opensnowmap.org">OpenSnowMap</a>, {attribution.OpenStreetMap}',
    //         forceHTTP: true
    //     }
    // },
    IGN: {
        category: "france",
        url: "//wxs.ign.fr/" +
            app.servicesKeys.ign +
            "/geoportail/wmts?LAYER={variant}&EXCEPTIONS=text/xml&FORMAT={format}&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE={style}&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        legends: "https://www.geoportail.gouv.fr/depot/layers/{variant}/legendes/{variant}-legend.png",
        options: {
            userAgent: app.info.name.replace(" ", ""),
            variant: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
            cacheable: __DEVELOPMENT__,
            format: "image/jpeg",
            style: "normal",
            forceHTTP: true,
            maxZoom: 18
        },
        variants: {
            Plan: {
                options: {
                    minZoom: 6,
                    variant: "GEOGRAPHICALGRIDSYSTEMS.PLANIGN"
                }
            },
            Satellite: {
                options: {
                    variant: "ORTHOIMAGERY.ORTHOPHOTOS"
                }
            },
            Buildings: {
                options: {
                    variant: "BUILDINGS.BUILDINGS",
                    format: "image/png"
                }
            },
            Cadastre: {
                options: {
                    variant: "CADASTRALPARCELS.PARCELS",
                    format: "image/png"
                }
            },
            ScanExpress: {
                options: {
                    variant: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD"
                    // format: 'image/png',
                }
            },
            Scan25: {
                options: {
                    variant: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR"
                    // format: 'image/png',
                }
            },
            Slopes: {
                options: {
                    variant: "GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN",
                    format: "image/png"
                }
            },
            HillShading: {
                options: {
                    variant: "ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW",
                    style: "estompage_grayscale",
                    format: "image/png"
                }
            },
            ELEVATION: {
                options: {
                    variant: "ELEVATION.SLOPES"
                    // format: 'image/png',
                }
            }
        }
    },
    Avalanches: {
        url: "http://vmapfishbda.grenoble.cemagref.fr/cgi-bin/mapserv?map=/var/www/prod/test.map&LAYERS=zont%2Clint&TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&FORMAT=image%2Fpng&SRS=EPSG%3A27572&BBOX={bbox}&WIDTH=300&HEIGHT=300"
    },
    OpenStreetMap: {
        url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
            subdomains: "abc",
            minZoom: 2,
            maxZoom: 19,
            downloadable: true,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        },
        variants: {
            BlackAndWhite: {
                url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
                options: {
                    maxZoom: 18
                }
            },
            DE: {
                url: "http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
                options: {
                    maxZoom: 18
                }
            },
            France: {
                url: "http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
                options: {
                    maxZoom: 18,
                    attribution: "&copy; Openstreetmap France | {attribution.OpenStreetMap}"
                }
            },
            HOT: {
                url: "http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                options: {
                    attribution: '{attribution.OpenStreetMap}, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
                }
            }
        }
    },
    OpenSeaMap: {
        category: "sea",
        url: "http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
        options: {
            attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
        }
    },
    OpenTopoMap: {
        category: "topo,europe",
        url: "http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        options: {
            maxZoom: 15,
            attribution: 'Map data: {attribution.OpenStreetMap}, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }
    },
    Lonvia: {
        category: "topo",
        options: {
            maxZoom: 16,
            attribution: 'Map data: {attribution.OpenStreetMap}, <Overlay from cycling.lonvia.de, <a href="http://cycling.lonvia.de/en/copyright"> Terms of Use</a> )'
        },
        variants: {
            HikingRoutes: {
                url: "http://tile.lonvia.de/hiking/{z}/{x}/{y}.png"
            },
            CycleRoutes: {
                url: "http://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png"
            }
        }
    },
    OpenCycleMap: {
        url: "//{s}.tile.thunderforest.com/{variant}/{z}/{x}/{y}@2x.png?apikey=" + app.servicesKeys.thunderforest,
        options: {
            attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, {attribution.OpenStreetMap}',
            tileSize: 512,
            maxZoom: 18,
            variant: "cycle"
        },
        variants: {
            Transport: {
                options: {
                    variant: "transport",
                    maxZoom: 19
                }
            },
            Landscape: "landscape",
            Outdoors: "outdoors",
            'Spinal Map': "spinal-map",
            Pioneer: "pioneer",
            'Mobile Atlas': "mobile-atlas",
            Neighbourhood: "neighbourhood",
        }
    },
    OpenMapSurfer: {
        url: "http://korona.geog.uni-heidelberg.de/tiles/{variant}/x={x}&y={y}&z={z}",
        options: {
            variant: "roads",
            attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data {attribution.OpenStreetMap}'
        },
        variants: {
            AdminBounds: {
                options: {
                    maxZoom: 18,
                    variant: "adminb"
                }
            },
            Grayscale: {
                options: {
                    maxZoom: 18,
                    variant: "roadsg"
                }
            },
            Contours: {
                options: {
                    minZoom: 13,
                    maxZoom: 17,
                    variant: "asterc"
                }
            }
        }
    },
    Hydda: {
        url: "http://{s}.tile.openstreetmap.se/hydda/{variant}/{z}/{x}/{y}.png",
        options: {
            maxZoom: 18,
            variant: "full",
            tileSize: 512,
            attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data {attribution.OpenStreetMap}'
        },
        variants: {
            Base: "base",
            RoadsAndLabels: "roads_and_labels"
        }
    },
    MapQuestOpen: {
        /* Mapquest does support https, but with a different subdomain:
         * https://otile{s}-s.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}
         * which makes implementing protocol relativity impossible.
         */
        url: "http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}",
        options: {
            type: "map",
            ext: "jpg",
            attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' + "Map data {attribution.OpenStreetMap}",
            subdomains: "1234"
        },
        variants: {
            OSM: {},
            Aerial: {
                options: {
                    type: "sat",
                    maxZoom: 18,
                    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' + "Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency"
                }
            },
            HybridOverlay: {
                options: {
                    type: "hyb",
                    ext: "png",
                    opacity: 0.9
                }
            }
        }
    },
    MapBox: {
        url: "//api.tiles.mapbox.com/v4/{variant}/{z}/{x}/{y}{2x}.png?access_token=" + app.servicesKeys.mapbox,
        options: {
            attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' + "Map data {attribution.OpenStreetMap}",
            subdomains: "abcd",
            variant: "mapbox.streets",
            tileSize: 512
        },
        variants: {
            Light: "mapbox.light",
            Dark: "mapbox.dark",
            Satellite: "mapbox.satellite",
            Hybrid: "mapbox.streets-satellite",
            Basic: "mapbox.streets-basic",
            Comic: "mapbox.comic",
            Outdoors: "mapbox.outdoors",
            RunBikeHike: "mapbox.run-bike-hike",
            Pencil: "mapbox.pencil",
            Pirates: "mapbox.pirates",
            Emerald: "mapbox.emerald",
            HighContrast: "mapbox.high-contrast",
            WheatPaste: "mapbox.wheatpaste"
        }
    },
    Stamen: {
        url: "//stamen-tiles-{s}.a.ssl.fastly.net/{variant}/{z}/{x}/{y}.png",
        options: {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' + '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' + "Map data {attribution.OpenStreetMap}",
            subdomains: "abcd",
            minZoom: 0,
            maxZoom: 20,
            variant: "toner",
            ext: "png"
        },
        variants: {
            TonerBackground: "toner-background",
            TonerHybrid: "toner-hybrid",
            TonerLines: "toner-lines",
            TonerLabels: "toner-labels",
            TonerLite: "toner-lite",
            Watercolor: {
                options: {
                    variant: "watercolor",
                    minZoom: 1,
                    maxZoom: 16
                }
            },
            Terrain: {
                options: {
                    variant: "terrain",
                    minZoom: 4,
                    maxZoom: 18,
                    bounds: [[22, -132], [70, -56]]
                }
            },
            TerrainBackground: {
                options: {
                    variant: "terrain-background",
                    minZoom: 4,
                    maxZoom: 18,
                    bounds: [[22, -132], [70, -56]]
                }
            }
            // TopOSMRelief: {
            //     options: {
            //         variant: 'toposm-color-relief',
            //         ext: 'jpg',
            //         bounds: [
            //             [22, -132],
            //             [51, -56]
            //         ]
            //     }
            // },
            // TopOSMFeatures: {
            //     options: {
            //         variant: 'toposm-features',
            //         bounds: [
            //             [22, -132],
            //             [51, -56]
            //         ],
            //         opacity: 0.9
            //     }
            // }
        }
    },
    Esri: {
        url: "//server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}",
        options: {
            variant: "World_Street_Map",
            attribution: "Tiles &copy; Esri"
        },
        variants: {
            WorldStreetMap: {
                options: {
                    attribution: "{attribution.Esri} &mdash; " + "Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
                }
            },
            DeLorme: {
                options: {
                    variant: "Specialty/DeLorme_World_Base_Map",
                    minZoom: 1,
                    maxZoom: 11,
                    attribution: "{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme"
                }
            },
            WorldTopoMap: {
                options: {
                    variant: "World_Topo_Map",
                    attribution: "{attribution.Esri} &mdash; " +
                        "Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
                }
            },
            WorldImagery: {
                options: {
                    maxZoom: 18,
                    variant: "World_Imagery",
                    attribution: "{attribution.Esri} &mdash; " + "Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                }
            },
            WorldTerrain: {
                options: {
                    variant: "World_Terrain_Base",
                    maxZoom: 13,
                    attribution: "{attribution.Esri} &mdash; " + "Source: USGS, Esri, TANA, DeLorme, and NPS"
                }
            },
            WorldShadedRelief: {
                options: {
                    variant: "World_Shaded_Relief",
                    maxZoom: 13,
                    attribution: "{attribution.Esri} &mdash; Source: Esri"
                }
            },
            WorldPhysical: {
                options: {
                    variant: "World_Physical_Map",
                    maxZoom: 8,
                    attribution: "{attribution.Esri} &mdash; Source: US National Park Service"
                }
            },
            OceanBasemap: {
                options: {
                    variant: "Ocean_Basemap",
                    maxZoom: 13,
                    attribution: "{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri"
                }
            },
            NatGeoWorldMap: {
                options: {
                    variant: "NatGeo_World_Map",
                    maxZoom: 16,
                    attribution: "{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC"
                }
            },
            WorldGrayCanvas: {
                options: {
                    variant: "Canvas/World_Light_Gray_Base",
                    maxZoom: 16,
                    attribution: "{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ"
                }
            }
        }
    },
    OpenWeatherMap: {
        category: "weather",
        url: "http://{s}.tile.openweathermap.org/map/{variant}/{z}/{x}/{y}.png",
        options: {
            maxZoom: 19,
            attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
            cacheable: false,
            opacity: 0.5
        },
        variants: {
            Clouds: "clouds",
            CloudsClassic: "clouds_cls",
            Precipitation: "precipitation",
            PrecipitationClassic: "precipitation_cls",
            Rain: "rain",
            RainClassic: "rain_cls",
            Pressure: "pressure",
            PressureContour: "pressure_cntr",
            Wind: "wind",
            Temperature: "temp",
            Snow: "snow"
        }
    },
    HERE: {
        /*
         * HERE maps, formerly Nokia maps.
         * These basemaps are free, but you need an API key. Please sign up at
         * http://developer.here.com/getting-started
         *
         * Note that the base urls contain '.cit' whichs is HERE's
         * 'Customer Integration Testing' environment. Please remove for production
         * envirionments.
         */
        url: "//{s}.{base}.maps.cit.api.here.com/maptile/2.1/" + "maptile/{mapID}/{variant}/{z}/{x}/{y}/256/png8?" + "app_id={app_id}&app_code={app_code}",
        options: {
            attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
            subdomains: "1234",
            mapID: "newest",
            app_id: app.servicesKeys.here.app_id,
            app_code: app.servicesKeys.here.app_code,
            base: "base",
            variant: "normal.day",
            maxZoom: 20
        },
        variants: {
            normalDayCustom: "normal.day.custom",
            normalDayGrey: "normal.day.grey",
            normalDayMobile: "normal.day.mobile",
            normalDayGreyMobile: "normal.day.grey.mobile",
            normalDayTransit: "normal.day.transit",
            normalDayTransitMobile: "normal.day.transit.mobile",
            normalNight: "normal.night",
            normalNightMobile: "normal.night.mobile",
            normalNightGrey: "normal.night.grey",
            normalNightGreyMobile: "normal.night.grey.mobile",
            carnavDayGrey: "carnav.day.grey",
            hybridDay: {
                options: {
                    base: "aerial",
                    variant: "hybrid.day"
                }
            },
            hybridDayMobile: {
                options: {
                    base: "aerial",
                    variant: "hybrid.day.mobile"
                }
            },
            pedestrianDay: "pedestrian.day",
            pedestrianNight: "pedestrian.night",
            satelliteDay: {
                options: {
                    base: "aerial",
                    variant: "satellite.day"
                }
            },
            terrainDay: {
                options: {
                    base: "aerial",
                    variant: "terrain.day"
                }
            },
            terrainDayMobile: {
                options: {
                    base: "aerial",
                    variant: "terrain.day.mobile"
                }
            }
        }
    },
    Acetate: {
        url: "http://a{s}.acetate.geoiq.com/tiles/{variant}/{z}/{x}/{y}.png",
        options: {
            attribution: "&copy;2012 Esri & Stamen, Data from OSM and Natural Earth",
            subdomains: "0123",
            minZoom: 2,
            maxZoom: 17,
            variant: "acetate-base"
        },
        variants: {
            terrain: "terrain",
            all: "acetate-hillshading",
            foreground: "acetate-fg",
            roads: "acetate-roads",
            labels: "acetate-labels",
            hillshading: "hillshading"
        }
    },
    FreeMapSK: {
        category: "slovenia",
        url: "http://{s}.freemap.sk/T/{z}/{x}/{y}.jpeg",
        options: {
            minZoom: 8,
            maxZoom: 16,
            subdomains: ["t1", "t2", "t3", "t4"],
            attribution: '{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>'
        }
    },
    MtbMap: {
        category: "europe",
        url: "http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png",
        options: {
            maxZoom: 18,
            attribution: "{attribution.OpenStreetMap} &amp; USGS"
        }
    },
    CartoDB: {
        url: "http://{s}.basemaps.cartocdn.com/{variant}/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: "abcd",
            maxZoom: 18,
            variant: "light_all"
        },
        variants: {
            PositronNoLabels: "light_nolabels",
            DarkMatter: "dark_all",
            DarkMatterNoLabels: "dark_nolabels"
        }
    },
    HikeBike: {
        category: "topo",
        url: "http://{s}.tiles.wmflabs.org/{variant}/{z}/{x}/{y}.png",
        options: {
            maxZoom: 14,
            attribution: "{attribution.OpenStreetMap}",
            variant: "hikebike"
        },
        variants: {
            HillShading: {
                category: "relief",
                options: {
                    maxZoom: 15,
                    variant: "hillshading"
                }
            }
        }
    },
    NASAGIBS: {
        category: "other",
        url: "//map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}",
        options: {
            attribution: "Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System " +
                '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
            minZoom: 1,
            maxZoom: 8,
            format: "jpg",
            // time: '',
            variant: "VIIRS_CityLights_2012",
            tilematrixset: "GoogleMapsCompatible_Level"
        },
        variants: {
            ModisTerraLSTDay: {
                options: {
                    variant: "MODIS_Terra_Land_Surface_Temp_Day",
                    format: "png",
                    maxZoom: 7,
                    opacity: 0.75
                }
            },
            // ModisTerraSnowCover: {
            //     options: {
            //         variant: 'MODIS_Terra_Snow_Cover',
            //         format: 'png',
            //         maxZoom: 8,
            //         opacity: 0.75
            //     }
            // },
            ModisTerraAOD: {
                options: {
                    variant: "MODIS_Terra_Aerosol",
                    format: "png",
                    maxZoom: 6,
                    opacity: 0.75
                }
            }
            // ModisTerraChlorophyll: {
            //     options: {
            //         variant: 'MODIS_Terra_Chlorophyll_A',
            //         format: 'png',
            //         maxZoom: 7,
            //         opacity: 0.75
            //     }
            // }
        }
    },
    map1eu: {
        category: "europe",
        url: "//beta.map1.eu/tiles/{z}/{x}/{y}.jpg",
        options: {
            maxZoom: 15,
            attribution: '&copy; <a href="http://beta.map1.eu/">map1.eu</a>, {attribution.OpenStreetMap}',
            forceHTTP: true
        }
    },
    Geofabrik: {
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://www.geofabrik.de/maps/tiles.html">Geofabrik</a>',
            subdomains: "abcd",
            maxZoom: 16
        },
        variants: {
            Streets: {
                url: "http://{s}.tile.geofabrik.de/549e80f319af070f8ea8d0f149a149c2/{z}/{x}/{y}.png"
            },
            Topo: {
                category: "topo",
                url: "http://{s}.tile.geofabrik.de/15173cf79060ee4a66573954f6017ab0/{z}/{x}/{y}.png"
            }
        }
    },
    "Ride with GPS": {
        url: "http://{s}.tile.ridewithgps.com/rwgps/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://ridewithgps.com/">Ride with GPS</a>',
            subdomains: "abcd",
            maxZoom: 16
        }
    },
    Waze: {
        url: "https://worldtiles{s}.waze.com/tiles/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://waze.com">Waze</a>',
            subdomains: "1234",
            maxZoom: 19
        }
    },
    Alltrails: {
        category: "topo",
        url: "http://alltrails.com/tiles/alltrailsOutdoors/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://alltrails.com">Alltrails</a>',
            maxZoom: 19
        }
    },
    "4umaps": {
        category: "europe,topo",
        url: "http://4umaps.eu/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://4umaps.eu">4umaps</a>',
            minZoom: 1,
            maxZoom: 15
        }
    },
    Maptoolkit: {
        category: "europe,usa",
        url: "http://tile{s}.maptoolkit.net/{variant}/{z}/{x}/{y}.png",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://maptoolkit.net/">Maptoolkit</a>',
            subdomains: "123456789",
            minZoom: 7,
            maxZoom: 17
        },
        variants: {
            Topo: {
                url: "http://tile{s}.maptoolkit.net/terrain/{z}/{x}/{y}.png",
                options: {
                    variant: "terrain"
                }
            },
            "Bike heatmap": {
                options: {
                    variant: "bikemap",
                    opacity: 0.9
                }
            }
        }
    },
    "slopes > 30%": {
        category: "europe",
        url: "http://www.skitrack.fr/cgi-bin/mapserv.fcgi?map=/srv/d_vttrack/vttrack/skitrack/mapserver/WMS-{variant}.map&SERVICE=WMS&VERSION=1.1.1&LAYERS=slope&FORMAT={format}&TRANSPARENT=true&REQUEST=GetMap&STYLES=&SRS=EPSG%3A900913&BBOX={bbox}&WIDTH=512&HEIGHT=512",
        options: {
            attribution: '{attribution.OpenStreetMap} &copy; <a href="http://maptoolkit.net/">Maptoolkit</a>',
            tileSize: 512,
            devHidden: true,
            maxZoom: 15,
            format: "image/png"
        },
        variants: {
            IGN: {
                options: {
                    variant: "slopeIGN75",
                    opacity: 0.99
                }
            },
            aster: {
                options: {
                    variant: "slope-aster",
                    opacity: 0.99
                }
            }
        }
        // },
        // 'piemonte': {
        //     category: 'italie',
        //     url: '//www.webgis.csi.it/cataloghiradex_f/cataloghi_TMS/sfondi/sfondo_europa_piemonte/{z}/{x}/{y}.png',
        //     options: {
        //         attribution: 'http://www.regione.piemonte.it/sentgis/jsp/cartografia/mappa.do',
        //         forceHTTP: true,
        //         maxZoom: 18
        //     }
    },
    USGS: {
        url: "http://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/WMTS/tile/1.0.0/USGSTopo/default/GoogleMapsCompatible/{zoom}/{y}/{x}",
        options: {
            attribution: "USGS The National Map. The National Boundaries Dataset, National Elevation Dataset, Geographic Names Information System, National Hydrography Dataset, National Land Cover Database, National Structures Dataset, and National Transportation Dataset; U.S. Census Bureau - TIGER/Line; HERE Road Data. USGS MapServer"
        }
    }
};
