"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.A3sDataTypes = exports.A3sEncryption = exports.A3sProtocol = void 0;
const url_1 = require("url");
const zlib_1 = require("zlib");
const got_1 = __importDefault(require("got"));
// ArmA3Sync & java.io interfaces stolen from: https://github.com/gruppe-adler/node-arma3sync-lib
const java_io_1 = require("java.io");
var A3sProtocol;
(function (A3sProtocol) {
    A3sProtocol[A3sProtocol["FTP"] = 0] = "FTP";
    A3sProtocol[A3sProtocol["HTTP"] = 1] = "HTTP";
    A3sProtocol[A3sProtocol["HTTPS"] = 2] = "HTTPS";
    A3sProtocol[A3sProtocol["A3S"] = 3] = "A3S";
    A3sProtocol[A3sProtocol["FTP_BITTORRENT"] = 4] = "FTP_BITTORRENT";
    A3sProtocol[A3sProtocol["HTTP_BITTORRENT"] = 5] = "HTTP_BITTORRENT";
    A3sProtocol[A3sProtocol["HTTPS_BITTORRENT"] = 6] = "HTTPS_BITTORRENT";
    A3sProtocol[A3sProtocol["SOCKS4"] = 7] = "SOCKS4";
    A3sProtocol[A3sProtocol["SOCKS5"] = 8] = "SOCKS5";
})(A3sProtocol = exports.A3sProtocol || (exports.A3sProtocol = {}));
var A3sEncryption;
(function (A3sEncryption) {
    A3sEncryption[A3sEncryption["NO_ENCRYPTION"] = 0] = "NO_ENCRYPTION";
    A3sEncryption[A3sEncryption["EXPLICIT_SSL"] = 1] = "EXPLICIT_SSL";
    A3sEncryption[A3sEncryption["IMPLICIT_SSL"] = 2] = "IMPLICIT_SSL";
})(A3sEncryption = exports.A3sEncryption || (exports.A3sEncryption = {}));
// --
var A3sDataTypes;
(function (A3sDataTypes) {
    A3sDataTypes["autoconfig"] = "autoconfig";
    A3sDataTypes["serverinfo"] = "serverinfo";
    A3sDataTypes["events"] = "events";
    A3sDataTypes["changelogs"] = "changelogs";
})(A3sDataTypes = exports.A3sDataTypes || (exports.A3sDataTypes = {}));
class A3sRemoteServer {
    /**
     *
     * @param url the ArmA3Sync server url or autoconfig url
     */
    constructor(url) {
        if (url.slice(-11) === '/autoconfig') {
            url = url.slice(0, -10);
        }
        if (url.slice(-1) !== '/') {
            url += '/';
        }
        const reqUrl = new url_1.URL(url);
        if (reqUrl.protocol !== 'http:' && reqUrl.protocol !== 'https:') {
            throw new Error('TODO: support protocols other than HTTP(S)');
        }
        this.url = reqUrl.href;
    }
    async loadData(types = ['autoconfig', 'serverinfo', 'events', 'changelogs']) {
        const req_promises = [];
        for (const t of types) {
            req_promises.push(this.loadSingleData(t));
        }
        return Promise.all(req_promises).then(() => Promise.resolve());
    }
    async loadSingleData(t) {
        return (0, got_1.default)(this.url + t, { decompress: false })
            .buffer()
            .then(buff => {
            this[t] = new java_io_1.InputObjectStream((0, zlib_1.gunzipSync)(buff), false).readObject();
            // console.log(JSON.stringify(this[t], null, 2)); // debug
        });
        // .catch(e => console.error(t, e.message)); // debug
    }
}
exports.default = A3sRemoteServer;
