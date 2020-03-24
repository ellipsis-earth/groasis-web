import React from 'react';
import { GeoJSON } from 'react-leaflet';
/*import L from 'leaflet';*/

import ApiManager from '../../ApiManager';
import ViewerUtility from './ViewerUtility';
/*import Utility from '../../Utility';*/

/*const GROASIS_COLOR = '#87cef3';*/

/*const GROASIS_ATLAS = 'Groasis';*/
const SUBATLAS_PROPERTY = '_subatlas';

const ALTITUDE_TYPE = 'altitude';
const HIGHRES_TYPE = 'highres';
const LOWRES_TYPE = 'lowres';
const SOIL_TYPE = 'soil';
const WEATHER_TYPE = 'weather';

const REQUEST_MAP_ID = '15d843ba-11e5-4995-aa6f-c3449a8f93e2';
/*const plantingSitesLayer = 'Proposed planting sites';*/

const MAP_TYPES = [
  ALTITUDE_TYPE,
  HIGHRES_TYPE,
  LOWRES_TYPE,
  SOIL_TYPE,
  WEATHER_TYPE
];

const TREE_RADIUS = 2.5;


const WATCH_FORM = 'watch';

const GroasisUtility = {
  markerSize: ViewerUtility.markerSize,

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
      road: 'road',
      terrain: 'terrain',
      highRes: 'rgb (high res)',
      highResCir: 'CIR (high res)',
      highResLabel: 'label (high res)',
      lowRes: 'rgb (low res)',
      lowResCir: 'CIR (low res)',
      contour: 'contour',
      organic: 'Organic Content',
      clay: 'Clay Content',
      sand: 'Sand Content',
      coarse: 'Coarse Content',
      ph: 'PH',

    },
    polygon: {
      trees: 'Trees',
      /*objectOfInterest: 'Objects of interest',*/
      plantingLines: 'Planting lines',
      plantingSites: 'Planting sites',
    }
  },

  request: {
    id: REQUEST_MAP_ID,
    layer: 'Identification Zones'
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

  watchForm: WATCH_FORM,

  getGroasisAreas: async (user /*, onFeatureClick*/) => {
    return ApiManager.get('/account/myAreas', null, user)
      .then(async areas => {
        let groasisAreas = [];
        let bounds = {};
        let geoJsons = [];

        for (let i = 0; i < areas.length; i++)
        {
          if (areas[i].atlases.includes('GroasisPlanner'))
          {
            if(groasisAreas.length === 0)
            {
              bounds.xMin = areas[i].xMin;
              bounds.xMax = areas[i].xMax;
              bounds.yMin = areas[i].yMin;
              bounds.yMax = areas[i].yMax;
            }
            else
            {
              bounds.xMin = bounds.xMin > areas[i].xMin ? areas[i].xMin : bounds.xMin;
              bounds.xMax = bounds.xMax < areas[i].xMax ? areas[i].xMax : bounds.xMax;
              bounds.yMin = bounds.yMin > areas[i].yMin ? areas[i].yMin : bounds.yMin;
              bounds.yMax = bounds.yMax < areas[i].yMax ? areas[i].yMax : bounds.yMax;
            }

            await ApiManager.post('/metadata', { mapId: areas[i].id }, user)
            .then(async result => {
                areas[i].type = 'area'
                areas[i].timestamps = result.timestamps;
                areas[i].classes = result.classes;
                areas[i].measurements = result.measurements;
                areas[i].layers = {
                  tile: result.mapLayers,
                  polygon: result.polygonLayers
                };
                areas[i].bands = result.bands;
                areas[i].forms = result.forms;
                areas[i].models = result.models;

                let areaJson = await ApiManager.post('/geometry/area', { mapId: areas[i].id }, user);
                areaJson.properties.mapId = areas[i].id;
                areas[i].geoJson = areaJson;
                geoJsons.push(areaJson);

                areas[i].metadataLoaded = true;

                return areas[i]
              }
            );

            groasisAreas.push(areas[i]);
          }
          else
          {
            if (areas[i].atlases.length !== 0)
            {
              console.warn(areas[i]);
            }
          }
        }

        return {bounds: bounds, areas: groasisAreas, geoJson: {type: 'FeatureCollection', features: geoJsons}};
      });
    /*return ApiManager.get('/account/myMaps', null, user)
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
            key={groasisMaps.subatlases.join('_')}
          />
        );

        groasisMaps.request = maps.find(x => x.id === REQUEST_MAP_ID)

        return groasisMaps;
      })
      .then(groasisMaps => {
        let promises = groasisMaps.subatlases.map(x => {
          if (!user) {
            groasisMaps[x].watchlist = [];
            return Promise.resolve();
          }

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
              groasisMaps[x].watchlist = watchlistMessages.messages.map(y => {
                return { id: y.id, elementId: y.elementId }
              });
            });
        });

        return Promise.all(promises)
          .then(() => {
            return groasisMaps;
          })
      });*/
  },

  /*getPolygonLayers: async (groasisMap, user) => {
    let returnData = await ApiManager.post('/metadata', { mapId: groasisMap.id, type: 'polygonLayers' }, user)
    .then(results => {
      return results;
    })
    .catch(err => {
      console.log(err)
    })

    return returnData
  },*/

  getMetadata: async (groasisMap, user) => {
    if (groasisMap.metadataLoaded) {
      return Promise.resolve();
    }

    /*if (groasisMap.id === REQUEST_MAP_ID)
    {
      return ApiManager.post('/metadata', { mapId: groasisMap.id }, user)
      .then(result => {
        groasisMap.timestamps = result.timestamps;
        groasisMap.classes = result.classes;
        groasisMap.measurements = result.measurements;
        groasisMap.layers = {
          tile: result.mapLayers,
          polygon: result.polygonLayers
        };
        groasisMap.bands = result.bands;
        groasisMap.forms = result.forms;
        groasisMap.models = result.models

        groasisMap.metadataLoaded = true;
        return groasisMap
      });
    }
    else
    {
      let promises = [];

      for (let y = 0; y < MAP_TYPES.length; y++) {
        let type = MAP_TYPES[y];
        let subMap = groasisMap[type];

        promises.push(ApiManager.post('/metadata', { mapId: subMap.id }, user)
        .then(result => {
          subMap.timestamps = result.timestamps;
          subMap.classes = result.classes;
          subMap.measurements = result.measurements;
          subMap.layers = {
            tile: result.mapLayers,
            polygon: result.polygonLayers
          };
          subMap.bands = result.bands;
          subMap.forms = result.forms;
          subMap.model = result.model

          subMap.metadataLoaded = true;
        }));
      }

      return Promise.all(promises)
        .then(() => {
          console.log(groasisMap)
          groasisMap.metadataLoaded = true;
        });
    }*/
  },

  getAreaMaps: (map, user, override = false) => {
    if (map.mapsLoaded && !override)
    {
      return Promise.resolve();
    }
    else
    {
      return Promise.resolve(ApiManager.get('/account/myMaps', null, user)
      .then(maps => {
        map.maps = maps.filter(x => x.area.id === map.id);
      }))
      .then(async () => {
        for (let i = 0; i < map.maps.length; i++)
        {
          let metadata = await ApiManager.post('/metadata', {mapId: map.maps[i].id}, user);

          for(let key in metadata)
          {
            map.maps[i][key] = metadata[key];
          }
        }

        map.mapsLoaded = true;
      });
    }
  },

  getAreaData: async (map, user, onPlantingSiteClick) => {
    let promises = [];
    promises.push(GroasisUtility.getPlantingSites(map, user, onPlantingSiteClick));
    promises.push(GroasisUtility.getAreaMaps(map, user));

    return Promise.all(promises);
  },

  getPlantingSites: async (map, user, onPlantingSiteClick, override = false) => {
    if (map.plantingSitesLoaded && override === false)
    {
      return Promise.resolve(map.plantingSites);
    }

    let selectLayer = map.layers.polygon.find(x => x.id === '8c10c128-b989-43d8-ae9d-b0fd22e8bfa0')

    let body = {
      mapId: map.id,
      type: ViewerUtility.polygonLayerType,
      layer: selectLayer.name,
      xMin: map.xMin,
      xMax: map.xMax,
      yMin: map.yMin,
      yMax: map.yMax,
    };

    let leafletGeojsonLayerPromise = await ApiManager.post('/geometry/ids', body, user)
      .then(polygonIds => {

        body = {
          mapId: map.id,
          type: ViewerUtility.polygonLayerType,
          elementIds: polygonIds.ids
        };

        return ApiManager.post('/geometry/get', body, user);
      })
      .then(polygonsGeoJson => {
        let icon = ViewerUtility.returnMarker(`#${selectLayer.color}`, ViewerUtility.markerSize, 'RoomTwoTone')

        let linesCollection = {
          type: 'FeatureCollection',
          count: 0,
          features: []
        };

        for (let i = polygonsGeoJson.features.length - 1; i >= 0; i--)
        {
          polygonsGeoJson.features[i].properties.mapId = map.id;

          if (polygonsGeoJson.features[i] && polygonsGeoJson.features[i].geometry.type === 'LineString')
          {
            linesCollection.features.push(polygonsGeoJson.features[i]);
            linesCollection.count = linesCollection.count + 1;

            polygonsGeoJson.count = polygonsGeoJson.count - 1;
            polygonsGeoJson.features.splice(i,1);
          }
        }

        return (
          [<GeoJSON
            key={Math.random()}
            data={polygonsGeoJson}
            style={ViewerUtility.createGeoJsonLayerStyle(`#${selectLayer.color}`)}
            zIndex={ViewerUtility.polygonLayerZIndex[GroasisUtility.layers.polygon.plantingSites]}
            onEachFeature={(feature, layer) => {layer.on({ click: () => onPlantingSiteClick(feature) })}}
            pointToLayer={(geoJsonPoint, latlng) => this.markerReturn(latlng, icon)}
            type='plantingSite'
          />,
          <GeoJSON
            key={Math.random()}
            data={linesCollection}
            style={ViewerUtility.createGeoJsonLayerStyle(`#${selectLayer.color}`, 3)}
            zIndex={ViewerUtility.polygonLayerZIndex[GroasisUtility.layers.polygon.plantingSites]}
            onEachFeature={(feature, layer) => {layer.on({ click: () => onPlantingSiteClick(feature) })}}
          />]
        );

      })
      .then(geoJsons => {
        map.plantingSitesLoaded = true;
        map.plantingSites = geoJsons;
        Promise.resolve(leafletGeojsonLayerPromise);
      })
      .catch(err => {
        console.error(err)
      });

    return Promise.resolve(map.plantingSites);
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

/*function groupMaps(maps) {
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

    if (!mapInfo) {
      continue;
    }

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
}*/

/*function deleteIncompleteMaps(groasisMaps) {
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
}*/

export default GroasisUtility;
