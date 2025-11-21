// import { fhirclient } from 'fhirclient/lib/types';
import {
    Resource,
    CarePlan,
    CareTeam,
    Coding,
    Encounter,
    Condition,
    DiagnosticReport,
    Goal,
    Immunization,
    MedicationRequest,
    ServiceRequest,
    Observation,
    Patient,
    Practitioner,
    Procedure,
    Provenance,
    Questionnaire,
    QuestionnaireResponse,
    RelatedPerson,
    CodeableConcept,
    Period,
    Timing,
    TimingRepeat
} from '../fhir-types/fhir-r4';

export interface QuestionnaireMetadata {
    id: string, // The id of the questionnaire which must match the filename in public/content to load the definition.
    label: string, // The label of the questionnaire to display to users.
    learnMore?: string, // The URL to the learn more page for this questionnaire. This is used by the QuestionnaireHandler to display a link to the learn more page.
    resource_id: string, // The id of the FHIR resource representing the questionnaire. This is used by the QuestionnaireHandler to select the questionnaire and submit.
    url: string, // The url of the questionnaire. This is what the QuestionnaireResponse will reference in the questionnaire field.
    isScored: boolean, // Indicates whether the questionnaire has scores that can be plotted
    code: Coding // The code associated with the questionnaire. This will be the top-level code for questionnaire responses represented as observations.
}

export interface QuestionnaireBundle {
    questionnaireMetadata: QuestionnaireMetadata;
    questionnaireDefinition: Questionnaire;
    questionnaireResponses?: QuestionnaireResponse[];
}

export interface FHIRData {
    serverName?: string,
    serverUrl?: string,
    isSDS: boolean, // tracks if this set of data is from a supplemental data store or not
    clientScope?: string,
    fhirUser?: Practitioner | Patient | RelatedPerson | undefined,
    caregiverName?: String,
    patient?: Patient,
    patientPCP?: Practitioner,
    carePlans?: CarePlan[],
    careTeams?: CareTeam[],
    careTeamMembers?: Map<string, Practitioner>,
    resourceRequesters?: Map<string, Practitioner>,
    // careTeamPhotos?: Binary[],
    encounters?: Encounter[],
    conditions?: Condition[],
    diagnosticReports?: DiagnosticReport[],
    goals?: Goal[],
    immunizations?: Immunization[],
    medications?: MedicationRequest[],
    serviceRequests?: ServiceRequest[],
    procedures?: Procedure[],
    labResults?: Observation[],
    vitalSigns?: Observation[],
    socialHistory?: Observation[],
    surveyResults?: Observation[],

    // key = Resource.id, values = 0..* Provenance
    provenanceMap?: Map<string, Provenance[]>,
    provenance?: Provenance[],
    questionnaireBundles?: QuestionnaireBundle[],
}

export function allShareableResources(fhirData: FHIRData|undefined): Resource[] {
    let arr: Resource[] = [];
    if (fhirData !== undefined) {
        if (fhirData.patient)           arr.push(fhirData.patient);
        if (fhirData.encounters)        arr.push(...fhirData.encounters);
        if (fhirData.conditions)        arr.push(...fhirData.conditions);
        if (fhirData.goals)             arr.push(...fhirData.goals);
        if (fhirData.immunizations)     arr.push(...fhirData.immunizations);
        if (fhirData.medications)       arr.push(...fhirData.medications);
        if (fhirData.serviceRequests)   arr.push(...fhirData.serviceRequests);
        if (fhirData.procedures)        arr.push(...fhirData.procedures);
        if (fhirData.labResults)        arr.push(...fhirData.labResults);
        if (fhirData.vitalSigns)        arr.push(...fhirData.vitalSigns);
        if (fhirData.socialHistory)     arr.push(...fhirData.socialHistory);
        if (fhirData.diagnosticReports) arr.push(...fhirData.diagnosticReports);
        if (fhirData.surveyResults)     arr.push(...fhirData.surveyResults);
        if (fhirData.carePlans)         arr.push(...fhirData.carePlans);
        if (fhirData.careTeams)         arr.push(...fhirData.careTeams);
        //TODO: AEY Do I need to share these?
        //if (fhirData.questionnaireResponses)     arr.push(...fhirData.questionnaireResponses);
    }
    return arr;
}

