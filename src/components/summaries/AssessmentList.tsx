import React, {FC} from 'react';
import {Link} from 'react-router-dom';
import {FHIRData, QuestionnaireMetadata, displayDate} from '../../data-services/models/fhirResources';
import {Questionnaire, QuestionnaireResponse} from '../../data-services/fhir-types/fhir-r4';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {Accordion, AccordionSummary, AccordionDetails, Typography, Grid, CircularProgress} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Summary, SummaryRowItems } from './Summary';
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
  return new Map(
    Array.from(bundleMap.entries()).sort((a, b) => a[0].localeCompare(b[0])) // Sort by key
  );
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
        },
              scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            unit: 'month',
            format: 'dateFormat',
            displayFormats: {
              millisecond: 'D MMM, h:mm a',
              second: 'D MMM, h:mm a',
              minute: 'D MMM, h:mm a',
              hour: 'D MMM, h:mm a',
              day: 'D MMM',
              week: 'll',
              month: 'M/D/YY',
              quarter: 'll',
              year: 'll'
            },
            tooltipFormat: 'MM-DD-YYYY',
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7
          }
        }]
      }
    };

}

function getData(responses: ResponseBundle[]) {
    return {
        labels: responses.map((response) => response.authored),
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

    function buildRows(bundle: MergedBundle): SummaryRowItems {
        const rows: SummaryRowItems = [];
        const accordion = (
            <Accordion key="history-accordion" style={{boxShadow: 'none', margin: '0', padding: '0'}}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="body2">History of {bundle.qm.label}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {bundle.responses
                            .slice() // make a copy so you don’t mutate the original
                            .sort((a, b) => new Date(b.authored).getTime() - new Date(a.authored).getTime())
                            .map((response, index) => (
                            <React.Fragment key={index}>
                                <Grid item xs={4}>
                                    <Typography variant="body2">
                                        {displayDate(response.authored.toISOString())}
                                    </Typography>
                                </Grid>
                                <Grid item xs={2}>
                                    <Typography variant="body2">
                                        {response.score}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        {response.interpretation}
                                    </Typography>
                                </Grid>
                            </React.Fragment>
                        ))}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
        rows.push({
            isHeader: false,
            twoColumns: false,
            data1: accordion,
            data2: '',
        });
        return rows;
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
                            <h6>{key}{bundle.qm.learnMore && <span className="float-right">
                                <Link to="route" target="_blank"
                                                          onClick={
                                                              (event) => {
                                                                  event.preventDefault();
                                                                  window.open(bundle.qm.learnMore);
                                                              }
                                                          }><i>Learn&nbsp;More</i>
                                </Link>
                                </span>}
                            </h6>
                            {displayGraph(bundle.qm.isScored, bundle.responses.length) && (
                                <div className="pb-4">
                                    <Line options={getOptions(bundle.qm.id)} data={getData(bundle.responses)} />
                                </div>
                            )}
                            <Summary key={idx} id={idx} rows={buildRows(bundle)}/>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};