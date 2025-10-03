const fs = require('fs');
const { parse } = require('node-html-parser');
const { messages } = require("./messages.js");

function graphQLStruct (filters_data, strictSearch) {
    let [query_struct, media_struct]= ['', ''];
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

function changeCommaToPoint(string) {
    let stringModified = '';
    for(let i = 0; i < string.length; i++){
        if(string[i] === ',') {
            stringModified += '.'
        } else {
            stringModified += string[i]
        }
    }
    return stringModified;
}

function studioNameCleanList(studioList) {
    let cleanList = '';

    for(let i = 0; i < studioList.length; i++) {
        let studio = String(studioList[i]).trim();

        if(i != studioList.length - 1) { studio += ' / ' }
        cleanList += studio;
    }

    return cleanList;
}

async function scrappingMALpage (MALcode) {
    let MALSite = await fetch(`https://myanimelist.net/anime/${MALcode}`);

    switch (MALSite.status) {
        case 404:
            throw (messages.MAL_CODE_DONT_FOUND + MALcode);
    }

    MALSite = await MALSite.text().then((site) => parse(site));

    const title = MALSite.querySelector("h1.title-name.h1_bold_none").innerText;

    // Precisa entender o problema deste aqui;
    const coverLink = MALSite.querySelector("td.borderClass").querySelector("img.lazyloaded");

    const averageScore = MALSite.querySelector('.score-label')?.textContent;
    let usersScored = MALSite.querySelector('div.fl-l.score')?.getAttribute("data-user")?.split(' ')[0];

    const [season, YearSeason] = 
        [
            MALSite.querySelector("span.information.season")?.querySelector("a")?.textContent.split(' ')[0],
            MALSite.querySelector("span.information.season")?.querySelector("a")?.textContent.split(' ')[1]
        ];
    const media = MALSite.querySelector("span.information.type")?.querySelector("a")?.textContent;
    let studio = MALSite.querySelector("span.information.studio.author")?.innerText?.split(', ');

    let rankedOnMal = MALSite.querySelector("span.numbers.ranked")?.querySelector("strong").textContent;
    let popularityOnMAL = MALSite.querySelector("span.numbers.members")?.querySelector("strong").textContent;

    if(usersScored === '-') { usersScored = 'N/A' }
    else { usersScored     = changeCommaToPoint(usersScored) };

    if(rankedOnMal !== 'N/A') { rankedOnMal = rankedOnMal.slice(1) }

    popularityOnMAL = changeCommaToPoint(popularityOnMAL)
    studio          = studioNameCleanList(studio);

    return [
        title,
        coverLink,
        averageScore,
        usersScored,
        season,
        YearSeason,
        media,
        studio,
        rankedOnMal,
        popularityOnMAL
    ]
}

function structCSV(dataCSV) {
    // CSV = Comma-Separated Values 
    let CSV = [
        ['sep=,'],
        ["title","coverLink","averageScore","membersScored", "season","YearSeason","media","studio" ,"rankedOnMal","popularityOnMAL"]
    ];

    CSV.push(dataCSV);

    return CSV;
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
        search:               ['Spy x Family Season 3', 'String'],
        season:               [false, 'MediaSeason'],
        seasonYear:           [false, 'Int'],
        sort:                 [false, 'MediaSort'],
        source:               [false, 'MediaSource'],
        startDate_greater:    [false, 'FuzzyDateInt'],
        startDate_lesser:     [false, 'FuzzyDateInt'],
        strictSearch:         true,
    }
    const is_generating_excel = true;

    let MALCodeList;
    try {
        MALCodeList = await requestMALcodeList(filters_data);
    } catch (e) {
        console.error(e);
    }

    let dataCSV = [];
    let data    = {};

    for(let i = 0; i < MALCodeList.length; i++) {
        try {
            let row_data = await scrappingMALpage(MALCodeList[i]);

            data[MALCodeList[i]] = row_data;
            if(is_generating_excel === true) { dataCSV.push(row_data) };
        } catch (e) {
            console.log(e);
        }
    };

    if(is_generating_excel === true) {
        let CSV = structCSV(dataCSV);

        for (let i = 0; i < CSV.length; i++) { CSV[i] = CSV[i].join(',') };
        CSV = CSV.join('\n');

        fs.writeFile('MALdata.csv', CSV, 'utf-8', (err) => {
            if(err) {
                console.error('Erro ao criar o arquivo: ', err);
                return
            }
        });
    };
    console.log('teste')
}
main();