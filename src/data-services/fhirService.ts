import FHIR from 'fhirclient'
import {fhirclient} from 'fhirclient/lib/types'
import {
    Resource, Patient, Practitioner, RelatedPerson, CarePlan, CareTeam, Encounter, Condition, DiagnosticReport, Goal,
    Observation, Procedure, Immunization, MedicationRequest, ServiceRequest, Provenance, Reference, Questionnaire,
    QuestionnaireResponse
} from './fhir-types/fhir-r4'
import {QuestionnaireBundle, FHIRData, hasScope} from './models/fhirResources'
import {format} from 'date-fns'
import Client from 'fhirclient/lib/Client'
import {ClientProxy} from "./models/clientProxy"
import {
    persistStateAsCurrent, getStateForEndpoint,
    persistStateAsLauncherData
} from './persistenceService'
import {buildQuestionnaireBundles} from './questionnaireService'
import {doLog} from '../log';
import DefaultFhirQueryConfig from "./fhir-queries/defaultFhirQueryConfig.json"
import {FhirQueryConfig, getLauncherDataForState, LauncherData} from "./providerEndpointService";

const resourcesFrom = (response: any): Resource[] => {
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
        throw error;
    }
};

// TODO full date argument does not work correctly in Logica?  Use only yyyy-MM for now.
// export const getDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM-dd')}`;
// export const getGEDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM')}`;
// export const getLTDateParameter = (d: Date): string => `lt${format(d, 'yyyy-MM')}`;
// const today: Date = new Date()
// const oneYearAgo = addPeriodToDate(today, {years: -1})
// const threeYearsAgo = addPeriodToDate(today, {years: -3})
// const fiveYearsAgo = addPeriodToDate(today, {years: -5})
// const eighteenMonthsAgo = addPeriodToDate(today, {months: -18})
// const twoYearsAgo = addPeriodToDate(today, {years: -2})
// const tenYearsAgo = addPeriodToDate(today, {years: -10})

/// Epic category codes
// const carePlanPath = 'CarePlan?status=active&category=38717003,736271009,assess-plan'

// 'assess-plan' returns Longitudinal Care Plan in both Cerner and Epic.
// Cerner throws an error when including other category codes
// const carePlanPath = 'CarePlan?status=active&category=assess-plan'

// Allscripts and Cerner throws error with _include arg for participants.
// const careTeamPath = 'CareTeam?category=longitudinal'
// const careTeamPath_include = 'CareTeam?_include=CareTeam:participant'

// const goalsPath = 'Goal?lifecycle-status=active,completed,cancelled'

// const encountersPath = 'Encounter?date=' + getGEDateParameter(twoYearsAgo)

/// Epic allows multiple category codes only >= Aug 2021 release
// const conditionsPath = 'Condition?category=problem-list-item,health-concern,LG41762-2&clinical-status=active';
// const problemListPath = 'Condition?category=problem-list-item&clinical-status=active'
// const healthConcernPath = 'Condition?category=health-concern&clinical-status=active'

// const immunizationsPath = 'Immunization?status=completed'
// storer: lab results now pulling from 3 years back, was 5, for #4
// const labResultsPath = 'Observation?category=laboratory&date=' + getGEDateParameter(threeYearsAgo)
// const eGFRExtraResultsPath = 'Observation?code=http://loinc.org|45066-8,http://loinc.org|48642-3,http://loinc.org|48643-1,http://loinc.org|50044-7,http://loinc.org|50210-4,http://loinc.org|50384-7,http://loinc.org|62238-1,http://loinc.org|69405-9,http://loinc.org|70969-1,http://loinc.org|77147-7,http://loinc.org|88293-6,http://loinc.org|88294-4,http://loinc.org|94677-2,http://loinc.org|98979-8,http://loinc.org|98980-6&date=' + getGEDateParameter(tenYearsAgo) + '&date=' + getLTDateParameter(threeYearsAgo)

// Allscripts does not support both status and authoredon args
// const medicationRequestPath = 'MedicationRequest?status=active&authoredon=' + getDateParameter(threeYearsAgo)
// const medicationRequestActivePath = 'MedicationRequest?status=active'
// const medicationRequestInactivePath = 'MedicationRequest?status=on-hold,cancelled,completed,stopped&_count=10'
// const medicationRequesterInclude = '&_include=MedicationRequest:requester'

// const serviceRequestPath = 'ServiceRequest?status=active&authored=' + getGEDateParameter(twoYearsAgo)
// const serviceRequesterInclude = '&_include=ServiceRequest:requester'

// const proceduresTimePath = 'Procedure?date=' + getGEDateParameter(threeYearsAgo)
// const proceduresCountPath = 'Procedure?_count=100'
// const diagnosticReportPath = 'DiagnosticReport?date=' + getGEDateParameter(threeYearsAgo)
// const socialHistoryPath = 'Observation?category=social-history'
// const questionnaireResponsePath = 'QuestionnaireResponse?status=completed'
// const surveyObservationsPath = 'Observation?category=survey'

/// category=survey returns 400 error from Epic, so include another category recognized by Epic
// const surveyResultsPath = 'Observation?category=survey,functional-mental-status'

// const noPageLimit: fhirclient.FhirOptions = {
//     // no page limit, fetch all pages and results.
//     pageLimit: 0
// }
//
// const onePageLimit: fhirclient.FhirOptions = {
//     // setting pageLimit=1 always returns zero results, limit=2 appears to return only one page with _count limit.
//
//     // storer: the comment above does not track with my testing.  pageLimit=1 does return results if results exist
//     //         to be found.  reverting pageLimit to 1
//
//     pageLimit: 1
// }

/// key = Resource.id  value = Provenance[]
let provenanceMap = new Map<string, Provenance[]>()

let provenance: Provenance[] = []

function addPeriodToDate(date: Date, {years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0}) {
    let newDate = new Date(date);

    newDate.setFullYear(newDate.getFullYear() + years);
    newDate.setMonth(newDate.getMonth() + months);
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(newDate.getHours() + hours);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    newDate.setSeconds(newDate.getSeconds() + seconds);

    return newDate;
}

function recordProvenance(resources: Resource[] | undefined) {
    const provResources = resources?.filter((item: any) => item?.resourceType === 'Provenance') as Provenance[]

    provResources?.forEach((prov: Provenance) => {
        prov.target.forEach((ref: Reference) => {
            let resourceId = ref.reference
            if (resourceId !== undefined) {
                let provList: Provenance[] = provenanceMap.get(resourceId) ?? []
                provList = provList.concat([prov])
                provenanceMap.set(resourceId!, provList)
            }
        })
    })

    if (provResources !== undefined) {
        provenance = provenance.concat(provResources!)
    }
}

