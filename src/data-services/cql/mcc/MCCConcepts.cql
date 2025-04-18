library MCCConcepts version '1.0.0'

// ## Code Systems ##

codesystem "LOINC": 'http://loinc.org'
codesystem "SNOMEDCT": 'http://snomed.info/sct'
codesystem "Race": 'urn:oid:2.16.840.1.113883.6.238'

codesystem "Epic POC": 'urn:oid:1.2.840.114350.1.13.135.3.7.2.707679'
codesystem "Epic PROD": 'urn:oid:1.2.840.114350.1.13.135.2.7.2.707679'

// ## Value sets ##

// ******************************
// Condition value sets
// ******************************

//
// Arthritis Conditions
//
valueset "Arthritis Disorders": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.81'
valueset "Infectious Arthritis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.654'
valueset "Osteoarthritis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.648'
valueset "Psoriatic Arthritis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.587'
valueset "Reactive Arthritis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.588'
valueset "Rheumatoid Arthritis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.651'

//
// Cardiovascular Conditions
//
valueset "Acute Coronary Syndromes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3157.2000.10'
valueset "Acute Myocardial Infarction": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.666.5.3011'
valueset "American Heart Association Heart Failure Stage": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.581'
valueset "Aneurysm": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.627'
valueset "Angina": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.608'
valueset "Aortic Disease": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.636'
valueset "Arrhythmia": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.366'
valueset "Atherosclerotic Cardiovascular Disease": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.584'
valueset "Cardiomyopathy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.579'
valueset "Carotid Stenosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.639'
valueset "Cerebrovascular Disease": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1524'
valueset "Congestive heart failure Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.369'
valueset "Coronary Artery Disease No MI": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1540'
valueset "Heart Failure": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1543'
valueset "Hypertension, Persistent": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1563'
valueset "Hypertension, Primary and Secondary": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.571'
valueset "Hypertension Stage": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.566'
valueset "Hypertension, Essential or Primary": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1484'
valueset "Hypertension, Pulmonary Hypertension": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.569'
valueset "Hypertension, Secondary": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.642'
valueset "Intracranial Stenosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.614'
valueset "Ischemic Heart Disease": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.615'
valueset "Left Ventricular Hypertrophy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.580'
valueset "NYHA Heart Failure Functional Classifications": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.27'
valueset "Peripheral Vascular Disease": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1488'
valueset "Postural tachycardia syndrome (POTS) Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.645'
valueset "Pulmonary Edema": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.611'
valueset "Stroke History": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.104.12.1017'

//
// Chronic Kidney Disease (CKD) Conditions
//
valueset "Acute Renal Failure": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1534'
valueset "Chronic Kidney Disease All Stages": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.157'
valueset "Chronic Kidney Disease Type or Cause": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.6'

//
// Cognitive and Neurological Conditions
//


//
// Diabetes Conditions
//
valueset "Acanthosis Nigricans": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.556'
valueset "Amputated Limb (Not Traumatic)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.563'
valueset "Blindness": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.115.12.1089'
valueset "Cataract of the eye": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.498'
valueset "Cellulitis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.533'
valueset "Charcot Foot": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.531'
valueset "Complication due to Diabetes Mellitus": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1537'
valueset "Diabetic Coma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.482'
valueset "Diabetic Foot": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.523'
valueset "Diabetic Foot Ulcer": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.526'
valueset "Diabetic hand/ Diabetic cheiroarthropathy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.535'
valueset "Diabetic Neuropathy Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.33'
valueset "Diabetic Peripheral Angiopathy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.492'
valueset "Diabetic Retinopathy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.327'
valueset "Dupuytren's Contracture": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.546'
valueset "Emotional Distress caused by Chronic Condition": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.508'
valueset "Eruptive Xanthomatosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.557'
valueset "Gangrene": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.543'
valueset "Gestational Diabetes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.90'
valueset "Hyperglycemic Hyperosmolar Nonketotic Syndrome HHNS": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.517'
valueset "Hypoglycemia unawareness": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.514'
valueset "Hypoglycemic event": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.513'
valueset "Ketoacidosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.520'
valueset "Maturity Onset Diabetes of the Young (MODY)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.420'
valueset "Necrobiosis Lipoidica (Skin Lesions)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.540'
valueset "Periodontitis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.560'
valueset "Prediabetes (borderline diabetes)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.419'
valueset "Rubeosis Iridis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.501'
valueset "Scleroderma or Thick Skin Syndrome": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.549'
valueset "Type 1 Diabetes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1020'
valueset "Type II Diabetes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1021'

//
// Digestive System/Gastrointestinal Conditions
//

//
// Dissimilar Conditions
//

//
// Functional Health Conditions
//

//
// Genitourinary Conditions
//

//
// Hormonal Conditions
//

//
// Infectious Disease Conditions
//

//
// Long Covid Diagnosis Condition
//

