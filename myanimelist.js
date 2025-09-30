const jsdom = require("jsdom");
const { JSDOM }= jsdom;
const { data } = require("./messages.js");

function dataProcessing (dados) {
    animeName = dados.data.Media.title.english;
    MALCode = dados.data.Media.idMal;
    
    animeName = animeName.split(' ').join('_');

    return [animeName, MALCode];
}

function graphQLSearch (filter_test, filters_data) {
    
    let query_struct = '';

    for(let i = 0; i < filter_test.length; i++) {
        if
    }

    let query = `
    query ($search: String, $season: MediaSeason) {
        Page (page: $page, perPage: $perPage) {
            pageInfo {
            currentPage
            hasNextPage
            perPage
        }
        Media (search: $search, type: ANIME) {
            idMal
            title {
                english
            }
        }
    }
    `;
}

async function extractMALcodeList (filter_test, filters_data) {
    const nameList = [];
    const MALCodeList = [];
    
    data = graphQLSearch(filter_test, filters_data);
    // Query do GraphQL;


    /*
    let data = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })}
        );

        switch(data.status) {
            case 403:
                console.log(data.ANILIST_IS_DOWN);
                throw new Error(data.ANILIST_IS_DOWN);
            case 429:
                // Caso seja necessário conferir alguma vez, pode ser visto no header do request em 'x-ratelimit-limit' como pode ser visto na documentação ('https://docs.anilist.co/guide/rate-limiting')
                const quantidade_request_anilist = 30;
                throw new Error(data.RATE_LIMITING + quantidade_request_anilist);
        }

    for(let i = 0; i < animeList.length; i++) {
        data = await dados.json();
        console.log(dados)
        let [animeName, MALCode] = dataProcessing(data);

        nameList.push(animeName);
        MALCodeList.push(MALCode);
    }

    return [nameList, MALCodeList]
    */
}

async function fetchMALpage (name, MALcode) {
    myanimelist_site = await fetch(`https://myanimelist.net/anime/${MALcode}/${name}`).then((site) => { return site.text() } )

    const dom = new JSDOM(myanimelist_page).window.document.querySelector("html").outerHTML;
}

async function main() {
    // Para entender a descrição de cada um dos filtros, há o arquivo 'filters_description' para consulta
    const filters_data = {
        averageScore_greater: [false, 'Int'], 
        averageScore_lesser:  [false, 'Int'],
        episode:              [false, 'Int'],
        genre_in:             [false, '[String]'],
        popularity_greater:   [false, 'Int'],
        popularity_lesser:    [false, 'Int'],
        search:               [false, 'String'],
        season:               [false, 'MediaSeason'],
        seasonYear:           [false, 'Int'],
        sort:                 [false, 'MediaSort'],
        source:               [false, 'MediaSource'],
        startDate_greater:    [false, 'FuzzyDateInt'],
        startDate_lesser:     [false, 'FuzzyDateInt']
    }

    let animeNameList = [];
    let MALCodeList = [];

    try {
        [animeNameList, MALCodeList] = await extractMALcodeList(filter_test, filters_data);
    } catch (e) {
        console.error(e);
    }

    console.log(animeNameList);
    console.log(MALCodeList);

    /*
    for(let i = 0; i < nameList.length - 1; i++) {
        let MALpage = await fetchMALpage(animeNameList[i], MALCodeList[i]);
    }

    return myanimelist_page;
    */
};
main();

// extrair: score, usuários, ranked, popularidade, membros, temporada, gênero