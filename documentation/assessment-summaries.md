# MyCarePlanner Assessment Summaries

This document describes the logic and structure used to display summaries of assessments in the MyCarePlanner app.

Assessments are sourced in several ways:

1. From a FHIR server as a single resource 'QuestionnaireResponse'
2. From a FHIR server as a set of 'Observation' resources where the top-level observation includes a hasMember field for each individual question
3. From assessments taken within this app and formatted as a 'QuestionnaireResponse'

In order to display the assessments from multiple sources in a single interface, everything is transformed in the (service layer)[src/data-services/questionnaireService.tsx] into a QuestionnaireResponse and ultimately into an array of QuestionnaireBundle objects as defined in (src/data-services/models/fhirResources.ts)[src/data-services/models/fhirResources.ts]. These bundles combine 3 concepts:

1. Questionnaire definition: The Questionnaire resource that defines the questionnaire
2. Questionnaire responses: The array of responses for the specific questionnaire
3. Questionnaire metadata: Supplemental information about the questions (e.g., whether it is score, a link for learning more, etc.)

The AssessmentList component uses the bundles to display the history of questionnaire responses. If the measure is scored, a score and interpretation are shown and the scores are plotted if there are enough data points.

The QuestionnaireBundle is heftier than it needs to be, as the UI only uses a small set of the fields, but this was following the pattern of other services where the full resources were available to the UI components.

## Questionnaire Metadata and Configuration

The fhirResources file defines assessment related interfaces. The QuestionnaireMetadata interface is used to store top-level information about the questionnaires that will be processed in the app, including an id, label, and learn more link. The questionnaireService contains the array of QuestionnaireMetadata items supported in the app.

The "id" field in the QuestionnaireMetadata item must match a definition file in (this directory)[public/content/]. For example, if the id is "PHQ-9", there should be a Questionnaire definition file `PHQ-9.json`. Note that this metadata design is different in the eCarePlanner application where we support the idea of multiple definitions for a single questionnaire type. This was required to support both the In-App QuestionnaireResponse format and the format provided by Qualifacts.

The app has configuration to allow either:
- Disabling the assessment UI entirely (REACT_APP_ASSESSMENTS_TAB_ENABLED)
- Configuring which assessments to process (REACT_APP_AVAILABLE_QUESTIONNAIRES)

See the .env file for these.

## PHQ-9 example

The PHQ-9 in MyCarePlanner has a definition file (here)[public/content/PHQ-9.json]. Much of the complex logic in the questionnaireService deals with processing a PHQ-9 that has been taken within the application. This will not be required in the new app, so a lot can be simplified.

Any QuestionnaireResponse that comes from a 3rd party endpoint would be expected to conform to the definition file. Since we made up the definition, that will likely never happen. If you have to integrate with an endpoint that provides PHQ-9 assessments in the QuestionnaireResponse format, you will probably need tweaks to support it as we did with Qualifacts in the ECarePlanner app.

For observations that come from Epic systems, all of the logic for converting them is in the method `convertObservations` in the questionnaireService. Here's a summary of what happens:

1. The app finds all survey observations that have the top-level code for the questionnaire. For PHQ-9, this is 44249-1.
2. The app inspects the hasMember field of the top-level Observation to find references to other Observations representing the individual questions and score.
3. For each observation, find the matching question in the definition using the LOINC code, and create a QuestionnaireResponseItem matching the value of the observation.
4. Assemble this into a QuestionnaireResponse that complies with the definition

For the UI, the most important part of the definition file is the QuestionnaireItem corresponding to the score:

```
{
    "extension": [
        {
            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-displayCategory",
            "valueCodeableConcept": {
                "coding": [
                    {
                        "display": "The PHQ-9 is the standard (and most commonly used) depression measure, and it ranges from 0-27 Scoring: Add up all checked boxes on PHQ-9. For every check: Not at all = 0; Several days = 1; More than half the days = 2; Nearly every day = 3 (the scores are the codes that appear in the answer list for each of the PHQ-9 problem panel terms). Interpretation: 1-4 = Minimal depression; 5-9 = Mild depression; 10-14 = Moderate depression; 15-19 = Moderately severe depression; 20-27 = Severed depression."
                    }
                ],
                "text": "The PHQ-9 is the standard (and most commonly used) depression measure, and it ranges from 0-27 Scoring: Add up all checked boxes on PHQ-9. For every check: Not at all = 0; Several days = 1; More than half the days = 2; Nearly every day = 3 (the scores are the codes that appear in the answer list for each of the PHQ-9 problem panel terms). Interpretation: 1-4 = Minimal depression; 5-9 = Mild depression; 10-14 = Moderate depression; 15-19 = Moderately severe depression; 20-27 = Severed depression."
            }
        },
        {
            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
            "valueCoding": {
                "code": "care-plan-score",
                "display": "{score}"
            }
        },
        {
            "url": "range-score-interpretation",
            "extension": [
                {
                    "url": "range",
                    "valueRange": {
                        "low": {
                            "value": 0
                        },
                        "high": {
                            "value": 4
                        }
                    }
                },
                {
                    "url": "interpretation",
                    "valueString": "Minimal"
                }
            ]
        },
        {
            "url": "range-score-interpretation",
            "extension": [
                {
                    "url": "range",
                    "valueRange": {
                        "low": {
                            "value": 5
                        },
                        "high": {
                            "value": 9
                        }
                    }
                },
                {
                    "url": "interpretation",
                    "valueString": "Mild"
                }
            ]
        },
        {
            "url": "range-score-interpretation",
            "extension": [
                {
                    "url": "range",
                    "valueRange": {
                        "low": {
                            "value": 10
                        },
                        "high": {
                            "value": 14
                        }
                    }
                },
                {
                    "url": "interpretation",
                    "valueString": "Moderate"
                }
            ]
        },
        {
            "url": "range-score-interpretation",
            "extension": [
                {
                    "url": "range",
                    "valueRange": {
                        "low": {
                            "value": 15
                        },
                        "high": {
                            "value": 19
                        }
                    }
                },
                {
                    "url": "interpretation",
                    "valueString": "Moderately Severe"
                }
            ]
        },
        {
            "url": "range-score-interpretation",
            "extension": [
                {
                    "url": "range",
                    "valueRange": {
                        "low": {
                            "value": 20
                        },
                        "high": {
                            "value": 27
                        }
                    }
                },
                {
                    "url": "interpretation",
                    "valueString": "Severe"
                }
            ]
        }
    ],
    "linkId": "/44261-6",
    "code": [
        {
            "system": "http://loinc.org",
            "code": "44261-6",
            "display": "Patient health questionnaire 9 item total score"
        }
    ],
    "text": "Patient health questionnaire 9 item total score",
    "type": "quantity",
    "required": false
}
```

The extension field is used in the definition to provide the UI context for displaying the score and the interpretation of that score. It marks this item as a care-plan-score and provides the ranges for different interpretations.

Note that observations from Epic come with the score already calculated. The only time the app will calculate a score is if the patient takes the assessment directly in the app. So most of the score summing logic can probably be removed in the new version.