// storer: get Encounters for #5
export async function getEncounters(clientProxy: ClientProxy): Promise<Encounter[]> {
    // let resources: Resource[] = []
    await doLog({
        level: 'debug',
        event: 'getEncounters',
        page: 'get Encounters',
        message: `getEncounters: success`
    })
    // workaround for Allscripts lack of support for both category and status args
    // Epic allows multiple category codes in one query only >= Aug 2021 release
    let resources: Resource[] = await clientProxy.patientSearchByKey("encounters")
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(encountersPath, noPageLimit) as fhirclient.JsonObject[]))

    const encounters = resources.filter((item: any) => item?.resourceType === 'Encounter') as Encounter[]
    recordProvenance(resources)

    return encounters
}

export async function getConditions(clientProxy: ClientProxy): Promise<Condition[]> {
    // let resources: Resource[] = []
    await doLog({
        level: 'debug',
        event: 'getConditions',
        page: 'get Conditions',
        message: `getConditions: success`
    })
    // workaround for Allscripts lack of support for both category and status args
    // const url = new URL(clientProxy.client.state.serverUrl);
    // const allowedHosts = ['allscripts.com'];
    let resources: Resource[] = await clientProxy.patientSearchByKey("conditions")
    // if (allowedHosts.includes(url.host)) {
    //     const conditionsPath = 'Condition?category=problem-list-item,health-concern'
    //     resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(conditionsPath, noPageLimit) as fhirclient.JsonObject[]))
    //
    // } else {
    //     // Epic allows multiple category codes in one query only >= Aug 2021 release
    //     resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(problemListPath, noPageLimit) as fhirclient.JsonObject[]))
    //     resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(healthConcernPath, noPageLimit) as fhirclient.JsonObject[]))
    // }

    const conditions = resources.filter((item: any) => item?.resourceType === 'Condition') as Condition[]
    recordProvenance(resources)

    return conditions
}

export async function getVitalSigns(clientProxy: ClientProxy): Promise<Observation[]> {
    // Workaround for Cerner and Epic Sandbox that takes many minutes to request vital-signs, or times out completely
    await doLog({
        level: 'debug',
        event: 'getVitalSigns',
        page: 'get Vital Signs',
        message: `getVitalSigns: success`
    })
    // if (client.state.endpoint === 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
    //   || client.state.endpoint.includes('cerner.com')) {
    //   return []
    // }

    let resources: Resource[] = await clientProxy.patientSearchByKey("vitals")
    // // codes are ordered by preference for presentation: BP, Heart rate, O2 sat, temp, weight, height, BMI
    // // const vitalsCodes = ['85354-9', '8867-4', '59408-5', '2708-6', '8310-5', '29463-7', '8302-2', '39156-5']
    // // codes are ordered by preference for presentation: BP, O2 sat, temp, weight, height, BMI
    // const vitalsCodes = ['8867-4', '59408-5', '8310-5', '29463-7', '8302-2', '39156-5']
    // const queryPaths = vitalsCodes.map(code => {
    //     // Issue: UCHealth returns 400 error if include both category and code.
    //     // return 'Observation?category=vital-signs&code=http://loinc.org|' + code + '&_sort:desc=date&_count=1'
    //     // return 'Observation?code=http://loinc.org|' + code + '&_sort:desc=date&_count=1' + provenanceSearch
    //     return 'Observation?code=http://loinc.org|' + code + '&date=' + getGEDateParameter(twoYearsAgo) + '&_count=10'
    // })
    //
    // // await can be used only at top-level within a function, cannot use queryPaths.forEach()
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[0], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[1], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[2], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[3], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[4], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(queryPaths[5], onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    // // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[6], onePageLimit) as fhirclient.JsonObject[]) as Observation[] )
    // // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[7], onePageLimit) as fhirclient.JsonObject[]) as Observation[] )
    //
    // // storer: issue1 - pull office BPs from 18 months ago
    // // storer: issue86 - adjust to 2-year lookback
    // const officeBPPath = 'Observation?code=http://loinc.org|85354-9&date=' + getGEDateParameter(twoYearsAgo)
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(officeBPPath, onePageLimit) as fhirclient.JsonObject[]) as Observation[])
    //
    // // storer: issue2 - pull home BPs from 18 months ago
    // // storer: issue86 - adjust to 2-year lookback
    // // One year of history for Home BP vitals, which are returned as separate systolic and diastolic Observation resources.
    // const homeBPPath = 'Observation?code=http://loinc.org|72076-3&date=' + getGEDateParameter(twoYearsAgo)
    // resources = resources.concat(resourcesFrom(await clientProxy.patientSearch(homeBPPath, onePageLimit) as fhirclient.JsonObject[]) as Observation[])

    resources = resources.filter(v => v !== undefined)
    const vitals = resources.filter((item: any) => item?.resourceType === 'Observation') as Observation[]
    recordProvenance(resources)

    return vitals
}

// storer: commenting this function out as it's never referenced
// /*
// * TODO: enhance this to verify current access token for SDS.
// */
// export const supplementalDataIsAvailable = (): Boolean => {
//   const authURL = process.env.REACT_APP_SHARED_DATA_AUTH_ENDPOINT
//   const sdsURL = process.env.REACT_APP_SHARED_DATA_ENDPOINT
//   const sdsScope = process.env.REACT_APP_SHARED_DATA_SCOPE
//
//   return authURL !== undefined && authURL?.length > 0
//     && sdsURL !== undefined && sdsURL?.length > 0
//     && sdsScope !== undefined && sdsScope?.length > 0
// }

