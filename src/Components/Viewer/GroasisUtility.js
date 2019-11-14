import ApiManager from '../../ApiManager';

const GROASIS_ATLAS = 'Groasis';

const GroasisUtility = {
  getGroasisMaps: async (user) => {
    return ApiManager.get('/account/myMaps', null, user)
      .then(maps => {
        let groasisMaps = maps.filter(x => x.atlases.includes(GROASIS_ATLAS));

        return groasisMaps;
      });
  }
}

export default GroasisUtility;
