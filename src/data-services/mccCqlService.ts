// @ts-ignore
import cql from 'cql-execution';
// @ts-ignore
import cqlfhir from 'cql-exec-fhir';

import {Resource, Practitioner} from './fhir-types/fhir-r4';
import { FHIRData } from './models/fhirResources';
import { ConditionSummary, GoalSummary, MedicationSummary, ObservationSummary } from './models/cqlSummary';

import { mccCodeService, mccConditionsLibrary, mccGoalsLibrary, mccLabResultsLibrary, mccMedicationsLibrary, mccVitalSignsLibrary } from './mccCqlLibraries';
import { doLog } from '../log';

function getBundleEntries(resources?: Resource[]) {
  return resources?.map((r: Resource) => ({ resource: r })) || []
}

function getPatientSource(data: FHIRData, cqlType: string): unknown {
  const practitioners: Practitioner[] = []
  data.resourceRequesters?.forEach((practitioner, id) =>
    practitioners.push(practitioner)
  );
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{resource: data.patient}, {resource: data.patientPCP},
      ...(cqlType === 'conditions' || cqlType === 'goals'
          ? getBundleEntries(data.conditions)
          : []),
      ...(cqlType === 'medications'
          ? getBundleEntries(data.medicationRequests)
          : []),
      ...(cqlType === 'medications'
          ? getBundleEntries(data.medications)
          : []),
      ...getBundleEntries(data.serviceRequests), // Not used?
      ...(cqlType === 'labResults' || cqlType === 'goals'
          ? getBundleEntries(data.labResults)
          : []),
      ...(cqlType === 'vitalSigns' || cqlType === 'goals'
          ? getBundleEntries(data.vitalSigns)
          : []),
      ...getBundleEntries(data.surveyResults), // Maybe used for Screenings?
      ...(cqlType === 'goals'
          ? getBundleEntries(data.goals)
          : []),
      ...getBundleEntries(data.provenance),
      ...getBundleEntries(practitioners)
    ]
  }

  const patientSource = cqlfhir.PatientSource.FHIRv401()
  patientSource.loadBundles([fhirBundle])

  return patientSource
}

const extractConditionSummary = (fhirData?: FHIRData): ConditionSummary[] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!, 'conditions')
  const extractedSummary = executeLibrary(mccConditionsLibrary, mccCodeService, patientSource)

  // console.log("CQL Results in extractConditionSummary: " + JSON.stringify(extractedSummary))
  // console.log("ConditionSummary: ", extractedSummary.ConditionSummary)
  return extractedSummary?.ConditionSummary
}
export const getConditionSummaries = (fhirDataCollection?: FHIRData[]): ConditionSummary[][] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }

  let conditionSummariesMatrix: ConditionSummary[][] | undefined = []
  for (const curFhirData of fhirDataCollection) {
    if (curFhirData.conditions && curFhirData.conditions.length > 0) {
      const conSummary: ConditionSummary[] | undefined = extractConditionSummary(curFhirData)
      conditionSummariesMatrix.push(conSummary ? conSummary : [])
    }
  }
  return conditionSummariesMatrix
}

const extractGoalSummary = (fhirData?: FHIRData): GoalSummary[] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!, 'goals')
  const extractedSummary = executeLibrary(mccGoalsLibrary, mccCodeService, patientSource)

  // console.log("CQL extractedSummary: ", extractedSummary)
  // console.log("CQL extractedSummary.GoalSummary: ", extractedSummary.GoalSummary)
  return extractedSummary?.GoalSummary
}
export const getGoalSummaries = (fhirDataCollection?: FHIRData[]): GoalSummary[][] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }

  let goalSummariesMatrix: GoalSummary[][] | undefined = []
  for (const curFhirData of fhirDataCollection) {
    if (curFhirData.goals && curFhirData.goals.length > 0) {
      const goalSummary: GoalSummary[] | undefined = extractGoalSummary(curFhirData)
      goalSummariesMatrix.push(goalSummary ? goalSummary : [])
    }
  }
  return goalSummariesMatrix
}

const extractLabResultSummary = (fhirData?: FHIRData): ObservationSummary[] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!, 'labResults')
  const extractedSummary = executeLibrary(mccLabResultsLibrary, mccCodeService, patientSource)

  // console.log("CQL Results in extractLabResultSummary: " + JSON.stringify(extractedSummary))
  // console.log("LabResultSummary: ", JSON.stringify(extractedSummary.LabResultSummary))
  return extractedSummary?.LabResultSummary
}
export const getLabResultSummaries = (fhirDataCollection?: FHIRData[]): ObservationSummary[][] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }

  let labSummariesMatrix: ObservationSummary[][] | undefined = []
  for (const curFhirData of fhirDataCollection) {
    if (curFhirData.labResults && curFhirData.labResults.length > 0) {
      const labSummary: ObservationSummary[] | undefined = extractLabResultSummary(curFhirData)
      labSummariesMatrix.push(labSummary ? labSummary : [])
    }
  }
  return labSummariesMatrix
}

const extractMedicationSummary = (fhirData?: FHIRData): MedicationSummary[] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!, 'medications')
  const extractedSummary = executeLibrary(mccMedicationsLibrary, mccCodeService, patientSource)

  // console.log("CQL Results in extractMedicationSummary: " + JSON.stringify(extractedSummary))
  // console.log("MedicationSummary: ", JSON.stringify(extractedSummary.MedicationSummary))
  return extractedSummary?.MedicationSummary
}

export const getMedicationSummaries = (fhirDataCollection?: FHIRData[]): MedicationSummary[][] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }

  let medSummariesMatrix: MedicationSummary[][] | undefined = []
  for (const curFhirData of fhirDataCollection) {
    if (curFhirData.medicationRequests && curFhirData.medicationRequests.length > 0) {
      const medSummary: MedicationSummary[] | undefined = extractMedicationSummary(curFhirData)
      medSummariesMatrix.push(medSummary ? medSummary : [])
    }
  }
  return medSummariesMatrix
}

const extractVitalSignSummary = (fhirData?: FHIRData): ObservationSummary[] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!, 'vitalSigns')
  const extractedSummary = executeLibrary(mccVitalSignsLibrary, mccCodeService, patientSource)

  // console.log("CQL Results in extractVitalSignSummary: " + JSON.stringify(extractedSummary))
  // console.log("VitalSignsSummary: ", JSON.stringify(extractedSummary.VitalSignsSummary))
  return extractedSummary?.VitalSignsSummary
}
export const getVitalSignSummaries = (fhirDataCollection?: FHIRData[]): ObservationSummary[][] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }

  let vitalSignSummariesMatrix: ObservationSummary[][] | undefined = []
  for (const curFhirData of fhirDataCollection) {
    if (curFhirData.vitalSigns && curFhirData.vitalSigns.length > 0) {
      const vitalSummary: ObservationSummary[] | undefined = extractVitalSignSummary(curFhirData)
      vitalSignSummariesMatrix.push(vitalSummary ? vitalSummary : [])
    }
  }
  return vitalSignSummariesMatrix
}

const executeLibrary = (library: any, codeService: any, patientSource: any): any => {
  try {
    const executor = new cql.Executor(library, codeService)
    const results = executor.exec(patientSource)
    // Note: This array index of 0 is not related to multi providers. It was setup this way prior to multi proviuders.
    const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]]
    // console.log("CQL Results in executeLibrary: ", JSON.stringify(extractedSummary));

    return extractedSummary
  }
  catch (err) {
    console.log("Error executing CQL: " + err)
    return undefined
  }
}
