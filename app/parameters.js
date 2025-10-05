// Para entender a descrição de cada um dos filtros, há o arquivo 'filters_description' para consulta
const filters_data = {
    averageScore_greater: [false, 'Int'], 
    averageScore_lesser:  [false, 'Int'],
    episode:              [false, 'Int'],
    genre_in:             [false, '[String]'],
    popularity_greater:   [false, 'Int'],
    popularity_lesser:    [false, 'Int'],
    search:               ['Spy x Family Season 3', 'String'],
    season:               [false, 'MediaSeason'],
    seasonYear:           [false, 'Int'],
    sort:                 [false, 'MediaSort'],
    source:               [false, 'MediaSource'],
    startDate_greater:    [false, 'FuzzyDateInt'],
    startDate_lesser:     [false, 'FuzzyDateInt'],
    strictSearch:         true,
};

const is_generating_excel = false;

const useProxy = true;

/* Lista realizada no .env */
const proxyList = (process.env.PROXY_LIST).split(', ');

module.exports = { filters_data, is_generating_excel, useProxy, proxyList }