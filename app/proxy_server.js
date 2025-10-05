const http = require("http");
const { URL } = require("url");

const { proxyList } = require("./parameters.js");

function rotateProxy(i) {
    let indice = i % proxyList.length;
    return proxyList[indice];
}

async function requestProxy (link, i) {
    const proxy = rotateProxy(i);
    const proxyURL = new URL(proxy);
    const linkURL = new URL(link);

    let authHeader = '';
    if(proxyURL.username && proxyURL.password) {
        authHeader = 'Basic ' + Buffer.from(`${proxyURL.username}:${proxyURL.password}`).toString("base64");
    };

    const options = {
        host: proxyURL.hostname,
        port: proxyURL.port,
        method: 'GET',
        path: linkURL.href,
        headers: {
            Host: linkURL.hostname, ...(authHeader ? { 'Proxy-Authorization': authHeader } : {})
        },
        timeout: 10000,
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if(res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ proxy, status: res.statusCode, body: data })
                } else {
                    reject(new Error(`Status: ${res.statusCode} via proxy ${proxy}`));
                }
            })
        });

        req.on("error", (err) => reject(err));
        req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Timeout no proxy ${proxy}`));
        });

        req.end();
    });
}

module.exports = { requestProxy };