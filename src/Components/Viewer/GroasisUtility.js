import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import ApiManager from '../../ApiManager';
import ViewerUtility from './ViewerUtility';

const GROASIS_COLOR = '#87cef3';

const GROASIS_ATLAS = 'Groasis';

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

const GroasisUtility = {
  types: {
    altitude: ALTITUDE_TYPE,
    highres: HIGHRES_TYPE,
    lowres: LOWRES_TYPE,
    soil: SOIL_TYPE,
    weather: WEATHER_TYPE
  },

  allTypes: MAP_TYPES,

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
            groasisMaps[subatlas] = {};
            groasisMaps.subatlases.push(subatlas);
          }

          let groasisMap = groasisMaps[subatlas];
          groasisMap[mapInfo.type] = map;
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

          let referenceMap = groasisMap[HIGHRES_TYPE];
          groasisMap.center = [
            referenceMap.xMin + (referenceMap.xMax - referenceMap.xMin) / 2,
            referenceMap.yMin + (referenceMap.yMax - referenceMap.yMin) / 2
          ];
          groasisMap.geoJson = {
            type: 'Feature',
            properties: {
              _subatlas: subatlas
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

}

export default GroasisUtility;
