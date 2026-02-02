library MCCMedications version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for each MedicationRequest data element.
define MedicationSummary:
  DE.ReportMedications(ActiveMedications, 'Active Medications')

// View summary tuple for each MedicationRequest data element, grouped by MCC value sets.
define MCCMedicationSummary:
  flatten {
    DE.ReportMedications("ACEis and ARBs", 'ACEis and ARBs'),
    DE.ReportMedications("Erythropoiesis Stimulating Agent", 'Erythropoiesis Stimulating Agent'),
    DE.ReportMedications("Iron Supplement", 'IronSupplement'),
    DE.ReportMedications("Phosphate Binders", 'Phosphate Binders'),
    DE.ReportMedications("Vitamin D", 'Vitamin D')
  }

define function SelectActiveMedicationRequests(medRequests List<MedicationRequest>):
  medRequests MedReq
    where MedReq.status in {'active'}

define ActiveMedications:
  (SelectActiveMedicationRequests([MedicationRequest])) M
    sort by authoredOn.value descending

// FHIR MedicationRequest resources with active status.

define "ACEis and ARBs":
  SelectActiveMedicationRequests([MedicationRequest: Cx."ACEis and ARBs"])

define "Erythropoiesis Stimulating Agent":
  SelectActiveMedicationRequests([MedicationRequest: Cx."Erythropoiesis Stimulating Agent"])

define "Iron Supplement":
  SelectActiveMedicationRequests([MedicationRequest: Cx."Iron Supplement"])

define "Phosphate Binders":
  SelectActiveMedicationRequests([MedicationRequest: Cx."Phosphate Binders"])

define "Vitamin D":
  SelectActiveMedicationRequests([MedicationRequest: Cx."Vitamin D"])
