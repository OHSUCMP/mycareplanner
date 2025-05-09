library MCCVitalSigns version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for each vital sign data element
define VitalSignsSummary: 
  (List {
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Blood pressure"]), 'Blood Pressure'),
    ReportHomeBP,
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Body height"]), 'Height'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Body weight"]), 'Weight'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Body mass index"]), 'BMI'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Body temperature"]), 'Temperature'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Heart rate"]), 'Heart Rate'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Oxygen saturation"]), 'Oxygen Saturation'),
    DE.ReportHistory(DE.SelectByStatus([Observation: Cx."Respiratory rate"]), 'Respiratory Rate')
  }) Result where Result is not null

/*
The following functions were added to support OHSU Epic data for Home Blood Pressure
that are returned as separate observations.
*/

define "Systolic Blood Pressure":
  DE.SortDescending( [Observation: Cx."Systolic blood pressure"]
    union [Observation: Cx."Epic POC Home Systolic blood pressure"]
    union [Observation: Cx."Epic PROD Home Systolic blood pressure"])

define "Diastolic Blood Pressure":
  DE.SortDescending([Observation: Cx."Diastolic blood pressure"]
    union [Observation: Cx."Epic POC Home Diastolic blood pressure"]
    union [Observation: Cx."Epic PROD Home Diastolic blood pressure"])

// Use when Systolic and Diastolic BP are reported as an independent Observations (not recommended)
define "Combined Blood Pressure Observations":
  "Systolic Blood Pressure" systolicBP
      let DiastolicObs: MatchingDiastolic(systolicBP),
          SystolicValue: Round((systolicBP.value as FHIR.Quantity).value),
          DiastolicValue: Round((MatchingDiastolic(systolicBP).value as FHIR.Quantity).value),
          ResultDate: DE.FindDate(systolicBP)
      where (ToString(SystolicValue) is not null or ToString(DiastolicValue) is not null)
    return {
      "Date": ResultDate,
      "Systolic": SystolicValue,
      "Diastolic": DiastolicValue,
      "Display": Coalesce(ToString(SystolicValue), '-') + '/' + Coalesce(ToString(DiastolicValue), '-') + ' mmHg',
      "Performer": First(systolicBP.performer).display.value,
      "Interpretation": DE.Interpret(systolicBP.value.value, DiastolicObs.value.value),
      "Notes": DE.ToString(systolicBP.note) union DE.ToString(DiastolicObs.note),
      "Provenance": DE.ReportProvenance(systolicBP)
    }

define function MatchingDiastolic(systolicBP FHIR.Observation):
  First(
    "Diastolic Blood Pressure" diastolicBP
      where (diastolicBP.effective as FHIR.dateTime) = (systolicBP.effective as FHIR.dateTime)
  )

define ReportHomeBP:
  FirstHomeBP bp
    where bp.Display is not null
    return {
      DisplayName: 'Home Blood Pressure',
      ConceptName: null,
      Date: ToString(bp.Date),
      ResultText: bp.Display,
      ResultValue: null,
      ResultUnits: null,
      ReferenceRange: null,
      Interpretation: bp.Interpretation,
      Flag: null,
      Performer: bp.Performer,
      Notes: bp.Notes,
      Provenance: bp.Provenance,
      LearnMore: null,
      History: HomeBPHistory
    }

define HomeBPHistory:
  RemainingHomeBP bp
    where bp.Display is not null
    return {
      Date: ToString(bp.Date),
      ResultText: bp.Display,
      Interpretation: bp.Interpretation
    }

define FirstHomeBP:
  First("Combined Blood Pressure Observations")

define RemainingHomeBP:
  "Combined Blood Pressure Observations" bp
    where bp.Date != FirstHomeBP.Date