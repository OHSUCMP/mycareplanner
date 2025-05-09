import '../../Home.css';
import React from 'react';
import { FHIRData, displayPeriod } from '../../data-services/models/fhirResources';
import { CareTeamParticipant, Practitioner, Reference } from '../../data-services/fhir-types/fhir-r4';
import { Summary } from './Summary';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {CircularProgress} from "@mui/material";

interface CareTeamListProps {
  sharingData: boolean;
  fhirDataCollection?: FHIRData[];
  progressTitle: string;
  progressValue: number;
  progressMessage: string;
}

function flatten(arr?: any) {
  return arr?.reduce(function (flat: any, toFlatten: any) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  }, [])
}

function resolve(ref?: Reference, members?: Map<string, Practitioner>) {
  let resourceID: string | undefined = ref?.reference?.split('/').reverse()?.[0]
  return members?.get(resourceID ?? 'missing id')
}

export const CareTeamList: React.FC<CareTeamListProps> = (props: CareTeamListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("CareTeamList component RENDERED!")

  // Combine all participants from all sources into a single array
  const allParticipants: {
    participant: CareTeamParticipant;
    source: String;
    careTeamMembers: Map<string, Practitioner>;
  }[] = [];

  props.fhirDataCollection?.forEach(data => {
    if (data.careTeams) {
      const partArrays = data.careTeams.map(team => team.participant);
      const participants = flatten(partArrays) as CareTeamParticipant[];

      participants.forEach(participant => {
        allParticipants.push({
          participant,
          source: data.serverName || "",
          careTeamMembers: data.careTeamMembers || new Map()
        });
      });
    }
  });

  // Sort participants - missing names will be last
  allParticipants.sort((a, b) => {
    const nameA = resolve(a.participant.member, a.careTeamMembers)?.name?.[0].text
      ?? a.participant.member?.display
      ?? a.participant.member?.reference
      ?? "ZZZ";
    const nameB = resolve(b.participant.member, b.careTeamMembers)?.name?.[0].text
      ?? b.participant.member?.display
      ?? b.participant.member?.reference
      ?? "ZZZ";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="home-view">
      <div className="welcome">

        {(props.fhirDataCollection === undefined || props.sharingData) && (
            <div>
              <h6>{props.progressTitle}</h6>
              <DeterminateProgress progressValue={props.progressValue}/>
              <p>{props.progressMessage}...<span style={{paddingLeft: '10px'}}><CircularProgress
                  size="1rem"/></span></p>
            </div>
        )}

        <h4 className="title">Care Team</h4>

        {allParticipants.length === 0 ? (
          <p>No records found.</p>
        ) : (
          allParticipants.map(({ participant, source, careTeamMembers }, idx) => (
            <Summary key={idx} id={idx} rows={[
              {
                isHeader: true,
                twoColumns: false,
                data1: resolve(participant.member, careTeamMembers)?.name?.[0].text
                  ?? participant.member?.display
                  ?? participant.member?.reference
                  ?? "No name",
                data2: '',
              },
              {
                isHeader: false,
                twoColumns: false,
                data1: "Role: " + (participant.role?.[0].text ?? "No role"),
                data2: '',
              },
              {
                isHeader: false,
                twoColumns: false,
                data1: participant.period === undefined ? '' : "Time Period: " + displayPeriod(participant.period),
                data2: '',
              },
              {
                isHeader: false,
                twoColumns: false,
                data1: "Source: " + source,
                data2: '',
              }
            ]} />
          ))
        )}

      </div>
    </div>
  )
}
