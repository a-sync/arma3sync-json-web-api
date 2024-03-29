"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const A3sRemoteServer_1 = __importDefault(require("./A3sRemoteServer"));
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const DBG = Boolean(process.env.DBG || false);
const APP_PORT = process.env.app_port || '8080';
const APP_HOST = process.env.app_host || 'localhost';
(0, http_1.createServer)(async (req, res) => {
    if (DBG)
        console.log('DBG: %j %j', (new Date()), req.url);
    const reqUrl = new url_1.URL(req.url || '', 'http://localhost');
    const q_url = reqUrl.searchParams.get('url');
    const q_types = reqUrl.searchParams.get('types');
    if (typeof q_url === 'string') {
        const res_headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        };
        const a3srs = new A3sRemoteServer_1.default(q_url);
        if (DBG)
            console.log('A3sRemoteServer init with url: %s', a3srs.url);
        let types = undefined;
        if (typeof q_types === 'string' && q_types.length > 5) { // Note: shortest type is: events
            types = q_types.split(',');
            if (DBG)
                console.log('Types: %j', types);
        }
        try {
            await a3srs.loadData(types);
            if (Object.keys(a3srs).length > 1) {
                res.writeHead(200, res_headers);
                res.end(JSON.stringify(a3srs, null, DBG ? 2 : 0));
            }
            else {
                throw new Error('Data retrieval from the server failed.');
            }
        }
        catch (error) {
            if (DBG)
                console.error(error);
            res.writeHead(404, res_headers);
            res.end(JSON.stringify({ error: error?.message || error }, null, DBG ? 2 : 0));
        }
    }
    else {
        res.writeHead(301, { 'Location': 'https://github.com/a-sync/arma3sync-json-web-api' });
        res.end();
    }
}).listen(APP_PORT);
console.log('Web service started %s:%s', APP_HOST, APP_PORT);
