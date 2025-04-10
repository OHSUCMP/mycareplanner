import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireItem } from './fhir-types/fhir-r4';
import { getSupplementalDataClient } from '../data-services/fhirService'
import { is } from 'immer/dist/internal';

// The list of questionnaires and metadata. Note that resource_id, url, and code needs to match what is in the resource in public/content.
const questionnaires = [
    {
        "id": "PHQ-9",
        "label": "Depression Assessment",
        "resource_id": "44249-1",
        "url": "PHQ-9",
        "code":
        {
            "system": "http://loinc.org",
            "code": "44249-1"
        },
    },
    {
        "id": "PROMIS-29-questionnaire",
        "label": "General Health Assessment",
        "resource_id": "62337-1",
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
        "resource_id": "96777-8",
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
        "resource_id": "questionnaire-caregiver-strain-index",
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

export function getAvailableQuestionnaireByResourceId(resourceId: String) {
    const questionnaire = questionnaires.find((q) => q.resource_id === resourceId);
    return questionnaire || null;
}

export function isScoreQuestion(item: QuestionnaireItem) {
    return !item.extension?.filter((ext: any) => ext.url === "http://hl7.org/fhir/StructureDefinition/questionnaire-unit").map((ext: any) => { return ext.valueCoding?.code}).includes('LP73852-3');
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

function sumValueDecimals(questionnaireResponse: QuestionnaireResponse) {
    let total = 0;
  
    const items = questionnaireResponse.item?.[0]?.item || [];
  
    for (const item of items) {
      const answer = item.answer?.[0];
      if (answer) {
        // 1. Add direct valueDecimal if present
        if (typeof answer.valueDecimal === 'number') {
          total += answer.valueDecimal;
        }
  
        // 2. Look inside extensions for ordinalValue valueDecimal
        if (answer.extension) {
          for (const ext of answer.extension) {
            if (ext.url === 'http://hl7.org/fhir/StructureDefinition/ordinalValue' && typeof ext.valueDecimal === 'number') {
              total += ext.valueDecimal;
            }
          }
        }
      }
    }
  
    return total;
}  

function scorePHQ9(questionnaireResponse: QuestionnaireResponse) {
    const totalScore = sumValueDecimals(questionnaireResponse);
    console.log('Total Score: ', totalScore);

    let score = {
        'linkId': '/44261-6', 
        'text': 'Patient health questionnaire 9 item total score', 
        'answer': [
            {
                'valueDecimal': totalScore
            }
        ]
    } as QuestionnaireResponseItem;
    questionnaireResponse.item?.[0].item?.push(score);
    return questionnaireResponse;
}

function isCompletePHQ9(questionnaireResponse: QuestionnaireResponse) {
    const items = questionnaireResponse.item?.[0]?.item || [];
    const links = items.map((item) => item.linkId);
    const requiredLinks = [
        '/44250-9',
        '/44255-8',
        '/44259-0',
        '/44254-1',
        '/44251-7',
        '/44258-2',
        '/44252-5',
        '/44253-3',
        '/44260-8'
    ];

    return requiredLinks.every(link => links.includes(link));
}

export function submitQuestionnaireResponse(questionnaireId: String, questionnaireResponse: QuestionnaireResponse) {
    const questionnaire = getAvailableQuestionnaireByResourceId(questionnaireId);
    if (questionnaire?.id === 'PHQ-9' && isCompletePHQ9(questionnaireResponse)) {
        questionnaireResponse = scorePHQ9(questionnaireResponse);
    }
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
