import Client from "fhirclient/lib/Client";
import {fhirclient} from "fhirclient/lib/types";

export class ClientProxy {
    useProxy: boolean;
    proxyUrl: string | undefined;
    client: Client;
    proxyToken: string | undefined;

    constructor(useProxy: boolean, proxyUrl: string | undefined, client: Client) {
        this.useProxy = useProxy;
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
                    return response.text();
                }
                throw new Error("register error: received " + response.status + " " + response.statusText);
            })
            .then(text => {
                this.proxyToken = text;
            })
            .catch(error => {
                this.proxyToken = undefined;
                throw error;
            });
    }

    patientRequest(path: string, fhirOptions?: fhirclient.FhirOptions) : Promise<fhirclient.JsonObject[]> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.JsonObject[]> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                // path in the form <resource>?<k1=v1>&<k2=v2>&...
                let pathParts = new PathParts(path);
                pathParts.setParam("_format", "json");
                let newPath = pathParts.resourceType + "?" + pathParts.getParamsString();

                let url = this.proxyUrl + "/proxy/Patient/" + this.client.patient.id + "/" + newPath;

                console.log("requesting: ", url);

                fetch(url, requestOptions)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("request error: received " + response.status + " " + response.statusText);
                    })
                    .then(json => {
                        let arr : fhirclient.JsonObject[] = new Array<fhirclient.JsonObject>();
                        arr.push(json as fhirclient.JsonObject);
                        resolve(arr);
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

    request<T = any>(path: string, fhirOptions?: fhirclient.FhirOptions) : Promise<T> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<T> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                // path in the form <resource>?<k1=v1>&<k2=v2>&...
                let pathParts = new PathParts(path);
                pathParts.setParam("_format", "json");
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
            return this.client.request(path, fhirOptions);
        }
    }

    patientRead() : Promise<fhirclient.FHIR.Patient> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.FHIR.Patient> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

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
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson> ((resolve, reject) => {
                const headers = new Headers();
                headers.set('Content-Type', 'application/fhir+json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

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
