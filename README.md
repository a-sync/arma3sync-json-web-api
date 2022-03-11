# arma3sync.cloudno.de
Web service that reads ArmA3Sync server data and returns it in JSON format.

## Accepted request query fields
* **url**: ArmA3Sync server url
* types: comma separated list of requested data types
  - `autoconfig`
  - `serverinfo`
  - `events`
  - `changelogs`

## Success response
_Status 200 application/json_  
Object. Has a `url` field with string value.
```ts
{
    url: string;
    autoconfig?: A3sAutoconfigDto;
    serverinfo?: A3sServerInfoDto;
    events?: A3sEventsDto;
    changelogs?: A3sChangelogsDto;
}
```

## Error response
_Status 404 application/json_  
Object. Has a single `error` field with string value.

## Examples
```
https://arma3sync.cloudno.de/?url=https://arma3sync.anrop.se/.a3s
https://arma3sync.cloudno.de/?url=https://repo.ofcra.org/.a3s&types=serverinfo,events
```
