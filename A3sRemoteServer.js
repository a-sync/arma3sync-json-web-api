"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.A3sDataTypes = exports.A3sEncryption = exports.A3sProtocol = void 0;
const stream_1 = require("stream");
const url_1 = require("url");
const zlib_1 = require("zlib");
const axios_1 = __importDefault(require("axios"));
const ftp = __importStar(require("basic-ftp"));
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
        if (!['http:', 'https:', 'ftp:', 'ftps:'].includes(reqUrl.protocol)) {
            throw new Error('Unupported protocol ' + reqUrl.protocol);
        }
        this.url = reqUrl;
    }
    async loadData(types = ['autoconfig', 'serverinfo', 'events', 'changelogs']) {
        if (this.url.protocol === 'http:' || this.url.protocol === 'https:') {
            const req_promises = [];
            for (const t of types) {
                req_promises.push(this.loadSingleHttpData(t));
            }
            await Promise.allSettled(req_promises);
        }
        else if (this.url.protocol === 'ftp:' || this.url.protocol === 'ftps:') {
            const client = new ftp.Client();
            // client.ftp.verbose = true;
            await client.access({
                host: this.url.host,
                port: this.url.port ? Number(this.url.port) : undefined,
                secure: Boolean(this.url.protocol === 'ftps:')
            });
            for (const t of types) {
                await this.loadSingleFtpData(client, t);
            }
            client.close();
        }
    }
    async loadSingleHttpData(t) {
        try {
            const response = await axios_1.default.get(`${this.url.href}${t}`, { responseType: 'arraybuffer' });
            const buff = Buffer.from(response.data);
            this[t] = new java_io_1.InputObjectStream((0, zlib_1.gunzipSync)(buff), false).readObject();
        }
        catch (error) {
            console.error(`${this.url.href}${t}`, error);
        }
    }
    async loadSingleFtpData(client, t) {
        try {
            const chunks = [];
            const pass = new stream_1.PassThrough();
            pass.on('data', (chunk) => {
                chunks.push(chunk);
            });
            await client.downloadTo(pass, `${this.url.pathname}${t}`);
            const buff = Buffer.concat(chunks);
            this[t] = new java_io_1.InputObjectStream((0, zlib_1.gunzipSync)(buff), false).readObject();
        }
        catch (error) {
            console.error(`${this.url.href}${t}`, error);
        }
    }
    toJSON() {
        return {
            url: this.url,
            autoconfig: this.autoconfig,
            serverinfo: this.serverinfo,
            events: this.events,
            changelogs: this.changelogs
        };
    }
}
exports.default = A3sRemoteServer;
