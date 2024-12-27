import * as React from 'react'
import { useHistory } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { FHIRData } from '../../data-services/models/fhirResources'
import { getSupplementalDataClient, updateSharedDataResource } from '../../data-services/fhirService';
import { Practitioner } from '../../data-services/fhir-types/fhir-r4'
interface ShareDataProps {

  fhirDataCollection?: FHIRData[]
 
}

export default function ShareData(props: ShareDataProps) {


  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    getSupplementalDataClient().then(sdsClient => {

      if (sdsClient) {
        props.fhirDataCollection!.forEach((fhirData) => {
        let practitioners = new Array<Practitioner>();
          fhirData?.careTeamMembers?.forEach((value: Practitioner, key: string) => {
            practitioners.push(value);
        });

          if (!fhirData.isSDS) {
            Promise.resolve(updateSharedDataResource(sdsClient, fhirData.patient!, fhirData.serverUrl)).then(() => {
              if (fhirData.encounters) {
                Promise.all(fhirData.encounters!.map(encounter => updateSharedDataResource(sdsClient, encounter, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.conditions) {
                Promise.all(fhirData.conditions!.map(condition => updateSharedDataResource(sdsClient, condition, fhirData.serverUrl))).then(() => { });
              }            
              if (fhirData.goals) {
                Promise.all(fhirData.goals!.map(goal => updateSharedDataResource(sdsClient, goal, fhirData.serverUrl))).then(() => { });
              }             
              if (fhirData.immunizations) {
                Promise.all(fhirData.immunizations!.map(immunization => updateSharedDataResource(sdsClient, immunization, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.medications) {
                Promise.all(fhirData.medications!.map(medication => updateSharedDataResource(sdsClient, medication, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.serviceRequests) {
                Promise.all(fhirData.serviceRequests!.map(serviceRequest => updateSharedDataResource(sdsClient, serviceRequest, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.procedures) {
                Promise.all(fhirData.procedures!.map(procedure => updateSharedDataResource(sdsClient, procedure, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.labResults) {
                Promise.all(fhirData.labResults!.map(labResult => updateSharedDataResource(sdsClient, labResult, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.vitalSigns) {
                Promise.all(fhirData.vitalSigns!.map(vitalSign => updateSharedDataResource(sdsClient, vitalSign, fhirData.serverUrl))).then(() => { });
              }
              if (fhirData.socialHistory) {
                Promise.all(fhirData.socialHistory!.map(socialHistory => updateSharedDataResource(sdsClient, socialHistory, fhirData.serverUrl))).then(() => { });
              }
            });
              // Promise.all(fhirData.surveyResults!.map(surveyResult => updateSharedDataResource(surveyResult,fhirData.serverUrl))).then(() => { }  );
            }
          }
        )
      }
    })
      .catch(error => {
        console.error(error.message);
      });

    history.goBack()

  }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }

  return (
    
    <React.Fragment>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Share Your Health Data
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
            We are collecting this data as part of a research project to evaluate the effectiveness of the MyCarePlanner application.
          </Typography>
            <Typography variant="body1" gutterBottom>
            Your data will be stored in a secure database and will only be shared with the research team, as described in the consent form.
          </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Share Data
          </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="reset" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Cancel
          </Button>
          </Grid>

        </Grid>
      </Box>
    </React.Fragment>
  )
}


 