//
// Mental Health Conditions
//
valueset "Anxiety": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.52'
valueset "Bipolar Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.600.450'
valueset "Depression Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.600.145'
valueset "Dysthymia": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.67.1.101.1.254'
valueset "Experience of Traumatic Events": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.590'
valueset "Grief or Loss": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.690'
valueset "Major Depression": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.105.12.1007'
valueset "Post Partum Depression": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.681'
valueset "PostTraumatic Stress Disorder PTSD": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.103'
valueset "Psychological Trauma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.687'
valueset "Psychotic Depression": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.678'
valueset "Seasonal Affective Disorder": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.684'
valueset "Suicide Risk": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.693'

//
// Musculoskeletal Conditions
//

//
// Nutrition / Metabolic Conditions
//
valueset "Alkaline Phosphatase Deficiency Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.93'
valueset "Anemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.53'
valueset "Familial Hypercholesterolemia": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1047.100'
valueset "Gout": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.586'
valueset "Hypercalcemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.60'
valueset "Hyperkalemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.50'
valueset "Hyperlipidemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.73'
valueset "Hyperphosphatemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.66'
valueset "Hypertriglyceridemia": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.742'
valueset "Hyperuricemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.85'
valueset "Hypoalbuminemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.47'
valueset "Hypocalcemia Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.61'
valueset "Malnutrition Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1517'
valueset "Metabolic Acidosis Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.70'
valueset "Metabolic syndrome": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1561'
valueset "Obesity Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.36'
valueset "Vitamin D Deficiency Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.90'

//
// Pain Conditions
//
valueset "Chronic Pain Conditions": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.76'
valueset "Low Back Pain": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1558'
valueset "Migraine": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1552'
valueset "Chronic Tension-type Headache diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1555'
valueset "Neuropathic Pain (Neuralgia)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.663'
valueset "Phantom Pain": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.669'

//
// Respiratory Conditions
//
valueset "Asthma Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1472'
valueset "Bronchiectasis Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1463'
valueset "Chronic obstructive pulmonary disease (COPD) Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1466'
valueset "Interstitial lung disease Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1469'
valueset "Pulmonary embolism Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1481'
valueset "Sleep Apnea Disorders": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.102'

//
// Social Determinants of Health Conditions
//
valueset "Social Determinants of Health": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1196.788'


// ******************************
// Lab result value sets
// ******************************

// MCC eCare Plan IG value sets
valueset "24 Hour Urine Protein Excretion": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.792'
valueset "24 Hour Urine Volume": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.791'
valueset "Alanine Aminotransferase (ALT), Bld/Ser/Plas": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5001'
valueset "Albumin in Blood, Plasma, or Serum": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.151'
valueset "Aldosterone/Renin Ratio": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.811'
valueset "Alkaline Phosphatase (Alp) in Blood, Serum or Plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.805'
valueset "Anion Gap": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.153'
valueset "Arterial Blood Gas (ABG)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1575'
valueset "Aspartate Aminotransferase (AST), Ser/Plas": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5006'
valueset "Aspartate Transaminase or Alanine Aminotransferase Ratio": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.804'
valueset "B Type Natriuretic Peptide [Bnp] in Blood, Serum or Plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.795'
valueset "Bicarbonate in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.130'
valueset "Bilirubin, Total, Bld/Ser/Plas": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5007'
valueset "Blood Ethanol Level": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.813'
valueset "Blood Urea Nitrogen": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.113'
valueset "Bone Biopsy Report": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.870'
valueset "C reactive Protein (CRP), Bld/Ser/Plas": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5015'
valueset "Calcium (Not Corrected for Serum Albumin) in Blood, Plasms, or Serum": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.794'
valueset "Cerebral Spinal Fluid (CSF) Analysis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1573'
valueset "Chloride in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.132'
valueset "Coagulation Assay (PT, aPTT, Fibrinogen)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1576'
valueset "Complete Blood Count (with Diff)": 'http://cts.nlm.nih.gov/fhir/ValueSet/1.3.6.1.4.1.6997.4.1.2.271.13.38167.1.1.999.594'
valueset "Comprehensive Metabolic Panel (CMP)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1574'
valueset "Corrected Calcium": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.122'
valueset "COVID 19 (SARS CoV 2), SARS CoV, Influenza virus A and B Tests": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1580'
valueset "Creatine Kinase (CK, CK MB) in Blood, Serum, or Plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1579'
valueset "Creatinine in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.111'
valueset "Cystatin C": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.138'
valueset "D Dimer Test": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1577'
valueset "Drugs of Abuse Screen": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1597'
valueset "Erythrocyte Distribution Width": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.147'
valueset "Erythrocyte Sedimentation Rate (ESR), Blood": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5019'
valueset "Estimated Average Glucose": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.150'
valueset "Estimated Glomerular Filtration Rate (eGFR)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.179'
valueset "Estimated Glomerular Filtration Rate NKF": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.6929.3.1000'
valueset "Fasting Blood Glucose": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.808'
valueset "Ferritin": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.140'
valueset "Free T4 (Thyroxine) Test": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.7643.2.1019'
valueset "Gamma Glutamyl Transpeptidase (Ggt) in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.806'
valueset "Gastric Tissue Biopsy Report": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.869'
valueset "Glucose Tolerance Test Results": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.94'
valueset "Hematocrit": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.143'
valueset "Hemoglobin": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.114'
valueset "Hemoglobin A1C": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.119'
valueset "High Density Lipoprotein": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.135'
valueset "High Sensitivity Troponin": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.801'
valueset "INR": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.213'
valueset "Intact Parathyroid Hormone": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.129'
valueset "Iron Saturation (Transferrin Saturation/TSAT)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.118'
valueset "Kidney Biopsy Report": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.864'
valueset "KT/V Hemodialysis Ratio": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.128'
valueset "Low Density Lipoprotein": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1568'
valueset "Mean Corpuscular Hemoglobin Concentration": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.145'
valueset "Mean Corpuscular Volume": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.144'
valueset "Microorganisms Detection by Blood Culture": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1581'
valueset "Microorganisms Detection by Sputum Culture": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1582'
valueset "Muscle Biopsy Report": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.868'
valueset "N Terminal Pro_B_Type Natriuretic Peptide [Nt_Probnp] in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.797'
valueset "Oxygen Saturation, Blood": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5033'
valueset "Phosphorus in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.123'
valueset "Platelet Count": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.146'
valueset "Platelet Distribution Width": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.148'
valueset "Platelet Mean Volume": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.149'
valueset "Potassium in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.120'
valueset "Procalcitonin in Blood, Serum, or Plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.1578'
valueset "Random Blood Glucose Test": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.809'
valueset "Red Blood Cell Count (Erythrocytes)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.141'
valueset "Serum Rheumatoid Factor": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.812'
valueset "Skin Biopsy Report": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.867'
valueset "Sodium in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.131'
valueset "Thyroid Stimulating Hormone (TSH) Test": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.7643.3.1024'
valueset "Total Carbon Dioxide or Bicarbonate in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.793'
valueset "Total Cholesterol": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.139'
valueset "Triglyceride in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.137'
valueset "Triiodothyronine in serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.807'
valueset "Troponin I, Bld/Ser/Plas": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5061'
valueset "Troponin T, Bld/Ser/Pla": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.3616.200.110.102.5062'
valueset "Urea Reduction Ratio": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.819'
valueset "Uric Acid (Urate) in blood, serum or plasma": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.810'
valueset "Urine Albumin Creatinine Ratio": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.6929.2.1002'
valueset "Urine Protein to Creatinine Ratio (UPCR)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.790'
valueset "Urine Sediment": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.176'
valueset "Urine Urea Nitrogen": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.154'
valueset "Uroflowmetry": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.823'
valueset "Vitamin D Levels": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.126'
valueset "White Blood Cell (Leukocytes) Count": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1222.142'

