import { PassThrough } from 'stream';
import { URL } from 'url';
import { gunzipSync } from 'zlib';
import axios, { AxiosResponse } from 'axios';
import * as ftp from 'basic-ftp';

// ArmA3Sync & java.io interfaces stolen from: https://github.com/gruppe-adler/node-arma3sync-lib
import { InputObjectStream } from 'java.io';

export interface A3sEventDto {
    name: string;
    description: string;
    addonNames: {
        [addonName: string]: boolean;
    };
    userconfigFolderNames: {
        [folderName: string]: boolean;
    };
}

export interface A3sEventsDto {
    list: A3sEventDto[];
}

export interface A3sChangelogDto {
    revision: number
    buildDate: Date
    contentUpdated: boolean
    newAddons: string[]
    updatedAddons: string[]
    deletedAddons: string[]
    addons: string[]
}

export interface A3sChangelogsDto {
    list: A3sChangelogDto[],
}

export interface A3sServerInfoDto {
    revision: number
    buildDate: Date
    numberOfFiles: number
    totalFilesSize: number
    hiddenFolderPaths: string[]
    numberOfConnections: number
    noPartialFileTransfer: boolean
    repositoryContentUpdated: boolean
    compressedPboFilesOnly: boolean
}

export interface A3sAutoconfigDto {
    favoriteServers: A3sFavoriteServerDto[];
    protocole: A3sRepositoryProtocolDto;
    repositoryName: string;
}

export interface A3sRepositoryProtocolDto {
    connectionTimeOut: string
    encryptionMode?: A3sEncryptionMode
    protocolType?: A3sProtocolType
    login: string
    password: string
    port: string
    readTimeOut: string
    url: string
}

export interface A3sProtocolType {
    description: string
    prompt: string
    defaultPort: string
    protocol: A3sProtocol
}

export interface A3sFavoriteServerDto {
    name: string
    ipAddress: string
    port: number
    password: string
    selected: boolean
    modSetName: string
    repositoryName: string
}

export interface A3sEncryptionMode {
    description: string
    encryption: A3sEncryption
}

export enum A3sProtocol {
    FTP,
    HTTP,
    HTTPS,
    A3S,
    FTP_BITTORRENT,
    HTTP_BITTORRENT,
    HTTPS_BITTORRENT,
    SOCKS4,
    SOCKS5
}

export enum A3sEncryption {
    NO_ENCRYPTION,
    EXPLICIT_SSL,
    IMPLICIT_SSL
}
// --

export enum A3sDataTypes {
    autoconfig = 'autoconfig',
    serverinfo = 'serverinfo',
    events = 'events',
    changelogs = 'changelogs'
}

export default class A3sRemoteServer {
    url: URL;
    autoconfig?: A3sAutoconfigDto;
    serverinfo?: A3sServerInfoDto;
    events?: A3sEventsDto;
    changelogs?: A3sChangelogsDto;

    /**
     * 
     * @param url the ArmA3Sync server url or autoconfig url
     */
    constructor(url: string) {
        if (url.slice(-11) === '/autoconfig') {
            url = url.slice(0, -10);
        }

        if (url.slice(-1) !== '/') {
            url += '/';
        }

        const reqUrl = new URL(url);
        if (!['http:', 'https:', 'ftp:', 'ftps:'].includes(reqUrl.protocol)) {
            throw new Error('Unupported protocol ' + reqUrl.protocol);
        }

        this.url = reqUrl;
    }

    public async loadData(types: Array<keyof typeof A3sDataTypes> = ['autoconfig', 'serverinfo', 'events', 'changelogs']): Promise<void> {
        if (this.url.protocol === 'http:' || this.url.protocol === 'https:') {
            const req_promises: Array<Promise<AxiosResponse | void>> = [];

            for (const t of types) {
                req_promises.push(this.loadSingleHttpData(t));
            }

            await Promise.allSettled(req_promises);
        } else if (this.url.protocol === 'ftp:' || this.url.protocol === 'ftps:') {
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

    private async loadSingleHttpData(t: keyof typeof A3sDataTypes): Promise<AxiosResponse | void> {
        try {
            const response: AxiosResponse<ArrayBuffer> = await axios.get(`${this.url.href}${t}`, { responseType: 'arraybuffer' });
            const buff: Buffer = Buffer.from(response.data);
            this[t] = new InputObjectStream(gunzipSync(buff), false).readObject();
        } catch (error) {
            console.error(`${this.url.href}${t}`, error);
        }
    }

    private async loadSingleFtpData(client: ftp.Client, t: keyof typeof A3sDataTypes): Promise<AxiosResponse | void> {
        try {
            const chunks: Buffer[] = [];
            const pass = new PassThrough();

            pass.on('data', (chunk) => {
                chunks.push(chunk);
            });

            await client.downloadTo(pass, `${this.url.pathname}${t}`);

            const buff: Buffer = Buffer.concat(chunks);
            this[t] = new InputObjectStream(gunzipSync(buff), false).readObject();
        } catch (error) {
            console.error(`${this.url.href}${t}`, error);
        }
    }

    private toJSON() {
        return {
            url: this.url,
            autoconfig: this.autoconfig,
            serverinfo: this.serverinfo,
            events: this.events,
            changelogs: this.changelogs
        }
    }
}
