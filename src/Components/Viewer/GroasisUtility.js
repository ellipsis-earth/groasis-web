import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import ApiManager from '../../ApiManager';
import ViewerUtility from './ViewerUtility';
import Utility from '../../Utility';

const GROASIS_COLOR = '#87cef3';

const GROASIS_ATLAS = 'Groasis';
const SUBATLAS_PROPERTY = '_subatlas';

const ALTITUDE_TYPE = 'altitude';
const HIGHRES_TYPE = 'highres';
const LOWRES_TYPE = 'lowres';
const SOIL_TYPE = 'soil';
const WEATHER_TYPE = 'weather';

const MAP_TYPES = [
  ALTITUDE_TYPE,
  HIGHRES_TYPE,
  LOWRES_TYPE,
  SOIL_TYPE,
  WEATHER_TYPE
];

const METADATA_TYPES = [
  { key: 'timestamps', function: (map, result) => { map.timestamps = result; } },
  { key: 'classes', function: (map, result) => { map.classes = result; } },
  { key: 'measurements', function: (map, result) => { map.measurements = result; } },
  { key: 'tileLayers', function: (map, result) => { map.layers.tile = result; } },
  { key: 'polygonLayers', function: (map, result) => { map.layers.polygon = result; } },
  { key: 'bands', function: (map, result) => { map.bands = result; } },
  { key: 'forms', function: (map, result) => { map.forms = result; } }
];

const TREE_RADIUS = 2.5;

const WATCH_FORM = 'watch';

const GroasisUtility = {
  types: {
    altitude: ALTITUDE_TYPE,
    highRes: HIGHRES_TYPE,
    lowRes: LOWRES_TYPE,
    soil: SOIL_TYPE,
    weather: WEATHER_TYPE
  },

  layers: {
    tile: {
      base: 'base',
      highRes: 'rgb (high res)',
      highResCir: 'CIR (high res)',
      lowRes: 'rgb (low res)',
      lowResCir: 'CIR (low res)',
      contour: 'contour'
    },
    polygon: {
      trees: 'Trees',
      objectOfInterest: 'Objects of interest',
      plantingLines: 'Planting lines'
    }
  },

  allTypes: MAP_TYPES,

  subatlasProperty: SUBATLAS_PROPERTY,
  
  treeProperties: {
    species: 'Species',
    plantingDate: 'Planting date'
  },

  species: [
    'Douglas',
    'Oak',
    'Willow'
  ],

  getGroasisMaps: async (user, onFeatureClick) => {
    return ApiManager.get('/account/myMaps', null, user)
      .then(maps => {
        maps = maps.filter(x => x.atlases.includes(GROASIS_ATLAS));

        let groasisMaps = groupMaps(maps);

        deleteIncompleteMaps(groasisMaps);        

        groasisMaps.geoJson = {
          type: 'FeatureCollection',
          features: []
        };

        for (let i = 0; i < groasisMaps.subatlases.length; i++) {
          let subatlas = groasisMaps.subatlases[i];
          let groasisMap = groasisMaps[subatlas];

          let referenceMap = groasisMap.referenceMap;
          groasisMap.center = [
            referenceMap.xMin + (referenceMap.xMax - referenceMap.xMin) / 2,
            referenceMap.yMin + (referenceMap.yMax - referenceMap.yMin) / 2
          ];
          groasisMap.geoJson = {
            type: 'Feature',
            properties: {
              [SUBATLAS_PROPERTY]: subatlas
            },
            geometry: {
              type: 'Point',
              coordinates: groasisMap.center
            }
          };

          groasisMaps.geoJson.features.push(groasisMap.geoJson);
        }

        let icon = ViewerUtility.returnMarker(GROASIS_COLOR, { x: 17, y: 24 }, 'RoomTwoTone');          

        groasisMaps.geoJsonElement = (
          <GeoJSON
            data={groasisMaps.geoJson}
            style={ViewerUtility.createGeoJsonLayerStyle(GROASIS_COLOR)}
            zIndex={ViewerUtility.polygonLayerZIndex}
            onEachFeature={(feature, layer) => {
              layer.on({ click: () => onFeatureClick(feature) })
            }}
            pointToLayer={(_, latlng) => L.marker(latlng, { icon: icon, pane: 'overlayPane' })}
          />
        );

        return groasisMaps;
      })
      .then(groasisMaps => {
        if (!user) {
          groasisMaps.wachtList = [];
          return groasisMaps;
        }

        let promises = groasisMaps.subatlases.map(x => {
          let body = {
            mapId: groasisMaps[x].referenceMap.id,
            type: ViewerUtility.polygonLayerType,
            filters: {
              forms: [WATCH_FORM],
              user: user.username
            }
          }

          return ApiManager.post('/geomessage/ids', body, user)
            .then(watchlistMessages => {
              groasisMaps[x].watchList = watchlistMessages.messages.map(y => {
                return { id: y.id, elementId: y.elementId }
              });
            });
        });

        return Promise.all(promises)
          .then(() => {
            return groasisMaps;
          })
      });
  },
  
  getMetadata: async (groasisMap, user) => {
    if (groasisMap.metadataLoaded) {
      return Promise.resolve();
    }

    let promises = [];

    for (let y = 0; y < MAP_TYPES.length; y++) {
      let type = MAP_TYPES[y];
      let subMap = groasisMap[type];
      let subPromises = [];

      for (let i = 0; i < METADATA_TYPES.length; i++) {
        let metadataType = METADATA_TYPES[i];
  
        subPromises.push(
          ApiManager.post('/metadata', { mapId: subMap.id, type: metadataType.key }, user)
        );
      }

      promises.push(
        Promise.all(subPromises)
          .then(results => {
            subMap.layers = {};

            for (let i = 0; i < results.length; i++) {
              let result = results[i];
              let metadataType = METADATA_TYPES[i];

              metadataType.function(subMap, result);
            }
          })
      );
    }

    return Promise.all(promises)
      .then(() => {
        groasisMap.metadataLoaded = true;
      });
  },

  markerToTreePolygon: (markerGeoJson) => {
    let markerCoords = markerGeoJson.geometry.coordinates;
    let markerLng = markerCoords[0];
    let markerLat = markerCoords[1];

    let deltaY = TREE_RADIUS * (360 / 40000000);
    let deltaX = deltaY / Math.cos(markerLat);

    let coordinates = [[
      [markerLng - deltaX, markerLat - deltaY],
      [markerLng - deltaX, markerLat + deltaY],
      [markerLng + deltaX, markerLat + deltaY],
      [markerLng + deltaX, markerLat - deltaY],
      [markerLng - deltaX, markerLat - deltaY]
    ]];

    let treeGeoJson = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: coordinates
      }
    };

    return treeGeoJson;
  }

}