export function hasScope(clientScope: string | undefined, resourceType: string) {
    // Use lower case for compare - Epic returns, e.g. Condition.Read
    return clientScope?.toLowerCase().includes(resourceType.toLowerCase())
        || (clientScope?.toLowerCase().includes('*.read') && resourceType.toLowerCase() !== 'servicerequest.read')
    // TODO generalize the second condition to allow only USCDI resources with wildcard scope
}


export function displayDate(dateString?: string): string | undefined {
    if (dateString === undefined || dateString === null) {
        return undefined
    } else {
        // If time is not included, then parse only Year Month Day parts
        // In JavaScript, January is 0. Subtract 1 from month Int.
        let parts = dateString!.split('-');
        let jsDate: Date = (dateString?.includes('T'))
            ? new Date(dateString!)
            : new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

        return jsDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit"
        })
    }
}

export function displayDateTime(dateString?: string): string | undefined {
    if (dateString === undefined || dateString === null) {
        return undefined
    } else {
        // If time is not included, then parse only Year Month Day parts
        // In JavaScript, January is 0. Subtract 1 from month Int.
        var parts = dateString!.split('-');
        var jsDate: Date = (dateString?.includes('T'))
            ? new Date(dateString!)
            : new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

        return jsDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        })
    }
}

// provider type valueset: http://hl7.org/fhir/R4/valueset-encounter-participant-type.html
export function isEncounterParticipantTypeAReferrer(type: CodeableConcept[]): boolean {
    if (type && type.length > 0) {
        for (let codeable of type) {
            if (codeable.coding) {
                for (let code of codeable.coding) {
                    if (code.system === 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType' &&
                        code.code === 'REF') {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// participant type valueset: https://hl7.org/fhir/R4/valueset-encounter-participant-type.html
export function displayParticipant(encounter: Encounter): string | undefined {
    let participant: string | undefined = undefined;
    if (encounter.participant) {
        for (let p of encounter.participant) {
            if (p.individual && p.individual.display && p.type && ! isEncounterParticipantTypeAReferrer(p.type)) {
                participant = p.individual.display;
                break;
            }

        }
    }
    return participant;
}

export function displayConcept(codeable: CodeableConcept | undefined): string | undefined {
    if (codeable?.text !== undefined) {
        return codeable?.text
    } else {
        // use the first coding.display that has a value
        return codeable?.coding?.filter((c) => c.display !== undefined)?.[0]?.display
    }
}

export function displayTiming(timing: Timing | undefined): string | undefined {
    let boundsPeriod = (timing?.repeat as TimingRepeat)?.boundsPeriod
    let startDate = displayDate(boundsPeriod?.start)
    let endDate = displayDate(boundsPeriod?.end)

    return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

export function displayPeriod(period: Period | undefined): string | undefined {
    let startDate = displayDate(period?.start)
    let endDate = displayDate(period?.end)

    if (startDate && endDate) {
        return (startDate == endDate) ?
            startDate :
            `${startDate} to ${endDate}`
    } else if (startDate) {
        return 'Began ' + startDate
    } else if (endDate) {
        return 'Ended ' + endDate
    } else {
        return undefined
    }
}

export function displayValue(obs: Observation): string | undefined {
    // Use the first LOINC code
    let loincCode = obs.code?.coding?.filter((c) => c.system === 'http://loinc.org')?.[0]?.code
    var systolic: string | undefined = undefined
    var diastolic: string | undefined = undefined
    var display: string | undefined = undefined

    // If Blood Pressure observation, use its components
    if (loincCode === '85354-9' || loincCode === '55284-4') {
        obs.component?.forEach(comp => {
            let compCode = comp.code?.coding?.filter((c) => c.system === 'http://loinc.org')?.[0]?.code
            if (compCode === '8480-6') {
                systolic = comp.valueQuantity?.value?.toString()
            } else if (compCode === '8462-4') {
                diastolic = comp.valueQuantity?.value?.toString()
            } else {
            }
        })
        display = (systolic ?? '') + '/' + (diastolic ?? '') + ' mmHg'
    } else {
        let valueString = obs.valueQuantity?.value
            ?? obs.valueCodeableConcept?.text ?? obs.valueCodeableConcept?.coding?.[0]?.display
            ?? obs.valueString
            ?? ''
        display = valueString + ' ' + (obs.valueQuantity?.unit ?? '')
    }

    return display
}

export function displayTransmitter(prov: Provenance | undefined): string | undefined {
    var display: string | undefined

    prov?.agent?.forEach(agent => {
        agent.type?.coding?.forEach(coding => {
            if (coding.code === 'transmitter') {
                display = agent.who?.display
            }
        })
    })

    return display
}
