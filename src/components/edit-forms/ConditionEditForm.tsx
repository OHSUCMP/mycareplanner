import * as React from 'react';
// import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom'

import AdapterDateFns from '@mui/lab/AdapterDateFns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DatePicker from '@mui/lab/DatePicker';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ConditionSummary, EditFormData } from '../../data-services/models/cqlSummary';
import { Condition } from '../../data-services/fhir-types/fhir-r4';
import { createSharedDataResource } from '../../data-services/fhirService';

export default function ConditionEditForm(formData?: EditFormData) {
  let history = useHistory()
  // const id = useParams();
  const [description, setDescription] = React.useState<string | null>('')
  const [onsetDate, setStartDate] = React.useState<Date | null>(null)

  const patientID = formData?.supplementalDataClient?.getPatientId()

  const patientName: string | null = null   // TODO: find patient with matching ID from formData?patientSummaries
  const fhirUser = formData?.supplementalDataClient?.getFhirUser()
  const userName: string | null = null   // TODO: find user with matching ID from formData?patientSummaries or CareTeam

  const subjectRef = patientID != null ? {
    reference: 'Patient/' + patientID,
    display: (patientName) ? patientName : undefined
  } : undefined
  var recorderRef = fhirUser != null ? {
    reference: fhirUser!,
    display: (userName) ? userName : undefined
  } : undefined

  const clinicalStatus = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }
    ],
    text: 'Active'
  }
  const verificationStatus = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed'
      }
    ],
    text: 'Confirmed'
  }
  const healthConcernCategory = [
    {
      coding: [
        {
          system: 'http://hl7.org/fhir/us/core/CodeSystem/condition-category',
          code: 'health-concern'
        }
      ],
      text: 'Health Concern'
    }
  ]

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subjectRef === undefined) {
      return
    }

    const code = { text: description ?? 'No description provided' }

    var condition: Condition = {
      resourceType: 'Condition',
      clinicalStatus: clinicalStatus,
      verificationStatus: verificationStatus,
      category: healthConcernCategory,
      code: code,
      subject: subjectRef!,
      recorder: recorderRef,
      asserter: recorderRef,
      recordedDate: new Date().toISOString(),
      onsetDateTime: onsetDate?.toISOString()
    }
    console.log('New Condition: ' + JSON.stringify(condition))

    createSharedDataResource(condition)

    var cs: ConditionSummary = {
      ConceptName: description ?  description : '',
      OnsetDate: onsetDate?.toISOString(),
      RecordedDate: new Date().toISOString(),
      Recorder: undefined,
      Asserter: undefined
    }

    if (formData?.setConditionSummaries && formData.conditionSummaryMatrix) {
      // create a shallow copy
      const updatedConditionSummaries: ConditionSummary[][] =
        [...(formData.conditionSummaryMatrix ? formData.conditionSummaryMatrix : [])]
      // update the copy
      if (updatedConditionSummaries[0]) {
        // add the new condition
        updatedConditionSummaries[0].push(cs)
      } else {
        // if conditionSummaryMatrix is untruthy or has no subarrays,
        // we create a summary as the only (first) ConditionSummary in the matrix
        updatedConditionSummaries[0] = [cs]
      }
      // set the state using the callback
      formData.setConditionSummaries(updatedConditionSummaries)
    }

    history.goBack()
  };

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  };

  return (
    <React.Fragment>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ pt: 3, pr: 4, pl: 4, pb: '100%', bgcolor: '#F7F7F7', width: '100%' }}>
        <Typography variant="h5" gutterBottom>
          Health Concern
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <TextField
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              required
              multiline
              id="description"
              name="description"
              label="Description"
              fullWidth
              minRows={3}
              maxRows={5}
              variant="standard"
            />
          </Grid>

          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="When did it start?"
                value={onsetDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                }}
                renderInput={(params) => <TextField {...params} fullWidth variant="standard" />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, bgcolor: '#355CA8' }}>
              Save
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="reset" fullWidth variant="outlined" sx={{ mt: 3, color: '#355CA8', bgcolor: '#F7F7F7', bordercolor: '#355CA8' }}>
              Cancel
            </Button>
          </Grid>

        </Grid>
      </Box>
    </React.Fragment>
  );
}
