<h2 align=center>
  <img align=center src="https://raw.githubusercontent.com/NicolasChirazawa/MyAnimeList-Scrapper/refs/heads/main/imagens/logo.png" style="width: 130px">  
</h2>

<div align=center>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=fffdaf&message=Javascript&color=grey&style=for-the-badge&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=d1ffbd&message=Node.JS&color=grey&style=for-the-badge&logo=node.js&logoColor=black"/>
</div>

<h2 name="descricao">Descrição</h2>
Projeto de estudo do 'Web Scraping' de dados do site <a href="https://myanimelist.net/">MyAnimeList</a>. <br> <br>
A ideia dessa ferramenta nasceu com minha intenção de produzir uma métrica sobre as médias anuais de animês ao longo dos anos de 1980 a 2025. Assim, facilitado 
na coleta de dados e na compreensão de um objetivo, se houve um aumento nas médias anuais e o porquê dessa mudança.

<h2 name="inicializar">Iniciando</h2>

<h3>Softwares necessários</h3>

• <a href="https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi">Node.JS</a>;
<h6>Recomendação: Um editor de código: <a href="https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user">Visual Studio Code</a>; </h6>

<h3>Meios de acessar o projeto</h3>

```
https://github.com/NicolasChirazawa/MyAnimeList-Scrapper.git
```

<h3>Instalação de dependências</h3>
Foi utilizado apenas uma dependência nesse projeto: <br> <br>
- <a href="https://www.npmjs.com/package/node-html-parser">node-html-parser</a>; <br> <br>

Sua função é parsear 'texto' em código 'html' para realizar a busca de suas 'tags'. <br>
Para baixar esta dependência, use o comando: <br> <br>

```
npm i
```

<h3>Preparação do .env</h3>
Na raiz do projeto consta um arquivo <strong>'.env_example'</strong>, você deve renomeá-lo para <strong>'.env'</strong> pois o mesmo será utilizado em sua execução.
Nele, consta uma variável de ambiente 'PROXY_LIST'. <br> <br>

```env
## Há três opções para configurá-lo:

PROXY_LIST: ""                                 ## Não utilizá-lo;
PROXY_LIST: "xxx.xx.xxx.xx"                    ## Utilizar apenas um proxy;
PROXY_LIST: "xxx.xx.xxx.xx, xxx.xx.xxx.xxx"    ## Utilizar uma lista, separe-os com vírgula e espaço (, );
```

Já foi disposto a utilização de 'Proxy's que pedem autorização (este tópico será abordado mais abaixo.

<h3>Rodar o projeto</h3>
Para rodar o projeto, basta usar o comando: <br> <br>

```
npm run start
```

<h2 name="inicializar">Como funciona?</h2>
<span align="center">
  <p>As etapas fundamentais para realizar um WebScrapping</p>
  <h5>Busca da Informação > Parse para HTML > Extração da Informação > Armazenamento da Informação</h5>
</span>
<br>

1. Tem acesso a página web bruta;
2. Parseia num conteúdo que pode ser extraído igual uma página web;
3. Extraí os dados necessários através dos meios de identificação no 'document';
4. Armazena em um banco de dados, arquivo CSV ou outro lugar;

<p>Arquitetura aplicada no processo desse projeto:</p>

<img src="https://raw.githubusercontent.com/NicolasChirazawa/MyAnimeList-Scrapper/refs/heads/main/imagens/l%C3%B3gica_funcionamento.png">

1. Com os parâmetros definidos, é cumprido uma busca[^1] na <strong>API do Anilist</strong>, retornando os códigos respectivos dos
animês no site do MAL; <br>
2. É verificado se será ou não utilizado proxy[^2] na sua(s) busca(s) no site do MAL;
3. É feito um loop de busca(s), o resultado de cada uma delas é parseado para HTML;
4. É extraido as informações pré-definidas da págiba;
5. É decidido se a resposta será retornada em um simples console.log() ou num
arquivo '.CSV' (Comma Separate Value); <br>

<h2 name="inicializar">Como usar?</h2>
O projeto disponibiliza o arquivo 'parameters.js' ('./MyAnimeList-Scrapper/app/parameters.js) que deve ser utilizado
para realizar a configuração da sua busca. Nele, é possível customizar quatro parâmetros: <br> <br>

- filters_data: Filtragem de dados para a API do Anilist, caso queira utilizar um dado, mude o 'false' para o critério';
- special_filters: Filtragem de dados através de critérios como a 'strict_search' (determina a busca de uma obra) e o 'top';
- Is_generating_excel: Geração de Excel com o resultado da pesquisa;
- useProxy: Determina se vai ou não ser utilizado um Proxy para os requests no MAL;
<br>

Caso queira ver melhor como funciona os critérios de busca nos filtros, há um arquivo mais descritivo chamado
'parameters_descrition.txt', este está disponível na raiz. Ou, você também pode acessar a
<a href="https://docs.anilist.co/guide/graphql/">API do Anilist</a> diretamente.

<h2 name="inicializar">Limitações</h2>
Há um infeliz e claro problema dependendo de quais objetivos você persiga. <br>
Poderia ser possível utilizar a <strong>API do MAL</strong> para capturar as informações, entretanto, ela não é tão boa para buscas gerais
cujo é um dos objetivos desse projeto, como também, é necessário vincular seu usuário a uma chave API, e, dessa forma, possívelmente 
seria banido tanto o usuário quanto o ip por infringir as guidelines da API. 

<br>

> [!IMPORTANT]
> Este projeto respeita o 'robots.txt' do MyAnimeList.

<br>

Por conta disso, foi utilizado a API do Anilist, que para utilização dos filtros com dados concretos, fornece resultados previsíveis, como em:
- Data de lançamento;
- Busca por nome;
- Quantidade de episódios;
- Gêneros;
etc...
<br>

Mas para dados voláteis na utilização dos filtros, pode apresentar resultados inesperados, como em:
- Média de nota;
- Popularidade;

> [!WARNING]
> Lembre-se dos critérios imprevisíveis na filtragem de dados entre MAL e Anilist, isso pode causar imprecisões na
> conclusão das suas pesquisas.

<h2 name="inicializar">A fazer</h2>

- [ ] Meio de determinar que será feito uma ordenação;
- [ ] Meio de fazer um top para as obras buscadas;

[^1]: É necessário realizar essa busca na API do Anilist para capturar o(s) código(s) da URL do MAL, como em: 'https://myanimelist.net/anime/59027/'. Poderia ser obtido tais pelo MAL, mas ela é vinculada ao seu user.
[^2]:É possível realizar uma busca massiva no MAL pelo seu próprio IP, mas não é recomendado pois pode resultar em IP ban.
