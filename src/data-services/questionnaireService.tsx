import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse } from './fhir-types/fhir-r4';
import { getSupplementalDataClient } from '../data-services/fhirService'

// The list of questionnaires and metadata. Note that url and code here needs to match what is in the resource in public/content.
const questionnaires = [
    {
        "id": "PHQ-9",
        "label": "Depression Assessment",
        "url": "http:/lforms-fhir.nlm.nih.gov/baseR4/Questionnaire/44249-1",
        "code":
        {
            "system": "http://loinc.org",
            "code": "44249-1"
        },
    },
    {
        "id": "PROMIS-29-questionnaire",
        "label": "General Health Assessment",
        "url": "http://loinc.org/q/62337-1",
        "code":
        {
            "system": "http://loinc.org",
            "code": "62337-1"
        }
    },
    {
        "id": "AHC-questionnaire",
        "label": "Health-Related Social Needs",
        "url": "http://loinc.org/q/96777-8",
        "code":
        {
            "system": "http://loinc.org",
            "code": "96777-8"
        }
    },
    {
        "id": "caregiver-strain-questionnaire",
        "label": "Caregiver Strain Assessment",
        "url": "http://hl7.org/fhir/us/mcc/Questionnaire/caregiver-strain-index",
        "code":
        {
            "system": "http://hl7.org",
            "code": "caregiver-strain-index"
        }
    },
];

export function getLocalQuestionnaire(id: String) {
    let publicPath = `${process.env.PUBLIC_URL}`;
    let resourcePath = publicPath + '/content/' + id + ".json";
    return fetch(resourcePath)
        .then((response) => {
            return response.json();
        })
        .then((questionnaireJson) => {
            return questionnaireJson as Questionnaire
        }).catch(error => {
            return error;
        });
}

export function getAvailableQuestionnaires() {
    return questionnaires;
}

// storer: commenting out this function as it's never called
// export function getQuestionnaire(serverUrl: any, questionnaireID: string) {
//     let url: string;
//     return getSupplementalDataClient()
//         .then((client: Client | undefined) => {
//             if (client) {
//                 url = client.state.serverUrl;
//                 return client.request('Questionnaire/' + questionnaireID);
//             }
//         })
//         .then((questionnaire) => {
//             serverUrl.push(url + '/Questionnaire/' + questionnaire.id);
//             return questionnaire;
//         }).catch(error => {
//             return error;
//         });
// }

export function submitQuestionnaireResponse(questionnaireResponse: QuestionnaireResponse) {
    return getSupplementalDataClient()
        .then((client: Client | undefined) => {
            // console.log(JSON.stringify(questionnaireResponse))
            // @ts-ignore
            return client.create(questionnaireResponse)
        })
        .then((response) => {
            return response
        }).catch(error => {
            console.log('Error saving questionnaire response: ', error)
        });
}
