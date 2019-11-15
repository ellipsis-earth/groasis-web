import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import ApiManager from '../../ApiManager';
import ViewerUtility from './ViewerUtility';

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

const GroasisUtility = {
  types: {
    altitude: ALTITUDE_TYPE,
    highres: HIGHRES_TYPE,
    lowres: LOWRES_TYPE,
    soil: SOIL_TYPE,
    weather: WEATHER_TYPE
  },

  allTypes: MAP_TYPES,

  subatlasProperty: SUBATLAS_PROPERTY,

  getGroasisMaps: async (user, onFeatureClick) => {
    return ApiManager.get('/account/myMaps', null, user)
      .then(maps => {
        maps = maps.filter(x => x.atlases.includes(GROASIS_ATLAS));

        let groasisMaps = {
          subatlases: []
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
          if (mapInfo.type === HIGHRES_TYPE) {
            groasisMap.referenceMap = map;
          }
        }

        for (let i = 0; i < groasisMaps.subatlases.length; i++) {
          let subatlas = groasisMaps.subatlases[i];
          let groasisMap = groasisMaps[subatlas];

          for (let y = 0; y < MAP_TYPES.length; y++) {
            let mapType = MAP_TYPES[y];
            if (!groasisMap[mapType]) {
              delete groasisMap[subatlas];
              break;
            }
          }
        }

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
  }

}

export default GroasisUtility;