export const getSupplementalDataClient = async (): Promise<Client | undefined> => {
    console.log('getSupplementalDataClient: Start');
    let sdsClient: Client | undefined
    const authURL = process.env.REACT_APP_SHARED_DATA_AUTH_ENDPOINT
    const sdsURL = process.env.REACT_APP_SHARED_DATA_ENDPOINT
    const sdsScope = 'patient/*.cruds patient/* user/*.cruds user/* goal/*.read questionnaireresponse/*.read '
    const sdsClientId = process.env.REACT_APP_SHARED_DATA_CLIENT_ID

    console.log('getSupplementalDataClient: authURL: ', authURL)
    console.log('getSupplementalDataClient: sdsURL: ', sdsURL)
    console.log('getSupplementalDataClient: sdsScope: ', sdsScope)
    console.log('getSupplementalDataClient: sdsClientId: ', sdsClientId)

    if (sdsClientId && sdsURL) {
        console.log('getSupplementalDataClient: if (sdsClientId && sdsURL) == true; authorize in using client id')
        const sdsState: fhirclient.ClientState | undefined = await getStateForEndpoint(sdsURL)
        if (sdsState) {
            sdsClient = FHIR.client(sdsState)
        }

    } else if (authURL && sdsURL && sdsScope) {
        console.log('getSupplementalDataClient else if (authURL && sdsURL && sdsScope) == true; authorize using existing token')

        const authState: fhirclient.ClientState | undefined =
            await getStateForEndpoint(authURL)

        if (authState) {
            console.log("getSupplementalDataClient: authState is defined")
            // Replace the serverURL and client scope with Shared Data endpoint and scope
            let sdsState = authState
            sdsState.serverUrl = sdsURL
            sdsState.scope = sdsScope
            if (sdsState.tokenResponse) {
                sdsState.tokenResponse.scope = sdsScope
            }
            // Connect to the client
            let sdsClient: Client | undefined = FHIR.client(sdsState)
            const linkages = await sdsClient.request('Linkage');
            if (sdsState.tokenResponse) {
                if (linkages.entry === undefined) {
                    console.log('getSupplementalDataClient: Create Patient:');
                    const patientResource = {
                        resourceType: 'Patient'
                    };
                    await sdsClient.create(patientResource).then(async (response) => {
                        console.log('getSupplementalDataClient: Patient resource created successfully:', response);
                        console.log('getSupplementalDataClient: start wait for patient create:');
                        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec
                        console.log('getSupplementalDataClient: end wait for patient create:');
                        const yy = await sdsClient?.request('Linkage');
                        console.log('getSupplementalDataClient: Patient resource created linkage :' + JSON.stringify(yy));
                        let patientReference = yy.entry[0].resource?.item[0].resource.reference
                        let identifier = patientReference.split("/")
                        if (sdsState) {
                            if (sdsState.tokenResponse) {
                                if (sdsState.tokenResponse.patient) {
                                    sdsState.tokenResponse.patient = identifier[1]
                                    sdsClient = FHIR.client(sdsState)
                                    return sdsClient
                                }
                            }
                        }
                    })
                        .catch((error) => {
                            console.error('getSupplementalDataClient Error creating Patient resource:', error);
                        });
                } else {
                    let patientReference = linkages.entry[0].resource?.item[0].resource.reference
                    let identifier = patientReference.split("/")
                    sdsState.tokenResponse.patient = identifier[1]
                    sdsClient = FHIR.client(sdsState)
                    return sdsClient
                }
            }
            console.log('getSupplementalDataClient: FHIR.client(sdsState) sdsClient = ', sdsClient)

        } else {
            console.error('getSupplementalDataClient: authState is currently null, cannot connect to client')
        }
    }

    // TODO: Consider check here if SDS is empty and return undefined if so.
    // Unfortunately, we wouldn't have the specificity of the error (which is why it wasn't done here), but,
    // The program will always know at the most root level that this SDS is not useful, which may be better.
    // This includes that knowledge in ProviderLogin w/o the additional logic it has now to determine that.

    return sdsClient
}

// storer: commenting out this function as it's never used
// // TODO: MULTI-PROVIDER: Call this with getFHIRData/remove duplicate code there. Or, have this be called first.
// // Due to the eventual merge of code, I have left in the majority of the dead code which will be live after the merge
// // That dead code is everything within authorizedAndInLocalStorage === true because we won't have it in local storage until after we call this
// export const createAndPersistClientForSavedOrNewProvider = async (authorizedAndInLocalStorage: boolean,
//   serverUrl: string | null): Promise<void> => {
//   console.log("createAndPersistClient()")
//
//   try {
//     let client: Client
//     if (authorizedAndInLocalStorage) {
//       console.log("Known to be authorized and previously stored in fhir-client-states-array, " +
//         "reconnecting to given, prior - authorized client, and reloading data")
//       if (serverUrl) {
//         console.log("endpoint is defined")
//         const matchedFhirAccessDataObject: fhirclient.ClientState | undefined =
//           await getStateForEndpoint(serverUrl)
//         if (matchedFhirAccessDataObject) {
//           console.log("matchedFhirAccessDataObject is defined, we should have a valid endpoint to pass to the client and reauthorize without redirect")
//           console.log("matchedFhirAccessDataObject", matchedFhirAccessDataObject)
//           // FHIR.client is passed fhirclient.ClientState from localForage which allows for fetching data w/o an external redirect since already authorized
//           // If for some reason we need an alternate impl to handle this, here are some options:
//           // 1: Using the API, if possible, use fetch after some connection is made (with object or endpoint), or use ready in similar manner
//           // 2: Store encrypted fhirData (actual patient data, hence encryption) in local storage and retrieve that
//           // 3: Bypass authentication using the fakeTokenResponse/access_token or an access token directly
//           // Note: Unfortunately, this is not an asynchronous operation
//           // !FUNCTION DIFF! Commented out the following line
//           // setAndLogProgressState("Connecting to FHIR client (for prior authorized client)", 5)
//           client = FHIR.client(matchedFhirAccessDataObject)
//           console.log('Executed: client = FHIR.client(matchedFhirAccessDataObject)')
//         } else {
//           throw new Error("A matching fhirAccessDataObject could not be found against the given endpoint, cannot connect to client or load FHIR data")
//         }
//       } else {
//         throw new Error("Given endpoint is null, cannot connect to client or load FHIR data")
//       }
//     } else { // prior/default
//       console.log("Not known to be authorized, but could be, either a launcher, app startup, or FHIR.oauth2.authorize was called due to expiration")
//       console.log('Starting default OAuth2 authentication')
//       // !FUNCTION DIFF! Commented out the following line
//       // setAndLogProgressState("Connecting to FHIR client", 10)
//       client = await FHIR.oauth2.ready();
//       console.log('Executed: client = await FHIR.oauth2.ready()')
//     }
//
//     // !FUNCTION DIFF! Commented out the following line
//     // setAndLogProgressState("Verifying connection data and state", 15)
//     if (!client) {
//       throw new Error("client is not defined, cannot connect to client or load FHIR data")
//     }
//
//     process.env.REACT_APP_TEST_PERSISTENCE === 'true' && console.log("client: ", JSON.stringify(client))
//
//     // We have a connected/populated client now, get the state/make use of the data
//     const clientState: fhirclient.ClientState = client?.state
//     if (clientState) {
//       await persistState(clientState)
//     } else {
//       console.log("Unable to persist data as no client?.state<fhirclient.ClientState> is available")
//     }
//
//   } catch (err) {
//     throw (err)
//   }
// }

