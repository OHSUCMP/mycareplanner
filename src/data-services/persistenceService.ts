import localForage from 'localforage'
import { fhirclient } from 'fhirclient/lib/types'
import {
  LauncherData, getLauncherDataForState
} from './providerEndpointService'

// It's best practice to use a suffix to ensure a unique key so we don't load data for another website
const LF_ID = '-MCP'
const FC_CURRENT_STATE_KEY = 'fhir-client-state' + LF_ID
const FC_ALL_STATES_KEY = 'fhir-client-states-array' + LF_ID
const SELECTED_ENDPOINTS_KEY = 'selected-endpoints' + LF_ID
const LAUNCHER_DATA_KEY = 'launcher-data' + LF_ID
// TODO: Sravan to set this up/add function for saving it, testing it, and possibly delete (if clear is not enough)
const SESSION_ID_KEY = 'session-id' + LF_ID

// FHIR ACCESS DATA //

const saveState = async (key: string, data: any, isArray: boolean): Promise<any> => {
  if (data) {
    if ( ! isArray ) {
      // expiresAt is vital, without that, it means we didn't actually log in
      // e.g.back button pressed or window closed during process
      // The data we get back in the above case is not useful so there is no reason to overwrite
      // endpoint and clientId are vital as they are used for object identification in the array
      // as well as recalling the data itself, reconnecting, and reauthorizing
      if (data.expiresAt && data.serverUrl && data.clientId) {
        console.log(`Object: localForage.setItem(key: ${key}, data: <see next line>`, data)
        return await localForage.setItem(key, data as fhirclient.ClientState)

      } else {
        console.log('saveState: Ignore previous logs, NOT updating data in local storage - Data is missing data.expiresAt || data.endpoint || data.clientId')
      }

    } else {
      // We don't need to check contents of array before saving here
      // as we know it was checked before saving currentLocalFhirClientState (the object) (see connected if block)
      // If this were a back button situation, it will overwrite with the correct object
      // Not the invalid new one, as the invalid new one won't exist in our persisted state to copy from
      console.log(`Array: localForage.setItem(key: ${key}, data: <see next line>`, data as Array<fhirclient.ClientState>)
      return await localForage.setItem(key, data)
    }
  }
}

const dataExistsInLocalForage = async (key: string): Promise<boolean> => {
  try {
    const data: any = await localForage.getItem(key)
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (data !== null) {
      console.log('dataExistsInLocalForage: found data for key: ' + key)
      return true

    } else {
      console.log('dataExistsInLocalForage: did not find data for key: ' + key)
      return false
    }

  } catch (e) {
    console.log(`dataExistsInLocalForage: caught exception processing key '${key}': ${e}`)
    return false
  }
}

export const getDataFromLocalForageIfExists = async (key: string): Promise<any> => {
  try {
    const isData: boolean = await dataExistsInLocalForage(key)
    if (isData) {
      return await localForage.getItem(key)
    }
  } catch (e) {
    console.error(`getDataFromLocalForageIfExists: caught exception processing key '${key}' : ${e}`)
  }
}

// storer: commenting out this function as it isn't called from anywhere
// // Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
// export const deleteCurrentLocalFHIRAccessData = async (): Promise<void> => {
//   try {
//     const fhirAccessData = await getDataFromLocalForageIfExists(FC_CURRENT_STATE_KEY) as fhirclient.ClientState
//     if (fhirAccessData) {
//       await localForage.removeItem(FC_CURRENT_STATE_KEY)
//       console.log("deleteCurrentLocalFHIRAccessData: Deleted currentLocalFhirClientState")
//     } else {
//       console.log("deleteCurrentLocalFHIRAccessData: currentLocalFhirClientState does not exist so there is no need to delete it")
//     }
//   } catch (e) {
//     console.error("deleteCurrentLocalFHIRAccessData: Failure deleting currentLocalFhirClientState: " + e)
//   }
// }

// storer: commenting out this function as it isn't called from anywhere
// // Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
// export const deleteArrayOfFhirAccessDataObjects = async (): Promise<void> => {
//   try {
//     const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
//       await getDataFromLocalForageIfExists(FC_ALL_STATES_KEY) as Array<fhirclient.ClientState>
//     if (arrayOfFhirAccessDataObjects) {
//       await localForage.removeItem(FC_ALL_STATES_KEY)
//       console.log("Deleted arrayOfFhirAccessDataObjects")
//     } else {
//       console.log("arrayOfFhirAccessDataObjects does not exist so there is no need to delete it")
//     }
//   } catch (e) {
//     console.error("Failure deleting arrayOfFhirAccessDataObjects: " + e)
//   }
// }

