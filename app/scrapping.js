const fs = require('fs');
const { parse } = require('node-html-parser');

const { filters_data, is_generating_excel, useProxy } = require('./parameters.js');
const { requestProxy } = require('./proxy_server.js');
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

function changeCommaToPoint (string) {
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

function createNewTag (tag, fallback) {
    return tag === undefined 
        ? fallback 
        : tag;
}

function studioNameCleanList (studioList) {
    let cleanList = '';

    for(let i = 0; i < studioList.length; i++) {
        let studio = String(studioList[i]).trim();

        if(i != studioList.length - 1) { studio += ' / ' }
        cleanList += studio;
    }

    return cleanList;
}

async function requestMALPage(MALcode, i) {
    let MALSite = '';
    let link = `https://myanimelist.net/anime/${MALcode}`;
    let statusCode = '';

    if (useProxy === true) {
        MALSite = await requestProxy(link, i);
        statusCode = MALSite.status;

        MALSite = MALSite.body;
        MALSite = parse(MALSite);
    } else {
        MALSite = await fetch(link);
        statusCode = MALSite.status;

        MALSite = await MALSite.text().then((site) => parse(site))
    }

    switch (MALSite.status) {
        case 404:
            throw (messages.MAL_CODE_DONT_FOUND + MALcode);
    }

    return MALSite;
}

async function scrappingMALpage (MALSite) {
    let tag;

    const TAG_NAME = "h1.title-name.h1_bold_none";
    tag = MALSite
        ?.querySelector(TAG_NAME)
        ?.innerText;
    let fallback = 'N/A';
    let title = createNewTag(tag, fallback);


    const TAG_COVER = "td.borderClass";
    const SUBTAG_COVER = "img.lazyloaded";
    tag = MALSite
        ?.querySelector(TAG_COVER)
        ?.querySelector(SUBTAG_COVER)
    fallback = 'N/A';
    let coverLink = createNewTag(tag, fallback);
    

    const TAG_AVERAGE_SCORE = '.score-label';
    tag = MALSite
        ?.querySelector(TAG_AVERAGE_SCORE)
        ?.textContent
    fallback = 0.00;
    let averageScore = createNewTag(tag, fallback);


    const TAG_USERS_SCORED = "div.fl-l.score";
    const SUBTAG_USERS_SCORED = "data-user";
    tag = MALSite
        .querySelector(TAG_USERS_SCORED)
        ?.getAttribute(SUBTAG_USERS_SCORED)
        ?.split(' ')[0];
    fallback = 0.00;
    let usersScored = createNewTag(tag, fallback);
    if (usersScored === '-') { usersScored = 0.00 }
    else if (usersScored !== 0.00) { usersScored = changeCommaToPoint(usersScored) };


    const TAG_SEASON = "span.information.season";
    const SUBTAG_SEASON = "a";
    tag = MALSite
        ?.querySelector(TAG_SEASON)
        ?.querySelector(SUBTAG_SEASON)
        ?.textContent
        .split(' ')[0];
    fallback = 'N/A';
    let season = createNewTag(tag, fallback);


    const TAG_YEAR_SEASON = "span.information.season";
    const SUBTAG_YEAR_SEASON = "a";
    tag = MALSite
        ?.querySelector(TAG_YEAR_SEASON)
        ?.querySelector(SUBTAG_YEAR_SEASON)
        ?.textContent
        .split(' ')[1];
    fallback = 'N/A';
    let YearSeason = createNewTag(tag, fallback);

    
    const TAG_MEDIA = "span.information.type";
    const SUBTAG_MEDIA = "a";
    tag = MALSite
        ?.querySelector(TAG_MEDIA)
        ?.querySelector(SUBTAG_MEDIA)
        ?.textContent;
    fallback = 'N/A';
    let media = createNewTag(tag, fallback);


    const TAG_STUDIO = "span.information.studio.author";
    tag = MALSite
        ?.querySelector(TAG_STUDIO)
        ?.innerText
        ?.split(', ');
    fallback = 'N/A';
    let studio = createNewTag(tag, fallback);
    if (studio !== 'N/A') { studio = studioNameCleanList(studio) }


    const TAG_RANKED = "span.numbers.ranked";
    const SUBTAG_RANKED = "strong";
    tag = MALSite
        ?.querySelector(TAG_RANKED)
        ?.querySelector(SUBTAG_RANKED)
        .textContent;
    fallback = 0;
    let rankedOnMal = createNewTag(tag, fallback);
    if (rankedOnMal !== 'N/A' && rankedOnMal !== 0) { rankedOnMal = rankedOnMal.slice(1) }


    const TAG_POPULARITY = "span.numbers.popularity";
    const SUBTAG_POPULARITY = "strong";
    tag = MALSite
        ?.querySelector(TAG_POPULARITY)
        ?.querySelector(SUBTAG_POPULARITY)
        ?.textContent;
    fallback = 0;
    let popularityOnMAL = createNewTag(tag, fallback);
    if (popularityOnMAL !== 0) { popularityOnMAL = changeCommaToPoint(popularityOnMAL) };


    let TAG_MEMBERS = "span.numbers.members";
    const SUBTAG_MEMBERS = "strong";
    tag = MALSite
        ?.querySelector(TAG_MEMBERS)
        ?.querySelector(SUBTAG_MEMBERS)
        ?.textContent;
    fallback = 0;
    let membersOnMal = createNewTag(tag, fallback);
    if (popularityOnMAL !== 'N/A' && popularityOnMAL !== 0) { 
        popularityOnMAL = popularityOnMAL.slice(1); 
    }
    if(membersOnMal !== 0) { membersOnMal = changeCommaToPoint(membersOnMal) }


    tag = MALSite?.querySelectorAll("div.spaceit_pad");
    let [content, genres] = ['', ''];

    for(let i = 0; i < tag.length; i++) {
        let teste = tag[i].children[0];

        if(teste.innerText === 'Genres:') {
            content = tag[i];
            break;
        }
    }
    tag = content
        ?.querySelectorAll('[itemprop="genre"]');
    for(let i = 0; i < tag.length; i++) {
        genres += tag[i].innerText + '/';
    }
    if(genres !== '') { genres = genres.slice(0, genres.length - 1) };

    return {
        ['title']: title,
        ['coverlink']: coverLink,
        ['averageScore']: averageScore,
        ['usersScored']: usersScored,
        ['season']: season,
        ['yearSeason']: YearSeason,
        ['media']: media,
        ['studio']: studio,
        ['rankedOnMal']: rankedOnMal,
        ['popularityOnMAL']: popularityOnMAL,
        ['members']: membersOnMal,
        ['genres']: genres
    }
}

function structCSV (dataCSV) {
    // CSV = Comma-Separated Values 
    let CSV = [
        ['sep=,'],
        ["Title","Cover_Link","Average_Score","Members_Scored","Season","Year_Season","Media","Studio(s)","Ranked","Popularity","Members","Genres"]
    ];

    for(let i = 0; i < dataCSV.length; i++) {
        CSV.push(Object.values(dataCSV[i]));
    }

    return CSV;
}

async function main() {
    let MALCodeList;
    try {
        MALCodeList = await requestMALcodeList(filters_data);
    } catch (e) {
        console.error(e);
    }

    if(MALCodeList.length === 0) { return console.log(messages.LIST_EQUALS_ZERO) };

    let dataCSV = [];

    for(let i = 0; i < MALCodeList.length; i++) {
        try {
            let MALSite = await requestMALPage(MALCodeList[i], i);
            let MALdata = await scrappingMALpage(MALSite);
            dataCSV.push(MALdata);
        } catch (e) {
            console.log(e);
        }

        console.log(`====== Progresso: ${i + 1}/${MALCodeList.length} ======`)
    };

    if(is_generating_excel === true) {
        let CSV = structCSV(dataCSV);

        CSV[2] = CSV[2].join(',');
        CSV = CSV.join('\n');

        fs.writeFile('MALdata.csv', CSV, 'utf-8', (err) => {
            if(err) {
                console.error('Erro ao criar o arquivo: ', err);
                return
            }
        });
    };
    console.log(dataCSV)
}
main();