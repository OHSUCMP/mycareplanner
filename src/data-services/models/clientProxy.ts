import Client from "fhirclient/lib/Client";
import {fhirclient} from "fhirclient/lib/types";
import {FhirQueryConfig} from "../providerEndpointService";

const defaultFhirQueryConfig: FhirQueryConfig = {
    includeProvenance: true
};

export class ClientProxy {
    useProxy: boolean;
    fhirQueryConfig: FhirQueryConfig | undefined;
    proxyUrl: string | undefined;
    client: Client;
    proxyAccessToken: string | undefined;

    constructor(useProxy: boolean,
                fhirQueryConfig: FhirQueryConfig | undefined,
                proxyUrl: string | undefined,
                client: Client) {
        if (useProxy && ! proxyUrl) {
            throw new Error("proxy specified for use but proxyUrl not set");
        }

        this.useProxy = useProxy;
        this.fhirQueryConfig = fhirQueryConfig ?? defaultFhirQueryConfig;
        this.proxyUrl = proxyUrl;
        this.client = client;
    }

    async register() : Promise<void> {
        if ( ! this.useProxy ) {
            console.log("register() called with useProxy=false; skipping -");
            return;
        }
        if ( ! this.proxyUrl ) {
            throw new Error("proxyUrl not set");
        }

        console.log("registering client proxy");

        let data = {
            clientId: this.client.state.clientId,
            serverUrl: this.client.state.serverUrl,
            bearerToken: this.client.state.tokenResponse?.access_token,
            patientId: this.client.patient.id,
            userId: this.client.user.id
        };
        console.log("client data: %j", data);

        const headers = new Headers();
        headers.set('Content-Type', 'application/fhir+json');

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        }

        let url = this.proxyUrl + "/register";

        await fetch(url, requestOptions)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("register error: received " + response.status + " " + response.statusText);
            })
            .then(json => {
                this.proxyAccessToken = json.accessToken;
            })
            .catch(error => {
                this.proxyAccessToken = undefined;
                throw error;
            });
    }

    patientSearch(path: string, fhirOptions?: fhirclient.FhirOptions) : Promise<fhirclient.JsonObject[]> {
        path = this.applyFhirQueryConfig(path);

        if (this.useProxy) {
            if ( ! this.proxyAccessToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.JsonObject[]> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyAccessToken);

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
                        reject(error);
                    });
            });

        } else {
            return this.client.patient.request(path, fhirOptions);
        }
    }

    read<T = any>(reference: string, fhirOptions?: fhirclient.FhirOptions) : Promise<T> {
        if (this.useProxy) {
            if ( ! this.proxyAccessToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<T> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyAccessToken);

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
                        reject(error);
                    });
            });

        } else {
            return this.client.request(reference, fhirOptions);
        }
    }

    patientRead() : Promise<fhirclient.FHIR.Patient> {
        if (this.useProxy) {
            if ( ! this.proxyAccessToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.FHIR.Patient> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyAccessToken);

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
                        reject(error);
                    });
            });

        } else {
            return this.client.patient.read();
        }
    }

    userRead() : Promise<fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson> {
        if (this.useProxy) {
            if ( ! this.proxyAccessToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyAccessToken);

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
                        reject(error);
                    });
            });

        } else {
            return this.client.user.read();
        }
    }

    applyFhirQueryConfig(path: string) : string {
        if (this.fhirQueryConfig) {
            let pathParts = new PathParts(path);

            if (this.fhirQueryConfig.includeProvenance) {
                pathParts.setParam("_revinclude", "Provenance:target");
            }

            return pathParts.resourceType + "?" + pathParts.getParamsString();

        } else {
            return path;
        }
    }
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
