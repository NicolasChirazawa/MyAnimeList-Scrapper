const { parse } = require('node-html-parser');
const { messages } = require("./messages.js");

function graphQLStruct (filters_data, strictSearch) {
    let [query_struct, media_struct ]= ['', ''];
    let variables = {};

    const filters_keys = Object.keys(filters_data);

    for(let i = 0; i < filters_keys.length; i++) {
        if(filters_data[filters_keys[i]][0] !== false) {
            query_struct += `$${filters_keys[i]}: ${filters_data[filters_keys[i]][1]}, `;
            media_struct += `${filters_keys[i]}: $${filters_keys[i]}, `;

            variables[filters_keys[i]] = filters_data[filters_keys[i]][0];
        }
    }

    let query;
    if (strictSearch === false) {
        variables['page'] = 1;
        variables['perPage'] = 50;

        query = 
        `query (${query_struct}$page: Int, $perPage: Int) {
            Page (page: $page, perPage: $perPage) {
                pageInfo {
                    currentPage
                    hasNextPage
                }
                media (${media_struct}type: ANIME) {
                    idMal
                }
            }
        }`;
    } else {
        query_struct = query_struct.slice(0, query_struct.length - 2);

        query = 
        `query (${query_struct}) {
            Media (${media_struct}type: ANIME) {
                idMal
            }
        }`;
    }

    return [query, variables];
}

async function graphqlSearch (query, variables) {
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
            throw new Error(messages.ANILIST_IS_DOWN);
        case 429:
            // Caso seja necessário conferir alguma vez, pode ser visto no header do request em 'x-ratelimit-limit' como pode ser visto na documentação ('https://docs.anilist.co/guide/rate-limiting')
            const quantidade_request_anilist = 30;
            throw new Error(messages.RATE_LIMITING + quantidade_request_anilist);
    }

    data = await data.json();
    data = data.data;

    return data;
}

async function requestMALcodeList (filters_data) {    
    const strictSearch = filters_data['strictSearch'];
    delete filters_data.strictSearch;

    const [query, variables] = graphQLStruct(filters_data, strictSearch);

    let MALCodeList = [];

    while(true) {
        data = await graphqlSearch(query, variables);

        if(data?.Page !== undefined) {
            const perPage = data.Page.media.length;
            for(let i = 0; i < perPage; i++) {
                const idMal = data.Page.media[i]?.idMal;
                if(idMal !== null) { MALCodeList.push(idMal); }
            }
            const hasNextPage = data.Page.pageInfo.hasNextPage;
            if (hasNextPage) {
                variables.page += 1;
            } else {
                break;
            }
        } else {
            MALCodeList.push(data.Media.idMal);
            break;
        }
    }
    return MALCodeList;   
}

async function scrappingMALpage (MALcode) {
    let MALSite = await fetch(`https://myanimelist.net/anime/${MALcode}`);

    switch (MALSite.status) {
        case 404:
            throw (messages.MAL_CODE_DONT_FOUND + MALcode);
    }

    MALSite = await MALSite.text().then((site) => parse(site));

    const image = MALSite.querySelector("img.lazyloaded")?.getAttribute("src");

    const averageScore = MALSite.querySelector('.score-label.score-8')?.textContent;
    const membersQuantityScore = MALSite.querySelector('div.fl-l.score')?.getAttribute("data-user");

    const [season, YearSeason] = 
        [
            MALSite.querySelector("span.information.season")?.querySelector("a")?.textContent.split(' ')[0],
            MALSite.querySelector("span.information.season")?.querySelector("a")?.textContent.split(' ')[1]
        ];
    const type = MALSite.querySelector("span.information.type")?.querySelector("a")?.textContent;
    const studio = MALSite.querySelector("span.information.studio.author")?.querySelector("a")?.textContent;

    const ranked = MALSite.querySelector("span.numbers.ranked")?.querySelector("strong").textContent;
    const popularity = MALSite.querySelector("span.numbers.members")?.querySelector("strong").textContent;
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
        season:               ['WINTER', 'MediaSeason'],
        seasonYear:           [2019, 'Int'],
        sort:                 [false, 'MediaSort'],
        source:               [false, 'MediaSource'],
        startDate_greater:    [false, 'FuzzyDateInt'],
        startDate_lesser:     [false, 'FuzzyDateInt'],
        strictSearch:         false
    }

    let MALCodeList;
    try {
        MALCodeList = await requestMALcodeList(filters_data);
    } catch (e) {
        console.error(e);
    }

    for(let i = 0; i < MALCodeList.length; i++) {
        try {
            await scrappingMALpage(MALCodeList[i]);
        } catch (e) {
            console.log(e);
        }
    }
}
main()

// extrair: score, usuários, ranked, popularidade, membros, temporada, gênero