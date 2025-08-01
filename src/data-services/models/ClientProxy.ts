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

        if (this.useProxy) {
            this.register
                .then(token => {
                    console.log("received proxy token: ", token);
                    this.proxyToken = token;

                }).catch(error => {
                    console.log("client proxy error:", error);
                });
        }
    }

    register = new Promise<string> ((resolve, reject) => {
        try {
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

            fetch(url, requestOptions)
                .then(response => {
                    if (response.ok) {
                        return response.text();
                    }
                    throw new Error("register error: received " + response.status + " " + response.statusText);
                })
                .then(text => {
                    console.log("register response: ", text);
                    resolve(text);
                })
                .catch(error => {
                    console.log('register error:', error)
                    reject(error);
                });

        } catch (error) {
            reject(error);
        }
    });

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

    request(path: string, fhirOptions?: fhirclient.FhirOptions) : Promise<fhirclient.JsonObject[]> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.JsonObject[]> ((resolve, reject) => {
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

    patientRead() : Promise<fhirclient.JsonObject> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.JsonObject> ((resolve, reject) => {
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

    userRead() : Promise<fhirclient.JsonObject> {
        if (this.useProxy) {
            if ( ! this.proxyToken ) {
                throw new Error("proxy token not available");
            }

            return new Promise<fhirclient.JsonObject> ((resolve, reject) => {
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
