import React, {FC} from 'react';
import {FHIRData, QuestionnaireMetadata} from '../../data-services/models/fhirResources';
import {Questionnaire, QuestionnaireResponse} from '../../data-services/fhir-types/fhir-r4';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {CircularProgress} from "@mui/material";
import { Summary } from './Summary';
import { Line } from 'react-chartjs-2';
import 'chart.js';
import { extractResponseScore, interpretScore } from '../../data-services/questionnaireService';

interface AssessmentListProps {
    sharingData: boolean;
    fhirDataCollection?: FHIRData[];
    progressTitle: string;
    progressValue: number;
    progressMessage: string;
}

interface ResponseBundle {
    qr: QuestionnaireResponse,
    authored: Date,
    score: number | undefined,
    interpretation?: string,
    source: string
}

interface MergedBundle {
  qm: QuestionnaireMetadata,
  qd: Questionnaire,
  responses: ResponseBundle[];
}

function mergeQuestionnaireBundles(fhirDataCollection: FHIRData[]): Map<string, MergedBundle> {
  const bundleMap = new Map<string, MergedBundle>();
  fhirDataCollection.forEach((data) => {
    if (data.questionnaireBundles) {
        data.questionnaireBundles.forEach((bundle) => {
            if (bundle.questionnaireResponses && bundle.questionnaireResponses.length > 0) {
                const responsesWithSource = bundle.questionnaireResponses
                    .filter((resp) => !!resp.authored) // Filter out undefined/null authored dates
                    .map((resp) => { 
                        const score = extractResponseScore(bundle.questionnaireMetadata, bundle.questionnaireDefinition, resp);
                        return {
                            qr: resp,
                            authored: new Date(resp.authored!),
                            score: score,
                            interpretation: score !== undefined ? interpretScore(bundle.questionnaireDefinition, score) : undefined,
                            source: data.serverName || "Unknown"
                        }
                    });

                if (bundleMap.has(bundle.questionnaireMetadata.label)) {                
                    const existing = bundleMap.get(bundle.questionnaireMetadata.label)!;
                    bundleMap.set(bundle.questionnaireMetadata.label, {
                    qm: existing.qm,
                    qd: existing.qd,
                    responses: existing.responses.concat(responsesWithSource) 
                    })
                } else {
                    bundleMap.set(bundle.questionnaireMetadata.label, {
                        qm: bundle.questionnaireMetadata,
                        qd: bundle.questionnaireDefinition,
                        responses: responsesWithSource
                    });
                }
            }
        });
    }
  });
  bundleMap.forEach((bundle) => {
    bundle.responses.sort((a, b) => a.authored.getTime() - b.authored.getTime());
  })
  return bundleMap;
}

function getOptions(measure: string) {
    return {
        elements: {
            line: {
                tension: 0
            }
        },
        title: {
            display: true,
            text: 'Total ' + measure + ' Scores'
        },
        legend: {
            display: false
        }
    };

}

function getData(responses: ResponseBundle[]) {
    return {
        labels: responses.map((response) => response.authored.toLocaleDateString()),
        datasets: [
            {
                data: responses.map((response) => response.score),
                borderColor: 'rgb(48, 96, 128)',
                fill: false
            }
        ]
    };
}  

export const AssessmentList: FC<AssessmentListProps> = ({sharingData, fhirDataCollection,
                                                                progressTitle, progressValue, progressMessage}) => {
    process.env.REACT_APP_DEBUG_LOG === "true" && console.log("AssessmentList component RENDERED!");

    const responses: Map<string, MergedBundle> = mergeQuestionnaireBundles(fhirDataCollection || []);

    function displayGraph(isScored: boolean, length: number) {
        return isScored && length > 2;
    }

    return (
        <div className="home-view">
            <div className="welcome">

                {(fhirDataCollection === undefined || sharingData) && (
                    <div>
                        <h6>{progressTitle}</h6>
                        <DeterminateProgress progressValue={progressValue}/>
                        <p>{progressMessage}...<span style={{paddingLeft: '10px'}}><CircularProgress
                            size="1rem"/></span></p>
                    </div>
                )}

                <h4 className="title">Assessments</h4>

                {responses && responses.size < 1 ? (
                    <p>No records found.</p>
                ) : (
                    Array.from(responses.entries()).map(([key, bundle], idx) => (
                        <div key={idx}>
                            <h6>{key}</h6>
                            {displayGraph(bundle.qm.isScored, bundle.responses.length) && (
                                <div className="pb-4">
                                    <Line options={getOptions(bundle.qm.id)} data={getData(bundle.responses)} />
                                </div>
                            )}
                            {bundle.responses.map((response, rIdx) => (
                                    <Summary
                                        key={rIdx}
                                        id={rIdx}
                                        rows={[
                                            {
                                                isHeader: true,
                                                twoColumns: bundle.qm.isScored ? true : false,
                                                data1: "Date: " + response.authored.toLocaleDateString(),
                                                data2: "Score: " + response.score,
                                            },
                                            {
                                                isHeader: false,
                                                twoColumns: bundle.qm.isScored ? true : false,
                                                data1: "Source: " + response.source,
                                                data2: response.interpretation ? response.interpretation : "",
                                            },
                                        ]}
                                    />
                            ))}
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};