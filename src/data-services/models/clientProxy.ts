import Client from "fhirclient/lib/Client";
import {fhirclient} from "fhirclient/lib/types";
import {FhirQueryConfig} from "../providerEndpointService";
import {Resource} from "../fhir-types/fhir-r4";
import {doLog} from '../../log/log-service';

export class ClientProxy {
    useProxy: boolean;
    fhirQueryConfigMap: Map<String, FhirQueryConfig> | undefined;
    proxyUrl: string | undefined;
    client: Client;

    constructor(useProxy: boolean,
                fhirQueryConfigMap: Map<String, FhirQueryConfig> | undefined,
                proxyUrl: string | undefined,
                client: Client) {
        if (useProxy && ! proxyUrl) {
            throw new Error("proxy specified for use but proxyUrl not set");
        }

        this.useProxy = useProxy;
        this.fhirQueryConfigMap = fhirQueryConfigMap;
        this.proxyUrl = proxyUrl;
        this.client = client;
    }

    fhirQueryConfig(key: string) : FhirQueryConfig | undefined {
        if (this.fhirQueryConfigMap) {
            return this.fhirQueryConfigMap.get(key);
        } else {
            return undefined;
        }
    }

    async patientSearchByKey(key: string) : Promise<Resource[]> {
        let resources: Resource[] = []
        let fqc: FhirQueryConfig | undefined = this.fhirQueryConfig(key)
        if (fqc === undefined) {
            throw new Error("patientSearchByKey: FhirQueryConfig not found for '" + key + "'");
        }

        for (let path of fqc.path) {
            try {
                console.debug("patientSearchByKey: " + key + " / " + path)
                resources = resources.concat(
                    this.resourcesFrom(
                        await this.patientSearch(this.doTokenReplacements(path), fqc.fhirOptions) as fhirclient.JsonObject[]
                    )
                )
            } catch (error) {
                console.log("error: ", error)
            }
        }

        return resources;
    }

    doTokenReplacements(path: string) : string {
        // quick and dirty, can make this more flexible later
        if (path.includes("{TWO_YEARS_AGO}")) {
            path = path.replaceAll("{TWO_YEARS_AGO}", this.buildRelativeDate(2));
        }

        if (path.includes("{THREE_YEARS_AGO}")) {
            path = path.replaceAll("{THREE_YEARS_AGO}", this.buildRelativeDate(3));
        }

        if (path.includes("{TEN_YEARS_AGO}")) {
            path = path.replaceAll("{TEN_YEARS_AGO}", this.buildRelativeDate(10));
        }

        return path;
    }

    buildRelativeDate(yearsToSubtract: number) : string {
        let now = new Date();
        let date = new Date(now.getFullYear() - yearsToSubtract, now.getMonth(), now.getDate());
        return date.toISOString().split("T")[0];
    }