function groupMaps(maps) {
  let groasisMaps = {
    subatlases: []
  };
  let bounds = {
    xMin: Number.MAX_VALUE,
    xMax: -Number.MAX_VALUE,
    yMin: Number.MAX_VALUE,
    yMax: -Number.MAX_VALUE
  };
  
  for (let i = 0; i < maps.length; i++) {
    let map = maps[i];

    let mapInfo = map.info;
    let subatlas = mapInfo.subatlas;

    if (!groasisMaps[subatlas]) {
      groasisMaps[subatlas] = {
        subatlas: subatlas
      };
      groasisMaps.subatlases.push(subatlas);
    }

    let groasisMap = groasisMaps[subatlas];
    groasisMap[mapInfo.type] = map;
    if (mapInfo.type === LOWRES_TYPE) {
      groasisMap.referenceMap = map;
    }

    if (map.xMin < bounds.xMin) {
      bounds.xMin = map.xMin;
    }
    if (map.xMax > bounds.xMax) {
      bounds.xMax = map.xMax;
    }

    if (map.yMin < bounds.yMin) {
      bounds.yMin = map.yMin;
    }
    if (map.yMax > bounds.yMax) {
      bounds.yMax = map.yMax;
    }
  }

  groasisMaps.bounds = bounds;

  return groasisMaps;
}

function deleteIncompleteMaps(groasisMaps) {
  for (let i = 0; i < groasisMaps.subatlases.length; i++) {
    let subatlas = groasisMaps.subatlases[i];
    let groasisMap = groasisMaps[subatlas];

    for (let y = 0; y < MAP_TYPES.length; y++) {
      let mapType = MAP_TYPES[y];

      let subMap = groasisMap[mapType];

      if (!subMap) {
        delete groasisMaps[subatlas];
        Utility.arrayRemove(groasisMaps.subatlases, subatlas);
        i--
        break;
      } 
    }
  }
}

export default GroasisUtility;
