"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
//Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const A3sRemoteServer_1 = __importDefault(require("./A3sRemoteServer"));
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const DBG = Boolean(process.env.DBG) || false;
(0, http_1.createServer)(async (req, res) => {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const q_url = reqUrl.searchParams.get('url');
    const q_types = reqUrl.searchParams.get('types');
    if (DBG)
        console.log('DBG: %j %j', (new Date()), req.url);
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
        a3srs.loadData(types)
            .then(_ => {
            res.writeHead(200, res_headers);
            res.end(JSON.stringify(a3srs, null, DBG ? 2 : 0));
        }).catch(err => {
            if (DBG)
                console.error('Error: %s', err.message);
            res.writeHead(404, res_headers);
            res.end(JSON.stringify({ error: err.message }, null, DBG ? 2 : 0));
        });
    }
    else {
        res.writeHead(301, { 'Location': 'https://github.com/a-sync/arma3sync.cloudno.de' });
        res.end();
    }
}).listen(80, '0.0.0.0');