    patientSearch(path: string, fhirOptions?: fhirclient.FhirOptions) : Promise<fhirclient.JsonObject[]> {
        if (this.useProxy) {
            return new Promise<fhirclient.JsonObject[]> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('X-Proxy-Client-Id', <string>this.client.state.clientId);
                headers.set('X-Proxy-Server-Url', this.client.state.serverUrl);
                headers.set('X-Proxy-Bearer-Token', <string>this.client.state.tokenResponse?.access_token);
                headers.set('X-Proxy-Patient-Id', <string>this.client.patient.id);
                headers.set('X-Proxy-User-Id', <string>this.client.user.id)

                if (fhirOptions && fhirOptions.pageLimit && fhirOptions.pageLimit > 0) {
                    headers.set('X-Page-Limit', fhirOptions.pageLimit.toString());
                }

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                // path in the form <resource>?<k1=v1>&<k2=v2>&...
                let pathParts = new PathParts(path);
                pathParts.setParam("_format", "json");

                if (this.client.patient && this.client.patient.id) {
                    pathParts.setParam("patient", this.client.patient.id);
                } else {
                    throw new Error("patient not available");
                }

                let newPath = pathParts.resourceType + "?" + pathParts.getParamsString();

                let url = this.proxyUrl + "/proxy/" + newPath;

                console.log("requesting: ", url);

                fetch(url, requestOptions)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("request error: received " + response.status + " " + response.statusText);
                    })
                    .then(json => {
                        resolve(json);
                    })
                    .catch(error => {
                        console.log('error:', error)
                        doLog({
                            level: 'error',
                            event: 'patientSearch-proxy',
                            page: 'n/a',
                            message: `caught error='${error}' executing query for path='${path}' against endpoint='${this.client.state.serverUrl}'`
                        })
                        reject(error);
                    });
            });

        } else {
            try {
                return this.client.patient.request(path, fhirOptions);
            } catch (err) {
                doLog({
                    level: 'error',
                    event: 'patientSearch-native',
                    page: 'n/a',
                    message: `caught error='${err}' executing query for path='${path}' against endpoint='${this.client.state.serverUrl}'`
                })
                throw err;
            }
        }
    }

    read<T = any>(reference: string, fhirOptions?: fhirclient.FhirOptions) : Promise<T> {
        if (this.useProxy) {
            return new Promise<T> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('X-Proxy-Client-Id', <string>this.client.state.clientId);
                headers.set('X-Proxy-Server-Url', this.client.state.serverUrl);
                headers.set('X-Proxy-Bearer-Token', <string>this.client.state.tokenResponse?.access_token);
                headers.set('X-Proxy-Patient-Id', <string>this.client.patient.id);
                headers.set('X-Proxy-User-Id', <string>this.client.user.id)

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                // path in the form <resource>?<k1=v1>&<k2=v2>&...
                let pathParts = new PathParts(reference);
                pathParts.setParam("_format", "json");
                let newPath = pathParts.resourceType + "?" + pathParts.getParamsString();

                let url = this.proxyUrl + "/proxy/" + newPath;

                console.log("read: ", url);

                fetch(url, requestOptions)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("request error: received " + response.status + " " + response.statusText);
                    })
                    .then(json => {
                        resolve(json);
                    })
                    .catch(error => {
                        console.log('error:', error)
                        doLog({
                            level: 'error',
                            event: 'read-proxy',
                            page: 'n/a',
                            message: `caught error='${error}' reading reference='${reference}' against endpoint='${this.client.state.serverUrl}'`
                        })
                        reject(error);
                    });
            });

        } else {
            try {
                return this.client.request(reference, fhirOptions);
            } catch (err) {
                doLog({
                    level: 'error',
                    event: 'read-native',
                    page: 'n/a',
                    message: `caught error='${err}' reading reference='${reference}' against endpoint='${this.client.state.serverUrl}'`
                })
                throw err;
            }
        }
    }

    patientRead() : Promise<fhirclient.FHIR.Patient> {
        if (this.useProxy) {
            return new Promise<fhirclient.FHIR.Patient> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('X-Proxy-Client-Id', <string>this.client.state.clientId);
                headers.set('X-Proxy-Server-Url', this.client.state.serverUrl);
                headers.set('X-Proxy-Bearer-Token', <string>this.client.state.tokenResponse?.access_token);
                headers.set('X-Proxy-Patient-Id', <string>this.client.patient.id);
                headers.set('X-Proxy-User-Id', <string>this.client.user.id)

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                let url = this.proxyUrl + "/proxy/Patient/" + this.client.patient.id + "?_format=json";

                console.log("requesting: ", url);

                fetch(url, requestOptions)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("patientRead error: received " + response.status + " " + response.statusText);
                    })
                    .then(json => {
                        resolve(json);
                    })
                    .catch(error => {
                        console.log('error:', error)
                        doLog({
                            level: 'error',
                            event: 'patientRead-proxy',
                            page: 'n/a',
                            message: `caught error='${error}' reading patient='${this.client.patient.id}' against endpoint='${this.client.state.serverUrl}'`
                        })
                        reject(error);
                    });
            });

        } else {
            try {
                return this.client.patient.read();
            } catch (err) {
                doLog({
                    level: 'error',
                    event: 'patientRead-native',
                    page: 'n/a',
                    message: `caught error='${err}' reading patient='${this.client.patient.id}' against endpoint='${this.client.state.serverUrl}'`
                })
                throw err;
            }
        }
    }

    userRead() : Promise<fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson> {
        if (this.useProxy) {
            return new Promise<fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('X-Proxy-Client-Id', <string>this.client.state.clientId);
                headers.set('X-Proxy-Server-Url', this.client.state.serverUrl);
                headers.set('X-Proxy-Bearer-Token', <string>this.client.state.tokenResponse?.access_token);
                headers.set('X-Proxy-Patient-Id', <string>this.client.patient.id);
                headers.set('X-Proxy-User-Id', <string>this.client.user.id)

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                let url = this.proxyUrl + "/proxy/User/" + this.client.user.id + "?_format=json";

                console.log("requesting: ", url);

                fetch(url, requestOptions)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("userRead error: received " + response.status + " " + response.statusText);
                    })
                    .then(json => {
                        resolve(json);
                    })
                    .catch(error => {
                        console.log('error:', error)
                        doLog({
                            level: 'error',
                            event: 'userRead-proxy',
                            page: 'n/a',
                            message: `caught error='${error}' reading user='${this.client.user.id}' against endpoint='${this.client.state.serverUrl}'`
                        })
                        reject(error);
                    });
            });

        } else {
            try {
                return this.client.user.read();
            } catch (err) {
                doLog({
                    level: 'error',
                    event: 'userRead-native',
                    page: 'n/a',
                    message: `caught error='${err}' reading user='${this.client.user.id}' against endpoint='${this.client.state.serverUrl}'`
                })
                throw err;
            }
        }
    }

    resourcesFrom = (response: any): Resource[] => {
        // sometimes response is an Array, but other times it's an Object with resourceType='Bundle'.
        // We only want to flatMap the response if it comes in as an Array.  But if it comes in as
        // an Object with resourceType='Bundle', we just want to grab its entries.

        try {
            let entries : fhirclient.JsonObject[];
            if (response instanceof Array) {
                entries = response.flatMap(r => (r as fhirclient.JsonObject)?.entry as fhirclient.JsonObject[] || []);

            } else if (response.resourceType === 'Bundle') {
                entries = (response as fhirclient.JsonObject)?.entry as fhirclient.JsonObject[] || [];

            } else {
                throw new Error('response is not an array or a Bundle');
            }

            return entries?.map((entry: fhirclient.JsonObject) => entry.resource as any)
                .filter((resource: Resource) => resource.resourceType !== 'OperationOutcome');

        } catch (error) {
            console.log('resourcesFrom: caught error: ', error)
            doLog({
                level: 'error',
                event: 'resourcesFrom',
                page: 'n/a',
                message: `caught error='${error}' processing resources`
            })
            throw error;
        }
    };
}

export class PathParts {
    resourceType: string;
    params: Map<string, string>;

    constructor(path: string) {
        let parts = path.split("?");
        this.resourceType = parts[0];
        this.params = new Map<string, string>();
        if (parts.length > 1) {
            let paramParts = parts[1].split("&");
            for (let i = 0; i < paramParts.length; i++) {
                let param = paramParts[i].split("=");
                this.params.set(param[0], param[1]);
            }
        }
    }

    hasParam(param: string) : boolean {
        return this.params.has(param);
    }

    setParam(param: string, value: string) : void {
        this.params.set(param, value);
    }

    getParamsString() {
        let arr:Array<string> = [];
        this.params.forEach((value, key) => {
            arr.push(key + "=" + value);
        })
        return arr.join("&");
    }
}
