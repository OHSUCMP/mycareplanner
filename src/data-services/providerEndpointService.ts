import { fhirclient } from 'fhirclient/lib/types'
import Providers from './endpoints/providers.json'

export class FhirQueryConfig {
  path: []
  fhirOptions?: fhirclient.FhirOptions

  constructor(path: [], fhirOptions: fhirclient.FhirOptions) {
    this.path = path
    this.fhirOptions = fhirOptions
  }
}

export class LauncherData {
  name: string
  useProxy?: boolean
  fhirQueryConfig?: Map<String, FhirQueryConfig>
  config?: fhirclient.AuthorizeParams
  patientId?: string | null
  userId?: string | null

  constructor(name: string,
              useProxy: boolean,
              fhirQueryConfig: Map<String, FhirQueryConfig>,
              config?: fhirclient.AuthorizeParams) {
    this.name = name
    this.useProxy = useProxy
    this.fhirQueryConfig = fhirQueryConfig
    this.config = config
  }
}

export const buildLauncherDataArray = (): LauncherData[] => {
  console.log("in buildLauncherDataArray()")
  let launcherDataArray: LauncherData[] = []

  // Providers (providers.json) contains launcher data sourced from providers.json,
  // available to be overridden by host filesystem
  let jsonArray = JSON.parse(JSON.stringify(Providers).toString())
  const providers: LauncherData[] = jsonArray.map((item: any) => {
    const fhirQueryConfig: Map<String, FhirQueryConfig> | undefined = item.fhirQueryConfig ?
        new Map<String, FhirQueryConfig>(Object.entries(item.fhirQueryConfig)) :
        undefined;
    return {
      name: item.name,
      useProxy: item.useProxy,
      fhirQueryConfig: fhirQueryConfig,
      config: item.config
    }
  })
  launcherDataArray = launcherDataArray.concat(providers);

  // add SDS to array if so configured
  console.log('buildLauncherDataArray: process.env.REACT_APP_SHARED_DATA_CLIENT_ID: ', process.env.REACT_APP_SHARED_DATA_CLIENT_ID)
  console.log('buildLauncherDataArray: process.env.REACT_APP_SHARED_DATA_ENDPOINT: ', process.env.REACT_APP_SHARED_DATA_ENDPOINT)
  console.log('buildLauncherDataArray: process.env.REACT_APP_SHARED_DATA_SCOPE: ', process.env.REACT_APP_SHARED_DATA_SCOPE)

  // todo : something screwy is going on in here.  there are two blocks of code below, both of which have identical
  //        criteria.  the first adds the SDS with a client ID if it exists.  the second appears to be intended to add
  //        the SDS without a client ID, but the "if" check enclosing that logic requires client ID to be set (just
  //        like the first block).
  //        neither block is getting called in POC, because we have no client ID associated, and so the SDS is never
  //        added.  however, in POC, we still have access to the SDS, so maybe these blocks are vestigial?

  if (process.env.REACT_APP_SHARED_DATA_CLIENT_ID
    && process.env.REACT_APP_SHARED_DATA_ENDPOINT && process.env.REACT_APP_SHARED_DATA_SCOPE) {
    console.log('buildLauncherDataArray: Adding SDS with clientId to launcherDataArray')
     launcherDataArray = launcherDataArray.concat(
      {
        "name": "SDS: eCare Shared Data",
        // "useProxy": false,
        "config": {
          "iss": process.env.REACT_APP_SHARED_DATA_ENDPOINT,
          "redirectUri": "./index.html",
          "clientId": process.env.REACT_APP_SHARED_DATA_CLIENT_ID,
          "scope": process.env.REACT_APP_SHARED_DATA_SCOPE
        }
      }
    )
    console.log('buildLauncherDataArray: after concat: ', launcherDataArray)

  } else {
    console.warn('buildLauncherDataArray: Not adding SDS to the availableEndpoints with clientId as at least ' +
        'one of the following env vars are not defined: process.env.REACT_APP_SHARED_DATA_CLIENT_ID, ' +
        'process.env.REACT_APP_SHARED_DATA_ENDPOINT, or process.env.REACT_APP_SHARED_DATA_SCOPE). ' +
        'Note: We may still add the SDS without a clientId, though.')
  }

  if (process.env.REACT_APP_SHARED_DATA_ENDPOINT && process.env.REACT_APP_SHARED_DATA_SCOPE
    && process.env.REACT_APP_SHARED_DATA_CLIENT_ID) {
    console.log("buildLauncherDataArray: Adding SDS without clientId to availableEndpoints")
    launcherDataArray = launcherDataArray.concat(
      {
        "name": "SDS: eCare Shared Data",
        // "useProxy": false,
        "config": {
          "iss": process.env.REACT_APP_SHARED_DATA_ENDPOINT,
          "redirectUri": "./index.html",
          "clientId": "",
          "scope": process.env.REACT_APP_SHARED_DATA_SCOPE
        }
      }
    )
    console.log("buildLauncherDataArray: after concat: ", launcherDataArray)
  }

  // TODO: Visually remove SDS from dropdown list (but leave it in programmatically)
  // The SDS cannot be a launcher, however, the endpoint NEEDS to be added for the application logic to work.
  // Because, when one leaves the application to authorize, these endpoints are saved to local storage (temporarily),
  // and referenced in the logic in that scenario to know what to load on a fresh application launch.

  return launcherDataArray
}

