import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';

import {divIcon} from 'leaflet';

import FileSaver from 'file-saver';
import streamSaver from 'streamsaver';
import { isAndroid, isIOS, isMobile } from 'react-device-detect';

const TILE = 'image_tile';
const STANDARD_TILE = 'tile';
const POLYGON = 'polygon';
const CUSTOM_POLYGON = 'customPolygon'
const WMS_TILE = 'wms_tile';
const SUBATLAS_ELEMENT = 'subatlas';

const ViewerUtility = {

  admin: 'admin',

  baseLayer: 'base',
  tileLayerType: TILE,
  standardTileLayerType: STANDARD_TILE,
  wmsTileLayerType: WMS_TILE,
  subatlasElementType: SUBATLAS_ELEMENT,



  polygonLayerType: POLYGON,
  customPolygonTileLayerType: CUSTOM_POLYGON,

  dataType: {
    class: 'class',
    meanMeasurement: 'meanMeasurement',
    deviationMeasurement: 'deviationMeasurement'
  },

  drawnPolygonLayerType: 'drawn_polygon',
  treeElementType: 'tree',
  newTreeElementType: 'new_tree',
  ooiElementType: 'ooi',
  plantingLineElementType: 'planting_line',
  plantingSiteElementType: 'new_planting_site',

  tileLayerZIndex: 200,
  standardTileLayerZIndex: 1000,
  polygonLayerZIndex: 1001,
  customPolygonLayerZIndex: 1100,
  selectedElementLayerZIndex: 1150,
  drawnPolygonLayerZIndex: 1151,

  dataPaneAction: {
    analyse: 'analyse',
    geoMessage: 'geoMessage',
    createCustomPolygon: 'create_custom_polygon',
    editCustomPolygon: 'edit_custom_polygon',
    feed: 'geomessage_feed',
    gallery: 'gallery'
  },

  dataGraphType: {
    classes: 'classes',
    measurements: 'measurements'
  },

  specialClassName: {
    allClasses: 'all classes',
    mask: 'mask',
    outside_area: 'outside_area',
    noClass: 'no class',
    cloudCover: 'cloud_cover'
  },

  geomessageFormType: {
    text: 'text',
    numeric: 'numeric',
    boolean: 'boolean'
  },

  flyToType: {
    map: 'map',
    currentLocation: 'current_location',
    currentElement : 'current_element',

    location: 'location',
    standardTile: STANDARD_TILE,
    polygon: POLYGON,
    customPolygon: CUSTOM_POLYGON
  },

  viewerMode: 2,
  plantMode: 1,
  plannerMode: 0,

  markerSize: { x: 17, y: 24 },

  selection: {
    specialProperty: {
      prefix: '_',

      type: '_type'
    }
  },

  createMarker: (latlng, icon) => {
    return L.marker(latlng, { icon: icon });
  },

  returnMarker: (color, markerSize, iconName) => {
    let IconClass = require(('@material-ui/icons/' + iconName)).default;
    let temp = <IconClass viewBox={`${markerSize.y/4} 0 ${markerSize.y/2} ${markerSize.y}`} className="layerMarker" style={{fill: color, filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))', width: markerSize.x*2 + 'px', height: markerSize.y*2 + 'px'}}/>;
    let markerIcon = renderToStaticMarkup(temp);
    let icon = divIcon({
      className: 'layerDivIcon',
      html: markerIcon,
      iconSize: [markerSize.x*2, markerSize.y*2],
      iconAnchor: [markerSize.x, markerSize.y*2],
    });

    return icon;
  },

  download: (fileName, text, mime) => {
    if (isMobile && isAndroid) {
      const fileStream = streamSaver.createWriteStream(fileName);

      new Response(text).body
        .pipeTo(fileStream)
        .then(() => {
        },
        (e) => {
          console.warn(e);
        });
    }
    else if (isMobile && isIOS) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        fileName: fileName,
        data: text,
        mime: mime
      }));
    }
    else {
      let file = new File([text], fileName, {type: `${mime};charset=utf-8}`});
      FileSaver.saveAs(file);
    }
  },

  createGeoJsonLayerStyle: (color, weight, fillOpacity) => {
    return {
      color: color ? color : '#3388ff',
      weight: weight ? weight : 1,
      fillOpacity: fillOpacity ? fillOpacity : 0.06
    };
  },

  getBounds: (coordinates) => {
    let bounds = {
      xMin: Number.MAX_VALUE,
      xMax: -Number.MAX_VALUE,
      yMin: Number.MAX_VALUE,
      yMax: -Number.MAX_VALUE,
      length: 0
    };

    let getBoundsAux = (subCoordinates, bounds) => {
      if (!Array.isArray(subCoordinates)) {
        return;
      }

      let xCoord = subCoordinates[0];
      let yCoord = subCoordinates[1]; 

      if (!isNaN(xCoord) && !isNaN(yCoord)) {
        let validX = xCoord >= -180 && xCoord <= 180;
        let validY = yCoord >= -90 && yCoord <= 90;
  
        if (!validX || !validY) {
          return null;
        }

        if (xCoord < bounds.xMin) {
          bounds.xMin = xCoord;
        }
        if (xCoord > bounds.xMax) {
          bounds.xMax = xCoord;
        }

        if (yCoord < bounds.yMin) {
          bounds.yMin = yCoord;
        }
        if (yCoord > bounds.yMax) {
          bounds.yMax = yCoord;
        }

        bounds.length++;
      }
      else {
        for (let i = 0; i < subCoordinates.length; i++) {
          getBoundsAux(subCoordinates[i], bounds);
        }
      }
    }

    getBoundsAux(coordinates, bounds);

    return bounds;
  },

  isPrivateProperty: 'isPrivate',



}

export default ViewerUtility;