export const isStateValid = async (state: fhirclient.ClientState): Promise<boolean> => {
  // TODO: Create getter function for expiresAt and use that here
  console.log('in isStateValid()')
  // Example: "expiresAt": 1666288471
  if (state) {
    const expiresAt = state?.expiresAt
    if (expiresAt) {
      console.log('isStateValid: expiresAt:', expiresAt)
      const curEpoch = Math.trunc(Date.now() / 1000)
      console.log('isStateValid: curEpoch:', curEpoch)
      const isValid = curEpoch < expiresAt
      console.log(isValid
        ? 'isStateValid: return true as token is still valid'
        : 'isStateValid: return false as token is expired')
      return isValid
    }
  }
  console.log('isStateValid: return false by default')
  return false
}

// storer: commenting out as this function is never used
// export const matchesCurrentEndpoint = async (endpoint: string): Promise<boolean> => {
//   // TODO: Create getter function for FC_CURRENT_STATE_KEY endpoint and use that here
//   console.log('matchesCurrentEndpoint: checking ', endpoint)
//   const currentState = await getDataFromLocalForageIfExists(FC_CURRENT_STATE_KEY) as fhirclient.ClientState
//   if (currentState) {
//     const currentEndpoint = currentState.serverUrl
//     if (currentEndpoint) {
//       console.log('matchesCurrentEndpoint: currentEndpoint=', currentEndpoint)
//       if (endpoint === currentEndpoint) {
//         console.log("matchesCurrentEndpoint: match")
//         return true
//       }
//     }
//   }
//   console.log("matchesCurrentEndpoint: does NOT match")
//   return false
// }

export const isEndpointStillAuthorized = async (endpoint: string): Promise<boolean> => {
  console.log('isEndpointStillAuthorized: checking ', endpoint)

  // The logic works with extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint either way
  // but extractFhirAccessDataObjectFromLastActiveEndpoint is more efficient when relevant
  const state = await getStateForEndpoint(endpoint) as fhirclient.ClientState

  console.log("isEndpointStillAuthorized: got state=", JSON.stringify(state))

  if (state) {
    console.log('isEndpointStillAuthorized: Check if saved token for the relevant endpoint is still valid')
    let valid: boolean = await isStateValid(state)
    console.log('isStateStillAuthorized: valid=', valid)
    return valid

  } else {
    console.log('isStateStillAuthorized: no state found, returning false')
    return false
  }
}

// storer: commenting this out as it's not called from anywhere
// const getCurrentState = async (): Promise<fhirclient.ClientState | null> => {
//   // TODO: Create getter function for FC_CURRENT_STATE_KEY endpoint and use that here
//   console.log('getCurrentState: retrieving')
//
//   const currentState = await getDataFromLocalForageIfExists(FC_CURRENT_STATE_KEY) as fhirclient.ClientState
//   if (currentState) {
//     console.log('getCurrentState: found')
//     return currentState
//
//   } else {
//     console.log('getCurrentState: NOT found')
//     return null
//   }
// }

export const getStateForEndpoint = async (endpoint: string): Promise<fhirclient.ClientState | undefined> => {
    // TODO: Create getter function for FC_CURRENT_STATE_KEY endpoint and use that here
    console.log('getStateForEndpoint: retrieving for ', endpoint)

    const savedStates: Array<fhirclient.ClientState> = await getDataFromLocalForageIfExists(FC_ALL_STATES_KEY) as Array<fhirclient.ClientState>
    console.log('getStateForEndpoint: savedStates=', JSON.stringify(savedStates))

    if (savedStates) {
      console.log('getStateForEndpoint: savedStates is defined')
      return savedStates.find((state: fhirclient.ClientState) => {
        console.log('getStateForEndpoint: inside savedStates.find(state) function')
        const savedEndpoint = state?.serverUrl
        console.log('getStateForEndpoint: savedEndpoint:', savedEndpoint)
        return endpoint === savedEndpoint
      })
    }
  }

