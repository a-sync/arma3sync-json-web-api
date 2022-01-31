import { createServer } from 'http';
import { URL } from 'url';
import A3sRemoteServer, { A3sDataTypes } from './A3sRemoteServer';

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const DBG = Boolean(process.env.DBG || false);
const APP_PORT = process.env.app_port || '8080';
const APP_HOST = process.env.app_host || 'localhost';

createServer((req, res) => {
    if (DBG) console.log('DBG: %j %j', (new Date()), req.url);

    const reqUrl = new URL(req.url || '', 'http://localhost');
    const q_url = reqUrl.searchParams.get('url');
    const q_types = reqUrl.searchParams.get('types');

    if (typeof q_url === 'string') {
        const res_headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        };

        const a3srs = new A3sRemoteServer(q_url);
        if (DBG) console.log('A3sRemoteServer init with url: %s', a3srs.url);

        let types = undefined;
        if (typeof q_types === 'string' && q_types.length > 5) { // Note: shortest type is: events
            types = q_types.split(',') as Array<keyof typeof A3sDataTypes>;
            if (DBG) console.log('Types: %j', types);
        }

        a3srs.loadData(types)
            .then(_ => {
                res.writeHead(200, res_headers);
                res.end(JSON.stringify(a3srs, null, DBG ? 2 : 0));
            }).catch(err => {
                if (DBG) console.error('Error: %s', err.message);
                res.writeHead(404, res_headers);
                res.end(JSON.stringify({ error: err.message }, null, DBG ? 2 : 0));
            });
    } else {
        res.writeHead(301, { 'Location': 'https://github.com/a-sync/arma3sync.cloudno.de' });
        res.end();
    }
}).listen(APP_PORT);

console.log('Web service started %s:%s', APP_HOST, APP_PORT);

