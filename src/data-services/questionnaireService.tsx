import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer, QuestionnaireItem, Coding, Observation } from './fhir-types/fhir-r4';
import { getSupplementalDataClient } from '../data-services/fhirService'
import { QuestionnaireMetadata, QuestionnaireBundle } from './models/fhirResources';

// The list of questionnaires and metadata. Note that resource_id, url, and code will overwrite whatever is in the resource in public/content to be sure they match expectations for scoring.
// The environment variable REACT_APP_AVAILABLE_QUESTIONNAIRES can be used to filter which questionnaires are available.
const questionnairesMetadata: QuestionnaireMetadata[] = [
    {
        "id": "PHQ-9",
        "label": "Depression Assessment",
        "resource_id": "44249-1",
        "url": "PHQ-9",
        "isScored": true,
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
        "isScored": false,
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
        "isScored": false,
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
        "isScored": false,
        "code":
        {
            "system": "http://hl7.org",
            "code": "caregiver-strain-index"
        }
    },
];

export function getLocalQuestionnaire(id: String): Promise<Questionnaire> {
    let questionnaireMetadata = findQuestionnaireMetadataById(id);
    let publicPath = `${process.env.PUBLIC_URL}`;
    let resourcePath = publicPath + '/content/' + id + ".json";
    return fetch(resourcePath)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch questionnaire ${id}: ${response.statusText}`);
            }
            return response.json();
        })
        .then((questionnaireJson) => {
            if (!questionnaireMetadata) {
                throw new Error(`Metadata not found for questionnaire id: ${id}`);
            }

            const questionnaire = questionnaireJson as Questionnaire;
            // Replace the questionnaire definition fields to make sure they match what's expected
            questionnaire.id = questionnaireMetadata.resource_id;
            questionnaire.url = questionnaireMetadata.url;
            questionnaire.code = [questionnaireMetadata.code as Coding];
            return questionnaire;
        });
}

export function getAvailableQuestionnaires(): QuestionnaireMetadata[] {
    const availableIds = process.env.REACT_APP_AVAILABLE_QUESTIONNAIRES?.split(',') || [];
    return questionnairesMetadata.filter(q => availableIds.includes(q.id));
}

function findQuestionnaireMetadataById(id: String): QuestionnaireMetadata | null {
    const questionnaireMetadata = questionnairesMetadata.find((q) => q.id === id);
    return questionnaireMetadata || null;
}

function findQuestionnaireMetadataByResourceId(resourceId: String): QuestionnaireMetadata | null {
    const questionnaireMetadata = questionnairesMetadata.find((q) => q.resource_id === resourceId);
    return questionnaireMetadata || null;
}

export function isScoreQuestion(item: QuestionnaireItem) {
    return item.extension?.some(
    (ext) =>
      ext.url === "http://hl7.org/fhir/StructureDefinition/questionnaire-unit" &&
      ext.valueCoding?.code === "care-plan-score"
  ) ?? false;
}

function findFirstScoreLinkId(items: QuestionnaireItem[]): string | undefined {
  for (const item of items) {
    if (isScoreQuestion(item)) {
      return item.linkId;
    }

    // Recurse into nested items
    if (item.item && item.item.length > 0) {
      const found = findFirstScoreLinkId(item.item);
      if (found) return found;
    }
  }

  return undefined;
}

function findScoreValueByLinkId(items: QuestionnaireResponseItem[], targetLinkId: string): number | undefined {
  for (const item of items) {
    if (item.linkId === targetLinkId && item.answer && item.answer.length > 0) {
      // Return the actual value (valueInteger, valueDecimal, etc.)
      const answer = item.answer[0];
      return extractAnswerValue(answer);
    }

    // Recurse into nested items
    if (item.item && item.item.length > 0) {
      const result = findScoreValueByLinkId(item.item, targetLinkId);
      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

function extractAnswerValue(answer: QuestionnaireResponseItemAnswer): number | undefined {
  if ('valueInteger' in answer) return answer.valueInteger;
  if ('valueDecimal' in answer) return answer.valueDecimal;
  return undefined;
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
                'valueQuantity': {
                    'value': totalScore
                }
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

// Flatten matching items into responseItems array
function collectMatchingItems(questionnaireItems: QuestionnaireItem[], members: (Observation | undefined)[], responseItems: QuestionnaireResponseItem[]) {
    for (const item of questionnaireItems) {
        // Assuming the first code in the array is the one we want to match
        const code = item.code?.[0]?.code;
        if (!code) {
            continue;
        }

        const observation = members.find((o) => o?.code.coding?.some((c) => c.code === code));

        if (observation) {
            const responseItem: QuestionnaireResponseItem = {
                linkId: item.linkId,
                text: item.text,
                answer: []
            };

            if (observation.valueCodeableConcept) {
                observation.valueCodeableConcept.coding?.forEach((coding) => {
                    responseItem.answer?.push({
                        valueCoding: {
                            system: coding.system,
                            code: coding.code,
                            display: coding.display
                        }});
                });
            } else if (observation.valueQuantity) {
                responseItem.answer?.push({
                    valueQuantity: {
                        value: observation.valueQuantity.value
                    }
                });
            }

            responseItems.push(responseItem); // ** push flat into the top-level array **
        }

        // Still check child items recursively
        if (item.item) {
            collectMatchingItems(item.item, members, responseItems);
        }
    }
}

/**
 * Build bundles representing the available questionnaires and their responses if any. Questionnaire responses may be
 * represented as a QuestionnaireResponse resource or a series of Observations with the category=survey in the
 * originating FHIR server. Both will be converted to a QuestionnaiteResponse resource for use by the application.
 * 
 * All available questionnaires are returned, even if there are no responses for them.
 * @param responses 
 * @param surveyObservations 
 * @returns 
 */
export async function buildQuestionnaireBundles(responses: QuestionnaireResponse[], surveyObservations: Observation[]): Promise<QuestionnaireBundle[]> {
    let bundles: QuestionnaireBundle[] = [];
    const availableQuestionnaires: QuestionnaireMetadata[] = getAvailableQuestionnaires();
    availableQuestionnaires.forEach(async (metadata: QuestionnaireMetadata) => {
        const questionnaire = await getLocalQuestionnaire(metadata.id);
        let allResponses: QuestionnaireResponse[] = [];
        allResponses = allResponses.concat(responses.filter((response) => response.questionnaire === metadata.url));
        allResponses = allResponses.concat(convertObservations(metadata.code, questionnaire, surveyObservations));
        bundles.push({
            questionnaireMetadata: metadata,
            questionnaireDefinition: questionnaire,
            questionnaireResponseBundles: allResponses
        });
    });
    return bundles;
}

/**
 * Given a top-level coding, a questionnaire definition, and a list of observations, find all the top-level observations
 * relevant to the questionnaire and construct a QuestionnaireResponse for each top-level observation and its members. 
 * @param topLevelCoding 
 * @param questionnaireDef 
 * @param surveyObservations 
 * @returns An array of QuestionnaireResponse resources constructed from observations related to the questionnaire.
 */
function convertObservations(topLevelCoding: Coding, questionnaireDef: Questionnaire, surveyObservations: Observation[]): QuestionnaireResponse[] {
    const questionnaireResponses: QuestionnaireResponse[] = [];
    const topLevelCode = topLevelCoding.code;    
    const topLevelObservations = surveyObservations.filter(o =>
            o.code.coding?.some(e => e.code === topLevelCode)
    );

    if (topLevelObservations.length > 0) {
        for (const obs of topLevelObservations) {
            const members = (obs.hasMember ?? []).map((member) => {
                const referenceId = member.reference?.split('/')[1];
                return surveyObservations.find((o) => o.id === referenceId);
            }).filter((o): o is Observation => o !== undefined); // remove undefineds

            const questionnaireResponse: QuestionnaireResponse = {
                resourceType: 'QuestionnaireResponse',
                status: 'completed',
                questionnaire: questionnaireDef.url,
                authored: obs.effectiveDateTime,
                item: []
            };

            const responseItems: QuestionnaireResponseItem[] = [];

            // Recursively search questionnaire items
            collectMatchingItems(questionnaireDef.item ?? [], members, responseItems);

            questionnaireResponse.item = responseItems;

            questionnaireResponses.push(questionnaireResponse);    
        }
    }

    return questionnaireResponses;

}

export function extractResponseScore(
    questionnaireMetadata: QuestionnaireMetadata,
    questionnaireDefinition: Questionnaire,
    questionnaireResponse: QuestionnaireResponse
): number | undefined {
    if (questionnaireMetadata.isScored) {
        const definedScoreLinkId = findFirstScoreLinkId(questionnaireDefinition.item || []);
        if (definedScoreLinkId) {
            const scoreValue = findScoreValueByLinkId(questionnaireResponse.item || [], definedScoreLinkId);
            return scoreValue;
        }
    }
    return undefined;
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
                    return client.create(questionnaireResponse)
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
