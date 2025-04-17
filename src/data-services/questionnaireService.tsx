import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireItem, Coding } from './fhir-types/fhir-r4';
import { getSupplementalDataClient } from '../data-services/fhirService'

// The list of questionnaires and metadata. Note that resource_id, url, and code will overwrite whatever is in the resource in public/content to be sure they match expectations for scoring.
// The environment variable REACT_APP_AVAILABLE_QUESTIONNAIRES can be used to filter which questionnaires are available.
const questionnairesMetadata = [
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
    let questionnaireMetadata = findQuestionnaireMetadataById(id);
    let publicPath = `${process.env.PUBLIC_URL}`;
    let resourcePath = publicPath + '/content/' + id + ".json";
    return fetch(resourcePath)
        .then((response) => {
            return response.json();
        })
        .then((questionnaireJson) => {
            let questionnaire = questionnaireJson as Questionnaire
            // Replace the questionnaire definition fields to make sure they match what's expected
            questionnaire.id = questionnaireMetadata?.resource_id;
            questionnaire.url = questionnaireMetadata?.url;
            questionnaire.code = [questionnaireMetadata?.code as Coding]
            return questionnaire;
        }).catch(error => {
            return error;
        });
}

export function getAvailableQuestionnaires() {
    const availableIds = process.env.REACT_APP_AVAILABLE_QUESTIONNAIRES?.split(',') || [];
    return questionnairesMetadata.filter(q => availableIds.includes(q.id));
}

function findQuestionnaireMetadataById(id: String) {
    const questionnaireMetadata = questionnairesMetadata.find((q) => q.id === id);
    return questionnaireMetadata || null;
}

function findQuestionnaireMetadataByResourceId(resourceId: String) {
    const questionnaireMetadata = questionnairesMetadata.find((q) => q.resource_id === resourceId);
    return questionnaireMetadata || null;
}

export function isScoreQuestion(item: QuestionnaireItem) {
    return !item.extension?.filter((ext: any) => ext.url === "http://hl7.org/fhir/StructureDefinition/questionnaire-unit").map((ext: any) => { return ext.valueCoding?.code}).includes('LP73852-3');
}

// This function assumes all questions are grouped under a single item (page)
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

// TODO: This should be generalized. Currently relies on the specific link being in the loaded resource in a certain location
function scorePHQ9(questionnaireResponse: QuestionnaireResponse) {
    const totalScore = sumValueDecimals(questionnaireResponse);
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

function findResponseItem(
    linkId: string,
    responseItems: QuestionnaireResponseItem[]
  ): QuestionnaireResponseItem | undefined {
    return responseItems.find((ri) => ri?.linkId === linkId);
  }

// Recursive algorithm to check that all required questions are represented in the response
function requiredQuestionsComplete(
    questionnaireItems: QuestionnaireItem[],
    responseItems: QuestionnaireResponseItem[] = []
  ): boolean {
    for (const qItem of questionnaireItems) {
      const responseItem = findResponseItem(qItem.linkId, responseItems);
  
      if (qItem.required && (!responseItem || !responseItem.answer || responseItem.answer.length === 0)) {
        return false;
      }
  
      if (qItem.item && qItem.item.length > 0) {
        const nestedResponseItems = responseItem?.item || [];
        const nestedComplete = requiredQuestionsComplete(qItem.item, nestedResponseItems);
        if (!nestedComplete) {
          return false;
        }
      }
    }
  
    return true;
  }

export function submitQuestionnaireResponse(questionnaireId: String, questionnaireResponse: QuestionnaireResponse) {
    const questionnaireMetadata = findQuestionnaireMetadataByResourceId(questionnaireId);
    if (questionnaireMetadata !== null && questionnaireMetadata.id) {
        return getLocalQuestionnaire(questionnaireMetadata.id).then(questionnaireDef => {
            if (questionnaireMetadata?.id === 'PHQ-9' && requiredQuestionsComplete(questionnaireDef?.item || [], questionnaireResponse?.item || [])) {
                questionnaireResponse = scorePHQ9(questionnaireResponse);
            }
            return getSupplementalDataClient()
                .then((client: Client | undefined) => {
                    // @ts-ignore
                    // TODO: AEY - No saving right now
                    //return client.create(questionnaireResponse)
                })
                .then((response) => {
                    return response
                }).catch(error => {
                    console.log('Error saving questionnaire response: ', error)
                });
        });
    }

    return Promise.reject(new Error("Questionnaire metadata not found."));
}