export const persistStateAsCurrent = async (state: fhirclient.ClientState) => {
  // Holds the currently active state object in localForage
  await saveState(FC_CURRENT_STATE_KEY, state, false).then(() => {
    console.log('persistState: state saved as current; promise returned')
  }).catch((e) => console.log(e))

  // test persisted data recovery for currentLocalFhirClientState
  const currentState = await getDataFromLocalForageIfExists(FC_CURRENT_STATE_KEY) as fhirclient.ClientState
  console.log('persistState: currentState=', currentState)

  // holds an array of state objects previously accessed in localForage
  const allStatesArrayExists: boolean = await dataExistsInLocalForage(FC_ALL_STATES_KEY)
  console.log('persistState: allStatesArrayExists=', allStatesArrayExists)

  if (allStatesArrayExists) {
    console.log("persistState: all-states array exists")
    const allStatesArray = await getDataFromLocalForageIfExists(FC_ALL_STATES_KEY) as Array<fhirclient.ClientState>
    if (allStatesArray && currentState) {
      console.log("persistState: ...and we don't already have the current state obj in the array, then we add it")
      let currentStateIndex = -1
      let existsInAllStatesArray = allStatesArray.some((item: fhirclient.ClientState, i: number) => {
        console.log("persistState: Run some() check on states. Determining equality via clientId and endpoint")
        currentStateIndex = i
        console.log("persistState: currentStateIndex=", currentStateIndex)
        return item?.clientId === currentState?.clientId &&
            item?.serverUrl === currentState?.serverUrl
      })

      if (existsInAllStatesArray) {
        console.log("persistState: Already have state obj in local array. Don't need to add it " +
          "but DO need to overwrite so expiresAt and other data is not stale/outdated.")
        console.log(`persistState: Overwriting matching state object in array at index ${currentStateIndex}`)
        // Note: We don't need to check if index > -1 before overwriting because array.some already returned true here
        allStatesArray[currentStateIndex] = currentState
        console.log(`persistState: Overwrite: Attempt to overwrite the existing array at the key ${FC_ALL_STATES_KEY}`)
        await saveState(FC_ALL_STATES_KEY, allStatesArray, true).then(() => {
          console.log("persistState: Overwrite: Attempted Update of state obj in local array")
        }).catch((e) => console.error(e))

      } else {
        console.log("persistState: Push new unique current local fhir state obj to the array")
        allStatesArray.push(currentState)
        console.log(`persistState: Add: Attempt to overwrite the existing array at the key ${FC_ALL_STATES_KEY}`)
        await saveState(FC_ALL_STATES_KEY, allStatesArray, true).then(() => {
          console.log("persistState: Add: Attempted Add of additional unique state obj to local array")
        }).catch((e) => console.error(e))
      }
    }

  } else {
    console.log("persistState: all-states array does not exist yet; creating")
    const allStatesArray = [currentState] as Array<fhirclient.ClientState>
    await saveState(FC_ALL_STATES_KEY, allStatesArray, true).then(() => {
      console.log('persistState: allStatesArray created with current state')
    }).catch((e) => console.error(e))
  }

  if (process.env.REACT_APP_TEST_PERSISTENCE === 'true') {
    // test persisted data recovery for localFhirClientStates
    const allStatesArray = await getDataFromLocalForageIfExists(FC_ALL_STATES_KEY)
    console.log('persistState: allStatesArray=', allStatesArray)

    // test persisted data recovery for selectedEndpoints
    const selectedEndpoints = await getSelectedEndpoints()
    console.log('persistState: selectedEndpoints=', selectedEndpoints)
  }
}

// SELECTED ENDPOINTS //

export const saveSelectedEndpoints = async (endpoints: string[]): Promise<string[] | undefined> => {
  if (endpoints) {
    if (endpoints.length > 0) {
      return await localForage.setItem(SELECTED_ENDPOINTS_KEY, endpoints)

    } else {
      console.warn("saveSelectedEndpoints: endpoints length is less than 1, will not save")
    }

  } else {
    console.warn("saveSelectedEndpoints: endpoints is not defined, will not save")
  }
  return undefined
}

const selectedEndpointsExist = async (): Promise<boolean> => {
  try {
    const endpoints: string[] = await localForage.getItem(SELECTED_ENDPOINTS_KEY) as string[]
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (endpoints !== null) {
      console.log('selectedEndpointsExist: they do')
      return true

    } else {
      console.log('selectedEndpointsExist: they do not')
      return false
    }

  } catch (e) {
    console.error(`selectedEndpointsExist: caught exception: ${e}`)
    return false
  }
}

export const getSelectedEndpoints = async (): Promise<string[] | undefined> => {
  try {
    const exists: boolean = await selectedEndpointsExist()
    if (exists) {
      const endpoints: string[] = await localForage.getItem(SELECTED_ENDPOINTS_KEY) as string[]
      if (endpoints) {
        if (endpoints.length > 0) {
          console.log("getSelectedEndpoints: endpoints is defined and length is > 0, Returning data: ", JSON.stringify(endpoints))
          return endpoints

        } else {
          console.log("getSelectedEndpoints: endpoints length is less than 1.  Returning an empty array")
          return []
        }

      } else {
        console.log("getSelectedEndpoints: selectedEndpoints is not defined.  Returning an empty array")
        return []
      }
    }
  } catch (e) {
    console.error(`getSelectedEndpoints: caught exception: ${e}`)
  }
  return undefined
}

