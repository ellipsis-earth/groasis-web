import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
    feed: 'geomessage_feed'
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

  isPrivateProperty: 'isPrivate',

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
  }

}

export default ViewerUtility;