export async function buildClientProxy(client: Client) : Promise<ClientProxy> {
    let proxyUrl: string | undefined = process.env.REACT_APP_FHIR_PROXY_URL;
    let launcherData: LauncherData | undefined = await getLauncherDataForState(client?.state);
    let useProxy: boolean = launcherData?.useProxy ?? false;

    let fhirQueryConfigMap: Map<String, FhirQueryConfig> | undefined = launcherData?.fhirQueryConfig;
    if (fhirQueryConfigMap === undefined) {
        const mapdata = JSON.parse(JSON.stringify(DefaultFhirQueryConfig).toString())
        fhirQueryConfigMap = new Map<String, FhirQueryConfig>(Object.entries(mapdata))
    }

    let clientProxy : ClientProxy = new ClientProxy(useProxy, fhirQueryConfigMap, proxyUrl, client);
    console.log("buildClientProxy: endpoint: " + client.state.serverUrl + ", useProxy: " + useProxy);
    return clientProxy;
}

export const createAndPersistClientForNewProvider = async (serverUrl: string | undefined): Promise<boolean> => {
    console.log("in createAndPersistClientForNewProvider()")

    try {
        let client: Client
        console.log('createAndPersistClientForNewProvider: Starting default OAuth2 authentication')
        // !FUNCTION DIFF! Commented out the following line
        // setAndLogProgressState("Connecting to FHIR client", 10)
        client = await FHIR.oauth2.ready()
        console.log('createAndPersistClientForNewProvider: Executed: client = await FHIR.oauth2.ready()')
        // !FUNCTION DIFF! Commented out the following line
        // setAndLogProgressState("Verifying connection data and state", 15)
        if (!client) {
            throw new Error("client is not defined, cannot connect to client or load FHIR data")
        }
        process.env.REACT_APP_DEBUG_LOG === 'true' && console.log("client: ", JSON.stringify(client))

        // We have a connected/populated client now, get and store the state, but don't load the data (FHIRData, CQL, etc.)
        const clientState: fhirclient.ClientState = client?.state
        if (clientState) {
            await persistStateAsCurrent(clientState)

        } else {
            console.error('createAndPersistClientForNewProvider: clientState is not defined')
        }
        return true

    } catch (err) {
        throw (err)
    }
}

export const getFHIRData = async (authorized: boolean, serverUrl: string | null, clientOverride: Client | null,
                                  setAndLogProgressState: (message: string, value: number) => void,
                                  setResourcesLoadedCountState: (count: number) => void,
                                  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
                                                               developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
    console.log('Enter getFHIRData()')

    try {
        if (process.env.REACT_APP_LOAD_MELD_ON_STARTUP === 'true') {
            // TODO: For testing, implement when time
            console.log('getFHIRData: Load Meld Sandbox automatically w/o a user-provided launcher and on startup')
            // { iss: process.env.REACT_APP_MELD_SANDBOX_ENDPOINT_ISS,
            //   redirectUri: "./index.html",
            //   clientId: process.env.REACT_APP_CLIENT_ID_meld_mcc,
            //   scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE }
        }

        let client: Client
        if (authorized) {
            console.log('getFHIRData: Known to be authorized, reconnecting to given, prior-authorized client, and reloading data')
            if (serverUrl) {
                console.log('getFHIRData: endpoint is defined')
                setAndLogProgressState("Connecting to FHIR client (for prior authorized client)", 5)
                if (!clientOverride) {
                    const matchedFhirAccessDataObject: fhirclient.ClientState | undefined =
                        await getStateForEndpoint(serverUrl)
                    if (matchedFhirAccessDataObject) {
                        console.log('getFHIRData: matchedFhirAccessDataObject is defined, we should have a valid endpoint to pass to the client and reauthorize without redirect')
                        console.log('getFHIRData: matchedFhirAccessDataObject', matchedFhirAccessDataObject)
                        // FHIR.client is passed fhirclient.ClientState from localForage which allows for fetching data w/o an external redirect since already authorized
                        // If for some reason we need an alternate impl to handle this, here are some options:
                        // 1: Using the API, if possible, use fetch after some connection is made (with object or endpoint), or use ready in similar manner
                        // 2: Store encrypted fhirData (actual patient data, hence encryption) in local storage and retrieve that
                        // 3: Bypass authentication using the fakeTokenResponse/access_token or an access token directly
                        // Note: Unfortunately, this is not an asynchronous operation
                        client = FHIR.client(matchedFhirAccessDataObject)
                        console.log('getFHIRData: Executed: client = FHIR.client(matchedFhirAccessDataObject)')
                    } else {
                        throw new Error("A matching fhirAccessDataObject could not be found against the given endpoint, cannot connect to client or load FHIR data")
                    }
                } else {
                    console.log('getFHIRData: Overriding client...')
                    client = clientOverride
                    console.log('getFHIRData: Overridden: client.state', client.state)
                    console.log('getFHIRData: Overridden: client.state.tokenResponse', client.state.tokenResponse)
                    console.log('getFHIRData: Overridden: client.state.tokenResponse.patient', client.state.tokenResponse?.patient)
                }
            } else {
                throw new Error("Given endpoint is null, cannot connect to client or load FHIR data")
            }
        } else { // prior/default
            console.log('getFHIRData: Not known to be authorized, but could be, either a launcher, app startup, or FHIR.oauth2.authorize was called due to expiration')
            console.log('getFHIRData: Starting default OAuth2 authentication')
            setAndLogProgressState("Connecting to FHIR client", 10)
            client = await FHIR.oauth2.ready()
            console.log('getFHIRData: Executed: client = await FHIR.oauth2.ready()')
        }

        setAndLogProgressState("Verifying connection data and state", 15)
        if (!client) {
            throw new Error("client is not defined, cannot connect to client or load FHIR data")
        }

        if (process.env.REACT_APP_DEBUG_LOG === 'true') {
            console.log('getFHIRData: client: ', client)
            console.log('getFHIRData: Client JSON: ', JSON.stringify(client))
            console.log('getFHIRData: client.state', client.state)
            console.log('getFHIRData: client.state.tokenResponse', client.state.tokenResponse)
            console.log('getFHIRData: client.state.tokenResponse.patient', client.state.tokenResponse?.patient)
        }

        // We have a connected/populated client now, get the state/make use of the data
        const clientState: fhirclient.ClientState = client?.state
        if (clientState) {
            await persistStateAsCurrent(clientState)
            if (!authorized && !serverUrl) {
                // Likely a launcher ***TODO: May need further identification***
                await persistStateAsLauncherData(clientState)
            }
        } else {
            console.log("getFHIRData: Unable to persist data as no client?.state<fhirclient.ClientState> is available")
        }

        const clientScope = client?.state.tokenResponse?.scope
        const serverURL = client?.state.serverUrl

        // const hostsThatDontSupportInclude = ['cerner.com', 'allscripts.com'];
        // const parsedUrl = new URL(serverURL);
        // const supportsInclude = !hostsThatDontSupportInclude.includes(parsedUrl.host);
        console.log('getFHIRData: Server URL: ' + serverURL)
        // console.log('getFHIRData: Supports _include: ' + supportsInclude)
        console.log('getFHIRData: clientScope: ' + clientScope)

        // return await getFHIRResources(client, clientScope, supportsInclude,
        //   setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)
        const getFHIRDataResult: FHIRData = await getFHIRResources(client, clientScope,
            setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)

        if (clientOverride) {
            getFHIRDataResult.isSDS = true
            getFHIRDataResult.serverName = "SDS"
        }

        return getFHIRDataResult

    } catch (err) {
        // setAndLogErrorMessageState('Terminating',
        //   process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT ? process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT : UNSET_MESSAGE,
        //   'Failure in getFHIRData either asynchronously resolving FHIR.oath2.ready() promise or synchronously creating a new client.', err)
        // Error is thrown so will be caught and set by the whatever calls this getFHIRData function instead of here which will allow for speceficity in the error.
        // It must be thorwn Since getFHIRData guarantees a promise of type FHIRData
        throw (err)
    }

}