export const deleteSelectedEndpoints = async (): Promise<void> => {
  try {
    const exists: boolean = await selectedEndpointsExist()
    if (exists) {
      await localForage.removeItem(SELECTED_ENDPOINTS_KEY).then(() => {
        console.log('deleteSelectedEndpoints: deleted selected endpoints')
      }).catch((e) => console.error(e))

    } else {
      console.log("deleteSelectedEndpoints: selected endpoints not found, nothing to delete")
    }

  } catch (e) {
    console.error("deleteSelectedEndpoints: caught exception: " + e)
  }
}

// // Unused, not needed, and incomplete at this time
// const saveEndpointToSelectedEndpointsArray = async (endpoint: string): Promise<any> => {
//   const key = SELECTED_ENDPOINTS_KEY
//   if (endpoint) {
//     // get existing endpoints from local storage
//     const fetchedEndpoints: string[] = await localForage.getItem(key) as string[]
//     if (fetchedEndpoints) {
//       if (fetchedEndpoints.length > 0) {
//         // create updatedEndpoints array, add fetchedEndpoints to it, then push the new endpoint to that and save
//         return await localForage.setItem(key, endpoint)
//       } else {
//         console.log("fetchedEndpoints length is less than 1")
//       }
//     } else {
//       console.log("fetchedEndpoints are not truthy")
//     }
//   } else {
//     console.error("saveEndpointToSelectedEndpointsArray endpoint is not truthy: " + endpoint)
//   }
// }

// LAUNCHER DATA //

const saveLauncherData = async (launcherData: LauncherData | undefined): Promise<LauncherData | null> => {
  if (launcherData) {
    if (launcherData.name && launcherData.config) {
      console.log('saving launcher data: ', launcherData)
      return await localForage.setItem(LAUNCHER_DATA_KEY, launcherData)

    } else {
      console.log('saveLauncherData: launcher data is missing name and / or config, cannot save')
    }

  } else {
    // TODO: This situation could have drastic effects on the logic. Need to figure out how to properly handle it.
    console.error("saveLauncherData: data is undefined. Cannot save launcher data.")
  }
  return null
}

export const launcherDataExists = async (): Promise<boolean> => {
  try {
    const launcherData: LauncherData = await localForage.getItem(LAUNCHER_DATA_KEY) as LauncherData
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (launcherData !== null) {
      console.log('launcherDataExists: found')
      return true

    } else {
      console.log('launcherDataExists: not found')
      return false
    }

  } catch (e) {
    console.error(`launcherDataExists: caught exception: ${e}`)
    return false
  }
}

export const getLauncherData = async (): Promise<LauncherData | null | undefined> => {
  try {
    const exists: boolean = await launcherDataExists()
    if (exists) {
      return await localForage.getItem(LAUNCHER_DATA_KEY) // null if failed
    }
  } catch (e) {
    console.error(`getLauncherData: caught exception: ${e}`)
  }
  return undefined
}


export const getAuthorizedPatientId = async(): Promise<string | undefined> => {
    let patientId: string | undefined = undefined;
    try {
        const launcherData = await getLauncherData();
        let iss: string | undefined = launcherData!.config?.iss;
        let state: fhirclient.ClientState | undefined = iss ? await getStateForEndpoint(iss) : undefined;
        patientId = state?.tokenResponse?.patient;

    } catch (err) {
        console.error("getAuthorizedPatientId: caught exception: " + err);
    }
    return patientId;
}

// storer: commenting out this function as it's never called
// // Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
// export const deleteLauncherData = async (): Promise<void> => {
//   try {
//     const launcherData: ProviderEndpoint = await getLauncherData() as ProviderEndpoint
//     if (launcherData) {
//       await localForage.removeItem(LAUNCHER_DATA_KEY)
//       console.log("Deleted launcherData")
//     } else {
//       console.log("launcherData does not exist so there is no need to delete it")
//     }
//   } catch (e) {
//     console.error("Failure deleting launcherData: " + e)
//   }
// }