// ******************************
// Medication value sets
// ******************************
valueset "ACEis and ARBs": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1213.11'
valueset "Erythropoiesis Stimulating Agent": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1196.307'
valueset "Iron Supplement": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1196.308'
valueset "Phosphate Binders": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1196.305'
valueset "Vitamin D": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1196.306'


//Iron Supplement

// ******************************
// ## Individual codes ##
// ******************************

// list individual codes from code systems used directly in the CQL logic. Individual codes are used when there is
// a single code from a particular vocabulary standard used to represent a clinical concept. It is considered
// best-practice not to create value sets containing a single code.

code "Black or African American": '2054-5' from "Race" display 'Black or African American'
code "White": '2106-3' from "Race" display 'White'

code "Left (qualifier value)": '7771000' from "SNOMEDCT" display 'Left (qualifier value)'
code "Right (qualifier value)": '24028007' from "SNOMEDCT" display 'Right (qualifier value)'

code "Blood pressure": '85354-9' from "LOINC" display 'Blood pressure systolic and diastolic'
code "Blood pressure home reading": '72076-3' from "LOINC" display 'Blood pressure home reading'
code "Systolic blood pressure": '8480-6' from "LOINC" display 'Systolic blood pressure'
code "Diastolic blood pressure": '8462-4' from "LOINC" display 'Diastolic blood pressure'
code "Heart rate": '8867-4' from "LOINC" display 'Heart rate'
code "Oxygen saturation": '2708-6' from "LOINC" display 'Oxygen saturation'
code "Pulse oximetry": '59408-5' from LOINC display 'Oxygen saturation in Arterial blood by Pulse oximetry'
code "Respiratory rate": '9279-1' from "LOINC" display 'Respiratory rate'
code "Body temperature": '8310-5' from "LOINC" display 'Body temperature'
code "Body height": '8302-2' from "LOINC" display 'Body height'
code "Body weight": '29463-7' from "LOINC" display 'Body weight'
code "Body mass index": '39156-5' from "LOINC" display 'Body mass index'
code "Inhaled oxygen flow rate": '3151-8' from "LOINC" display 'Inhaled oxygen flow rate'

code "Epic POC Home Systolic blood pressure": '7585' from "Epic POC" display 'Systolic blood pressure'
code "Epic POC Home Diastolic blood pressure": '7586' from "Epic POC" display 'Diastolic blood pressure'
code "Epic PROD Home Systolic blood pressure": '7585' from "Epic PROD" display 'Systolic blood pressure'
code "Epic PROD Home Diastolic blood pressure": '7586' from "Epic PROD" display 'Diastolic blood pressure'