const getFHIRResources = async (client: Client, clientScope: string | undefined,
                                setAndLogProgressState: (message: string, value: number) => void,
                                setResourcesLoadedCountState: (count: number) => void,
                                setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
                                                             developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
    /*
     *  Allscripts does not return patient, so also try user if patient is missing.
     */
    // const patient: Patient = await client.patient.read() as Patient
    // TODO: Analaysze/consider if we end up with persistence that can retain patient data for a longer period of time,
    // such as session storage, or a secure back end, or use or have a local storage endpoint with an active auth:
    // We could consider that if something is null, to grab from one of these locations (needs reauth required if local),
    // so it's not null, and can be populated in most cases
    setAndLogProgressState("Reading patient data", 20)

    let clientProxy: ClientProxy = await buildClientProxy(client)

    const patient: Patient = client.patient.id !== null
        ? await clientProxy.patientRead() as Patient
        : await clientProxy.userRead() as Patient
    console.log('getFHIRResources: Patient resource:', patient)

    let pcpPath = patient.generalPractitioner ? patient.generalPractitioner?.[0]?.reference : undefined
    // workaround for Allscripts bug
    pcpPath = pcpPath?.replace('R4/fhir', 'R4/open')
    // console.log('PCP path = ' + pcpPath)
    const patientPCP: Practitioner | undefined = pcpPath ? await clientProxy.read(pcpPath) : undefined;

    setAndLogProgressState("Reading User data", 30)
    const patientPath = 'Patient/' + client.getPatientId();
    const fhirUserPath = client.getFhirUser();
    const serverUrl = client.state.serverUrl;
    console.log('getFHIRResources: client.getFhirUser(): ', client.getFhirUser())

    let fhirUser: Practitioner | Patient | RelatedPerson | undefined
    try {
        fhirUser = fhirUserPath ? await clientProxy.read(fhirUserPath) : undefined
    } catch (error) {
        // console.error(error)
        // Assume this is SDS
    }

    console.log('getFHIRResources: fhirUser: ', fhirUser)
    const caregiverName: String | undefined =
        (patientPath === fhirUserPath) ? undefined : fhirUser?.name?.[0]?.text ?? fhirUser?.name?.[0]?.family


    let fhirQueries = {} // empty object for speed of development/testing purposes, remains empty if env var is false
    const getFhirQueriesEnvVar = process.env.REACT_APP_GET_FHIR_QUERIES
    console.log('getFHIRResources: process.env.REACT_APP_GET_FHIR_QUERIES', getFhirQueriesEnvVar)
    if (getFhirQueriesEnvVar === undefined || getFhirQueriesEnvVar === 'true') {
        // we allow undefined or true as we want the default to always be to load the queries
        setAndLogProgressState("Retrieving FHIR queries", 35)
        fhirQueries = await getFHIRQueries(clientProxy, clientScope, patientPCP,
            setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)
        console.log(fhirQueries);
    }

    return {
        serverUrl,
        isSDS: false,
        clientScope,
        fhirUser,
        caregiverName,
        patient,
        patientPCP,
        ...fhirQueries
    }
}

