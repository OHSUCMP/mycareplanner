import React, {FC} from 'react';
import {FHIRData} from '../../data-services/models/fhirResources';
import {QuestionnaireResponse} from '../../data-services/fhir-types/fhir-r4';
import { getAvailableQuestionnaires } from '../../data-services/questionnaireService';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {CircularProgress} from "@mui/material";
import { Summary } from './Summary';

interface AssessmentListProps {
    sharingData: boolean;
    fhirDataCollection?: FHIRData[];
    progressTitle: string;
    progressValue: number;
    progressMessage: string;
}

export const AssessmentList: FC<AssessmentListProps> = ({sharingData, fhirDataCollection,
                                                                progressTitle, progressValue, progressMessage}) => {
    process.env.REACT_APP_DEBUG_LOG === "true" && console.log("AssessmentList component RENDERED!");

    const availableQuestionnaires = getAvailableQuestionnaires();

    const bundledResponses: {
        questionnaireResponse: QuestionnaireResponse;
        source: String;
    }[] = [];

    fhirDataCollection?.forEach(data => {
    if (data.questionnaireResponses) {
        data.questionnaireResponses.filter((response: QuestionnaireResponse) => {
            return response.questionnaire && availableQuestionnaires.map(q => q.url).includes(response.questionnaire);
        }).forEach((response: QuestionnaireResponse) => {
            bundledResponses.push({
                questionnaireResponse: response,
                source: data.serverName || ""
            });
        });
    }
    });

    const responses: Record<string, {
        questionnaireResponse: QuestionnaireResponse;
        source: String;
      }[]> = 
      bundledResponses.reduce((groups, item) => {
        const q = item.questionnaireResponse.questionnaire;
        const key = availableQuestionnaires.find(metadataEntry => metadataEntry.url === q)?.label;
        if (key) {
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
        }
        return groups;
    }, {} as Record<string, {questionnaireResponse: QuestionnaireResponse; source: String;}[]>);

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

                {responses && Object.keys(responses).length < 1
                    ? <p>No records found.</p>
                    : Object.keys(responses).map((key, idx) => {
                        return (
                            <div key={idx}>
                                <h6>{key}</h6>
                                {responses[key].map((response, rIdx) => {
                                    const authoredDate = (response.questionnaireResponse.authored) ? new Date(response.questionnaireResponse.authored).toLocaleDateString() : null;
                                    return (
                                        <Summary key={rIdx} id={rIdx} rows={[
                                            {
                                                isHeader: true,
                                                twoColumns: false,
                                                data1: "Date: " + authoredDate || "",
                                                data2: '',
                                            },
                                            {
                                                isHeader: false,
                                                twoColumns: false,
                                                data1: "Source: " + response.source,
                                                data2: '',
                                            },
                                        ]}/>
                                    );
                                })}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};