// Given a pre-populated ProivderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a string[] of endpoint names,
// returns a ProviderEndpoint[] populated with the full matching data
export const getMatchingProviderEndpointsFromName = async (availableEndpoints: LauncherData[],
                                                           selectedEndpointNames: string[]): Promise<LauncherData[]> => {
  return availableEndpoints.filter(availableEndpoint => {
    console.log('availableEndpoint.name: ', availableEndpoint?.name)
    return selectedEndpointNames.includes(availableEndpoint?.name)
  })
}

// Given a pre-populated ProivderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a string[] of endpoint urls,
// returns a ProviderEndpoint[] populated with the full matching data
// NOTE: If more than one availableEndpoint has the same URL, then we have a problem
// In that case, we can either save the names instead, and use the getMatchingProviderEndpointsFromName function,
// Or, just save a ProviderEndpoint[] directly to selectedEndpoints instead and avoid the conversion
export const getLauncherDataArrayForEndpoints = async (availableLauncherDataArray: LauncherData[],
                                                       endpointArray: string[]): Promise<LauncherData[]> => {
  return availableLauncherDataArray.filter(launcherData => {
    const url = launcherData.config?.iss
    if (url) {
      console.log('launcherData.config?.iss (url): ', url)
      return endpointArray.includes(url)
    }
    return false
  })
}

// Given a pre-populated ProviderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a fhirclient.ClientState,
// returns a ProviderEndpoint populated with the full matching data
export const getLauncherDataForState = async (state: fhirclient.ClientState): Promise<LauncherData | undefined> => {
  let launcherDataArray: LauncherData[] = buildLauncherDataArray();

  if (state) {
    const iss: string = state?.serverUrl
    // TODO: consider beefing up the security of this by checking for another matching prop as well: clientId
    // const clientId: string | undefined = clientState?.clientId
    if (iss) {
      // todo : clean this up
      const matchingLauncherData = launcherDataArray.find(endpoint => {
        const endpointIss = endpoint.config?.iss
        if (endpointIss) {
          console.log('getLauncherDataForState: checking endpointIss=', endpointIss)
          return iss === endpointIss
        }
        return undefined
      })
      console.log('getLauncherDataForState: matchingLauncherData=', matchingLauncherData)
      return matchingLauncherData
    }
  }
}

export const providerEndpointExistsWithName = (endpointToFind: LauncherData,
                                               endpointsToSearch: LauncherData[]): boolean => {
  return endpointsToSearch.some(endpoint => {
    console.log("endpoint?.name", endpoint?.name)
    console.log("endpointToFind?.name", endpointToFind?.name)
    return endpoint?.name === endpointToFind?.name
  })
}