const getFHIRQueries = async (clientProxy: ClientProxy, clientScope: string | undefined,
                              patientPCP: Practitioner | undefined,
                              setAndLogProgressState: (message: string, value: number) => void,
                              setResourcesLoadedCountState: (count: number) => void,
                              setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
                                                           developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
    const timeLabel = 'FHIR queries for endpoint: ' + clientProxy.client.state.serverUrl
    console.time(timeLabel)
    console.log('executing FHIR queries for endpoint: ' + clientProxy.client.state.serverUrl)

    let resourcesLoadedCount: number = 0
    let curResourceName: string = "Unknown"

    let careTeamMembers = new Map<string, Practitioner>()
    let resourceRequesters = new Map<string, Practitioner>()

    if (patientPCP?.id !== undefined) {
        careTeamMembers.set(patientPCP?.id!, patientPCP!)
    }

    // Load FHIR Queries...
    // Note: Authentication form allows patient to un-select individual types from allowed scope

    const carePlans: CarePlan[] | undefined = await loadFHIRQuery<CarePlan>('Care Plan', 'CarePlan',
        "carePlan", true, clientProxy, clientScope, 40, setAndLogProgressState, setAndLogErrorMessageState)
    carePlans && setResourcesLoadedCountState(++resourcesLoadedCount)

    curResourceName = 'Care Team'
    let careTeams: CareTeam[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 45)
    try {
        // const _careTeamPath = supportsInclude ? careTeamPath_include : careTeamPath
        // let careTeamData: Resource[] | undefined = (hasScope(clientScope, 'CareTeam.read')
        //     ? resourcesFrom(await clientProxy.patientSearch(_careTeamPath, noPageLimit) as fhirclient.JsonObject[])
        //     : undefined)
        let careTeamData: Resource[] | undefined = (hasScope(clientScope, 'CareTeam.read')
            ? await clientProxy.patientSearchByKey("careTeam")
            : undefined)
        careTeams = careTeamData?.filter((item: any) => item.resourceType === 'CareTeam') as CareTeam[]
        const careTeamPractitioners =
            careTeamData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
        careTeamPractitioners?.forEach((pract: Practitioner) => {
            if (pract.id !== undefined && careTeamMembers.get(pract.id!) === undefined) {
                careTeamMembers.set(pract.id!, pract)
            }
        })
        recordProvenance(careTeamData)
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        careTeams && setResourcesLoadedCountState(++resourcesLoadedCount)
    }
    setAndLogProgressState('Found ' + (careTeams?.length ?? 0) + ' CareTeam resources.', 45)

    const goals: Goal[] | undefined = await loadFHIRQuery<Goal>('Goal', 'Goal',
        "goal", true, clientProxy, clientScope, 50, setAndLogProgressState, setAndLogErrorMessageState)
    goals && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (goals?.length ?? 0) + ' Goals.', 50)
    console.log('getFHIRQueries: Found ' + (goals?.length ?? 0) + ' Goals.')

    // storer: get Encounters for #5
    curResourceName = 'Encounter'
    let encounters: Encounter[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 55)
    try {
        encounters = (hasScope(clientScope, `${curResourceName}.read`)
            ? await getEncounters(clientProxy)
            : undefined)
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        encounters && setResourcesLoadedCountState(++resourcesLoadedCount)
    }
    setAndLogProgressState('Found ' + (encounters?.length ?? 0) + ' Encounters.', 55)

    curResourceName = 'Condition'
    let conditions: Condition[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 55)
    try {
        conditions = (hasScope(clientScope, `${curResourceName}.read`)
            ? await getConditions(clientProxy)
            : undefined)
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        conditions && setResourcesLoadedCountState(++resourcesLoadedCount)
    }
    setAndLogProgressState('Found ' + (conditions?.length ?? 0) + ' Conditions.', 55)

    curResourceName = 'Procedure'
    let procedures: Procedure[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 60)
    try {
        // let procedureData: Resource[] | undefined = (hasScope(clientScope, `${curResourceName}.read`)
        //     ? resourcesFrom(await clientProxy.patientSearch(proceduresTimePath, noPageLimit) as fhirclient.JsonObject[])
        //     : undefined)
        let procedureData: Resource[] | undefined = (hasScope(clientScope, `${curResourceName}.read`)
            ? await clientProxy.patientSearchByKey("proceduresTime")
            : undefined)
        // if no procedures found in past 3 years, get _count=100
        if (procedureData === undefined || procedureData.entries?.length === 0) {
            // procedureData = (hasScope(clientScope, `${curResourceName}.read`)
            //     ? resourcesFrom(await clientProxy.patientSearch(proceduresCountPath, onePageLimit) as fhirclient.JsonObject[])
            //     : undefined)
            procedureData = (hasScope(clientScope, `${curResourceName}.read`)
                ? await clientProxy.patientSearchByKey("proceduresCount")
                : undefined)
        }
        procedures = procedureData?.filter((item: any) => item.resourceType === curResourceName) as Procedure[]
        recordProvenance(procedureData)
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        procedures && setResourcesLoadedCountState(++resourcesLoadedCount)
    }
    setAndLogProgressState('Found ' + (procedures?.length ?? 0) + ' Procedures.', 60)

    const diagnosticReports: DiagnosticReport[] | undefined = await loadFHIRQuery<DiagnosticReport>('Diagnostic Reports', 'DiagnosticReport',
        "diagnosticReport", true, clientProxy, clientScope, 65, setAndLogProgressState, setAndLogErrorMessageState)
    diagnosticReports && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (diagnosticReports?.length ?? 0) + ' Diagnostic Reports.', 65)

    const immunizations: Immunization[] | undefined = await loadFHIRQuery<Immunization>('Immunizations', 'Immunization',
        "immunization", true, clientProxy, clientScope, 70, setAndLogProgressState, setAndLogErrorMessageState)
    immunizations && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (immunizations?.length ?? 0) + ' Immunizations.', 70)

    const standardLabResults: Observation[] | undefined = await loadFHIRQuery<Observation>('Lab Results', 'Observation',
        "labResults", true, clientProxy, clientScope, 75, setAndLogProgressState, setAndLogErrorMessageState)

    // issue 61
    const eGFRExtraLabResults: Observation[] | undefined = await loadFHIRQuery<Observation>('eGFR Extra Lab Results', 'Observation',
        "egfrExtraLabResults", true, clientProxy, clientScope, 75, setAndLogProgressState, setAndLogErrorMessageState)

    let labResults: Observation[] | undefined;
    if (standardLabResults !== undefined && eGFRExtraLabResults === undefined) {
        labResults = standardLabResults;
    } else if (standardLabResults === undefined && eGFRExtraLabResults !== undefined) {
        labResults = eGFRExtraLabResults;
    } else if (standardLabResults !== undefined && eGFRExtraLabResults !== undefined) {
        labResults = standardLabResults.concat(eGFRExtraLabResults);
    } else {
        labResults = undefined;
    }

    labResults && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (labResults?.length ?? 0) + ' lab results.', 75)

    // Retrieve MedicationRequest and included requester Practitioner resources.
    curResourceName = 'Medication Request'
    let medications: MedicationRequest[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 80)
    try {
        if (hasScope(clientScope, 'MedicationRequest.read')) {
            // fetch all active meds
            // const _medicationRequestActivePath = medicationRequestActivePath + (supportsInclude ? medicationRequesterInclude : '')
            // let medicationRequestData: Resource[] | undefined =
            //     resourcesFrom(await clientProxy.patientSearch(_medicationRequestActivePath, noPageLimit) as fhirclient.JsonObject[])
            let medicationRequestData: Resource[] | undefined =
                await clientProxy.patientSearchByKey("medicationRequestActive")
            const medPractitioners =
                medicationRequestData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
            medPractitioners?.forEach((pract: Practitioner) => {
                if (pract.id !== undefined && resourceRequesters.get(pract.id!) === undefined) {
                    resourceRequesters.set(pract.id!, pract)
                }
            })

            setAndLogProgressState('Found ' + (medicationRequestData?.length ?? 0) + ' active medication requests.', 81)
            // medicationRequestData && setResourcesLoadedCountState(++resourcesLoadedCount)

            // also fetch the last 10 inactive meds
            // let inactiveMeds = resourcesFrom(await clientProxy.patientSearch(medicationRequestInactivePath, onePageLimit) as fhirclient.JsonObject[])
            let inactiveMeds = await clientProxy.patientSearchByKey("medicationRequestInactive")
            // remove any inactive meds also in the active list (VA does not support the status parameter)
            setAndLogProgressState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (before filtering).', 82)
            inactiveMeds = inactiveMeds?.filter((item: any) => medicationRequestData?.find((resource: Resource) => resource.id === item.id) === undefined)
            // inactiveMeds && setResourcesLoadedCountState(++resourcesLoadedCount)

            setAndLogProgressState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (after removing duplicates).', 83)
            medicationRequestData = (medicationRequestData ?? []).concat(inactiveMeds ?? [])

            medications = medicationRequestData?.filter((item: any) => item.resourceType === 'MedicationRequest') as MedicationRequest[]
            recordProvenance(medicationRequestData)
        } else {
            medications = undefined
        }
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        medications && setResourcesLoadedCountState(++resourcesLoadedCount)
    }

    // const serviceRequests: ServiceRequest[] | undefined = await loadFHIRQuery<ServiceRequest>('ServiceRequest', 'ServiceRequest',
    //   _serviceRequestPath, true, client, clientScope, 85, setAndLogProgressState, setAndLogErrorMessageState)
    // serviceRequests && setResourcesLoadedCountState(++resourcesLoadedCount)
    // setAndLogProgressState('Found ' + (serviceRequests?.length ?? 0) + ' ServiceRequests.', 85)

    // Retrieve ServiceRequest and included requester Practitioner resources.
    curResourceName = 'Service Request'
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 85)
    let serviceRequests: ServiceRequest[] | undefined
    try {
        if (hasScope(clientScope, 'ServiceRequest.read')) {
            // const _serviceRequestPath = serviceRequestPath + (supportsInclude ? serviceRequesterInclude : '')
            // let serviceRequestData: Resource[] | undefined =
            //     resourcesFrom(await clientProxy.patientSearch(_serviceRequestPath, noPageLimit) as fhirclient.JsonObject[])
            let serviceRequestData: Resource[] | undefined =
                await clientProxy.patientSearchByKey("serviceRequest")
            serviceRequests = serviceRequestData?.filter((item: any) => item.resourceType === 'ServiceRequest') as ServiceRequest[]
            recordProvenance(serviceRequestData)
            const serviceRequestPractitioners =
                serviceRequestData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
            serviceRequestPractitioners?.forEach((pract: Practitioner) => {
                if (pract.id !== undefined && resourceRequesters.get(pract.id!) === undefined) {
                    resourceRequesters.set(pract.id!, pract)
                }
            })
            setAndLogProgressState('Found ' + (serviceRequests?.length ?? 0) + ' Service Requests.', 85)
        } else {
            serviceRequests = undefined
        }
    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
    } finally {
        serviceRequests && setResourcesLoadedCountState(++resourcesLoadedCount)
    }

    const socialHistory: Observation[] | undefined = await loadFHIRQuery<Observation>('Social History', 'Observation',
        "socialHistory", true, clientProxy, clientScope, 90, setAndLogProgressState, setAndLogErrorMessageState)
    socialHistory && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (socialHistory?.length ?? 0) + ' Social History observations.', 90)

    // Commented out because survey is not supported by any EHRs at this time, and throws error in app for Cerner.
    // const surveyResults: Observation[] | undefined = await loadFHIRQuery<Observation>('Obs Survey', 'Observation',
    //   surveyResultsPath, true, client, clientScope, 93, setAndLogProgressState, setAndLogErrorMessageState)
    // surveyResults && setResourcesLoadedCountState(++resourcesLoadedCount)
    const surveyResults = undefined // required if we decide not to use the above code

    curResourceName = 'Vitals'
    let vitalSigns: Observation[] | undefined
    setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 95)
    try {
        vitalSigns = (hasScope(clientScope, 'Observation.read')
            ? await getVitalSigns(clientProxy)
            : undefined)
        setAndLogProgressState('Found ' + (vitalSigns?.length ?? 0) + ' vital signs.', 96)

    } catch (err) {
        await setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)

    } finally {
        vitalSigns && setResourcesLoadedCountState(++resourcesLoadedCount)
    }

    let questionnaireResponses: QuestionnaireResponse[] | undefined = await loadFHIRQuery<QuestionnaireResponse>('Questionnaire Responses', 'QuestionnaireResponse',
        "questionnaireResponse", true, clientProxy, clientScope, 98, setAndLogProgressState, setAndLogErrorMessageState)
    questionnaireResponses && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (questionnaireResponses?.length ?? 0) + ' Questionnaire Responses.', 98)
    console.log('getFHIRQueries: Found ' + (questionnaireResponses?.length ?? 0) + ' Questionnaire Responses.')

    const surveyObservations: Observation[] | undefined = await loadFHIRQuery<Observation>('Survey Observations', 'Observation',
        "surveyObservations", true, clientProxy, clientScope, 99, setAndLogProgressState, setAndLogErrorMessageState)
    surveyObservations && setResourcesLoadedCountState(++resourcesLoadedCount)
    setAndLogProgressState('Found ' + (surveyObservations?.length ?? 0) + ' Survey Observations.', 99)
    console.log('getFHIRQueries: Found ' + (surveyObservations?.length ?? 0) + ' Survey Observations.')
    const questionnaireBundles: QuestionnaireBundle[] = await buildQuestionnaireBundles(questionnaireResponses || [], surveyObservations || []);

    setAndLogProgressState('All FHIR requests finished: ' + new Date().toLocaleTimeString(), 100)
    console.timeEnd(timeLabel)

    console.log("Provenance resources: " + (provenance?.length ?? 0))
    // provenance?.forEach((resource) => {
    //   console.log(JSON.stringify(resource))
    // })

    // console.log("Provenance dictionary values: " + provenanceMap?.size ?? 0)
    // provenanceMap?.forEach((provenanceList, refId) => {
    //   console.log("Provenance for: " + refId)
    //   console.log(JSON.stringify(provenanceList))
    // })

    // console.log("FHIRData Patient: " + JSON.stringify(patient))
    // console.log("FHIRData social history: ")
    // socialHistory?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })
    // console.log("FHIRData goals: ")
    // goals?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })
    // console.log("FHIRData Service Request: ")
    // serviceRequests?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })
    // console.log("FHIRData Immunization: ")
    // immunizations?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })

    // console.log("LabResults Bundle: ")
    // console.log(JSON.stringify(await client.patient.request(labResultsPath, fhirOptions)))

    // console.log("FHIRData CarePlan: ")
    // carePlans?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })

    // console.log("FHIRData MedicationRequest: ")
    // medications?.forEach(function (resource) {
    //   console.log(JSON.stringify(resource))
    // })

    /*
    console.log("FHIRData CareTeam: ")
    careTeams?.forEach(function (resource) {
      console.log(JSON.stringify(resource))
    })

    console.log("FHIRData CareTeam practitioners: ")
    careTeamPractitioners?.forEach(function (resource) {
      console.log(JSON.stringify(resource))
    })

    console.log("CareTeam member dictionary values: " + careTeamMembers?.size ?? 0)
    careTeamMembers?.forEach((practitioner, id) =>
      console.log(JSON.stringify(practitioner))
    )
    */

    console.log("Resource requesters dictionary values: " + resourceRequesters.size)
    // resourceRequesters?.forEach((practitioner, id) =>
    //   console.log(JSON.stringify(practitioner))
    // )

    // Reset progress as sometimes React isn't fast enough on next load
    setAndLogProgressState('', 0)
    setResourcesLoadedCountState(0)

    return {
        isSDS: false,
        carePlans,
        careTeams,
        careTeamMembers,
        resourceRequesters,
        encounters,
        conditions,
        diagnosticReports,
        goals,
        immunizations,
        medications,
        serviceRequests,
        labResults,
        procedures,
        vitalSigns,
        socialHistory,
        surveyResults,
        provenanceMap,
        provenance,
        questionnaireBundles,
    }
}