export const persistStateAsLauncherData = async (state: fhirclient.ClientState) => {
  // Convert clientState to ProviderEndpoint
  const stateLauncherData: LauncherData | undefined = await getLauncherDataForState(state)

  // Use convertedProviderEndpoint if it's truthy/in our list of available endpoints
  // Otherwise, it's not defined, and we need to create it
  // Later, in that case, we persist it so that we can add it if missing on load
  // such as would be the case with a launcher that has not been pre-configured
  // (as is typical in the real world).
  // TODO: Set name dynamically using get org name from capability resource, Dave knows the logic
  const launcherDataToSave: LauncherData = stateLauncherData ?? {
    name: 'Original Provider',
    // useProxy: false,
    config: {
      iss: state.serverUrl,
      redirectUri: "./index.html",
      clientId: state.clientId,
      scope: state.scope
    }
  }
  console.log('persistLauncherData: launcherDataToSave=', launcherDataToSave)

  if (stateLauncherData === undefined) {
    console.log('persistLauncherData: stateLauncherData === undefined, will save a dynamic launcher (as "Original Provider") as is typical in real-world use cases')
  }

  // Persist converted data
  try {
    await saveLauncherData(launcherDataToSave)
    console.log('persistLauncherData: persisted')
  } catch (e) {
    console.error('persistLauncherData: caught exception: ', e)
  }
}

// New Session ID Functions

export const saveSessionId = async (sessionId: string): Promise<void> => {
  try {
    await localForage.setItem(SESSION_ID_KEY, sessionId)
  } catch (e) {
    console.error('saveSessionId: caught exception: ' + e)
  }
}

export const sessionIdExistsInLocalForage = async (): Promise<boolean> => {
  try {
    const sessionId = await localForage.getItem(SESSION_ID_KEY) as string
    return sessionId !== null

  } catch (e) {
    console.error('sessionIdExistsInLocalForage: caught exception: ' + e)
    return false
  }
}

export const getSessionId = async (): Promise<string | null> => {
  try {
    const exists = await sessionIdExistsInLocalForage()
    if (exists) {
      return await localForage.getItem(SESSION_ID_KEY) as string
    }
  } catch (e) {
    console.error('getSessionId: caught exception: ' + e)
  }
  return null
}

// storer: commenting this function out as it's not called from anywhere
// export const deleteSessionId = async (): Promise<void> => {
//   try {
//     const exists = await sessionIdExistsInLocalForage()
//     if (exists) {
//       await localForage.removeItem(SESSION_ID_KEY)
//     }
//   } catch (e) {
//     console.error("Error deleting session ID: " + e)
//   }
// }

// GENERIC HELPER FUNCTIONS //

/*
Removes every key from the database, returning it to a blank slate.
*/
export const deleteAllDataFromLocalForage = async () => {
  try {
    console.log('deleteAllDataFromLocalForage: Attempting to clear all data from local forage...')
    await localForage.clear()

  } catch (err) {
    console.log('deleteAllDataFromLocalForage: caught exception: ' + err)

  } finally {
    console.log('deleteAllDataFromLocalForage: Successfully cleared all data from local forage (operation success)')
    console.log('deleteAllDataFromLocalForage: Testing that specifically-sensitive data was removed')

    console.log('deleteAllDataFromLocalForage: checking current state -')
    const currentState = await getDataFromLocalForageIfExists(FC_CURRENT_STATE_KEY) as fhirclient.ClientState
    if ( ! currentState ) {
      console.log('deleteAllDataFromLocalForage: SUCCESS: current state not found in local forage')
    } else {
      console.error('deleteAllDataFromLocalForage: ERROR: current state still exists in local forage!')
    }

    console.log('deleteAllDataFromLocalForage: checking all states array -')
    const allStatesArray: Array<fhirclient.ClientState> =
      await getDataFromLocalForageIfExists(FC_ALL_STATES_KEY) as Array<fhirclient.ClientState>
    if ( ! allStatesArray ) {
      console.log('deleteAllDataFromLocalForage: SUCCESS: all states array not found in local forage')
    } else {
      console.error('deleteAllDataFromLocalForage: ERROR: all states array still exists in local forage!')
    }

    console.log('deleteAllDataFromLocalForage: checking launcher data -')
    const launcherData: LauncherData = await getLauncherData() as LauncherData
    if ( ! launcherData ) {
      console.log('deleteAllDataFromLocalForage: SUCCESS: launcher data not found in local forage')
    } else {
      console.error('deleteAllDataFromLocalForage: ERROR: launcher data still exists in local forage!')
    }

    console.log('deleteAllDataFromLocalForage: checking session ID -');
    const sessionId = await getSessionId();
    if ( ! sessionId ) {
      console.log('deleteAllDataFromLocalForage: SUCCESS: session ID not found in local forage')
    } else {
      console.error('deleteAllDataFromLocalForage: ERROR: session ID still exists in local forage!')
    }
  }
}
