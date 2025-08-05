import Client from "fhirclient/lib/Client";
import {fhirclient} from "fhirclient/lib/types";
import {Patient} from "../fhir-types/fhir-r4";

export class ClientProxy {
    useProxy: boolean;
    proxyUrl: string | undefined;
    client: Client;
    proxyToken: string | undefined;

    constructor(useProxy: boolean, proxyUrl: string | undefined, client: Client) {
        console.log("creating client proxy");

        this.useProxy = useProxy;
        this.proxyUrl = proxyUrl;
        this.client = client;

        if (this.useProxy) {
            this.register(client)
                .then(() => {
                    console.log("client proxy registered");
                })
                .catch(error => {
                    console.log('register error:', error)
                });
        }
    }

    async register(client: Client) : Promise<void> {
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
        headers.set('Content-Type', 'application/json');

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

            // path in the form <resource>?<k1=v1>&<k2=v2>&...
            let pathParts = new PathParts(path);
            if ( ! pathParts.hasParam("subject") && ! pathParts.hasParam("patient") ) {
                pathParts.setParam("subject", "Patient/" + this.client.patient.id);
            }

            let newPath = pathParts.resourceType + "?" + pathParts.getParamsString();

            return this.request(newPath, fhirOptions);

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
                headers.set('Content-Type', 'application/json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                let url = this.proxyUrl + "/proxy/" + path;

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
                headers.set('Content-Type', 'application/json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                let url = this.proxyUrl + "/proxy/Patient/" + this.client.patient.id;

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
                headers.set('Content-Type', 'application/json');
                headers.set('Authorization', 'Bearer ' + this.proxyToken);

                const requestOptions = {
                    method: 'GET',
                    headers: headers
                }

                let url = this.proxyUrl + "/proxy/User/" + this.client.user.id;

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
        for (let i = 1; i < parts.length; i++) {
            let param = parts[i].split("=");
            this.params.set(param[0], param[1]);
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
