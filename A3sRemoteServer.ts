import { URL } from 'url';
import { gunzipSync } from 'zlib';
import got, { CancelableRequest } from 'got';

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
    url: string;
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
        if (reqUrl.protocol !== 'http:' && reqUrl.protocol !== 'https:') {
            throw new Error('TODO: support protocols other than HTTP(S)');
        }

        this.url = reqUrl.href;
    }

    public async loadData(types: Array<keyof typeof A3sDataTypes> = ['autoconfig', 'serverinfo', 'events', 'changelogs']): Promise<void> {
        const req_promises: Array<Promise<CancelableRequest | void>> = [];
        for (const t of types) {
            req_promises.push(this.loadSingleData(t));
        }

        return Promise.all(req_promises).then(() => Promise.resolve());
    }

    private async loadSingleData(t: keyof typeof A3sDataTypes): Promise<CancelableRequest | void> {
        return got(this.url + t, { decompress: false })
            .buffer()
            .then(buff => {
                this[t] = new InputObjectStream(gunzipSync(buff), false).readObject();
                // console.log(JSON.stringify(this[t], null, 2)); // debug
            });
            // .catch(e => console.error(t, e.message)); // debug
    }
}