const loadFHIRQuery = async <T extends Resource>(
    resourceCommonName: string, resourceSrcCodeName: string, resourceKey: string,
    isRecordProvenance: boolean, clientProxy: ClientProxy, clientScope: string | undefined, progressValue: number,
    setAndLogProgressState: (message: string, value: number) => void,
    setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
                                 developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<T[] | undefined> => {

    let resourceData: Resource[] | undefined
    let resources: T[] | undefined

    setAndLogProgressState(`${resourceCommonName} request: ` + new Date().toLocaleTimeString(), progressValue)

    try {
        // resourceData = (hasScope(clientScope, `${resourceSrcCodeName}.read`)
        //     ? resourcesFrom(await clientProxy.patientSearch(resourcePath, noPageLimit) as fhirclient.JsonObject[])
        //     : undefined)
        resourceData = (hasScope(clientScope, `${resourceSrcCodeName}.read`)
            ? await clientProxy.patientSearchByKey(resourceKey)
            : undefined)
        resources = resourceData?.filter((item: any) => item.resourceType === resourceSrcCodeName) as T[]
        console.log("loadFHIRQuery: resources:", resources)
        isRecordProvenance && recordProvenance(resourceData)

    } catch (err) {
        console.log("caught " + err + " loading " + resourceCommonName)
        await setAndLogNonTerminatingErrorMessageStateForResource(resourceCommonName, err, setAndLogErrorMessageState)
    }

    return resources
}

const setAndLogNonTerminatingErrorMessageStateForResource = async (
    resourceName: string, errorCaught: Error | string | unknown,
    setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
                                 developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<void> => {

    const message: string = process.env.REACT_APP_NT_USER_ERROR_MESSAGE_FAILED_RESOURCE ?
        process.env.REACT_APP_NT_USER_ERROR_MESSAGE_FAILED_RESOURCE : 'None: Environment variable for message not set.'

    setAndLogErrorMessageState('Non-terminating', message.replaceAll('<RESOURCE_NAME>', resourceName),
        `Failure in getFHIRData retrieving ${resourceName} data.`, errorCaught)
}

export function createSharedDataResource(resource: Resource) {
    return getSupplementalDataClient()
        .then((client: Client | undefined) => {
            // console.log('SDS client: ' + JSON.stringify(client))
            return client?.create(resource as fhirclient.FHIR.Resource)
        })
        .catch(error => {
            console.error('Cannot create shared data resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
            return undefined
        })
}

export async function updateSharedDataResource(component:React.Component, client: Client | undefined, resource: Resource, serverUrl?: string,
                                               callback?: (c:React.Component, isSuccess:boolean) => any) {
    try {
        const fhirOptions = {
            'includeResponse': true
        } as fhirclient.RequestOptions;

        if (serverUrl) {
            const fhirHeaders = {
                'X-Partition-Name': serverUrl
            };
            fhirOptions.headers = fhirHeaders;
        }

        const maxAttempts = 10;
        const waitMS = 1000;
        let success: boolean = false;
        for (let i = 1; i <= maxAttempts; i ++) {
            try {
                if (i >= 2) {
                    console.info("Re-attempting post of resource: " + resource.id + " (attempt " + i + " of " + maxAttempts + ") -")
                }

                let rval: any = await client?.update(resource as fhirclient.FHIR.Resource, fhirOptions)

                success = rval.response.status >= 200 && rval.response.status < 300;
                if ( ! success ) {
                    console.error("Error posting resource: " + resource.id + " (status: " + rval.response.status + ")")
                }

            } catch (err) {
                console.error("Error posting resource: " + resource.id + " - " + JSON.stringify(err))
                success = false;
            }

            if (success) {
                break;
            }
        }

        if ( ! success ) {
            console.error("Failed to post resource: " + resource.id)
        }

        if (callback) callback(component, success);

    } catch (err) {
        console.error("Error updating shared data resource: " + JSON.stringify(err))
        if (callback) callback(component, false);
        return undefined
    }
}

// storer: commenting out this function as it's never referenced
// export async function getSharedGoals(): Promise<Goal[]> {
//   console.log("getSharedGoals()")
//   let resources: Resource[] = []
//   let client = await getSupplementalDataClient()
//   // console.log("Patient.id = " + client?.patient.id)
//   await client?.patient.read()
//   try {
//     resources = resources.concat(resourcesFrom(await client?.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject[]))
//   } catch (err) {
//     console.log("Error reading shared Goals: " + JSON.stringify(err))
//   }
//
//   let goals = resources.filter((item: any) => item?.resourceType === 'Goal') as Goal[]
//   console.log("getSharedGoals() Goals:")
//   goals?.forEach(function (resource) {
//     console.log(JSON.stringify(resource))
//   })
//
//   return goals
// }


// function delay(arg0: number) {
//   throw new Error('Function not implemented.')
// }

