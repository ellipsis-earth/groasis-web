import ApiManager from '../../ApiManager';

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
  getGroasisMaps: async (user) => {
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

        return groasisMaps;
      });
  }
}

export default GroasisUtility;
