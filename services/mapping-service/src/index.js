const express = require("express");
const mappingConfig = require("@fhir-flow/mapping-config");
const { patientTemplate, observationTemplate } = require("@fhir-flow/fhir-models");

const app = express();
app.use(express.json({ limit: "5mb" }));

function mapToPatient(extracted, trace) {
  // ALWAYS create a patient resource if we have ANY data
  const patientName = extracted.patientName || "Unknown Patient";
  
  return {
    ...patientTemplate,
    id: `patient-${Date.now()}`,
    name: [{ text: patientName }],
    gender: extracted.gender || "unknown",
    birthDate: extracted.age ? null : null,
    extension: [
      {
        url: "traceability",
        valueString: JSON.stringify({ trace })
      },
      {
        url: "extracted-age",
        valueInteger: extracted.age || null
      }
    ].filter(ext => ext.valueInteger !== null || ext.valueString)
  };
}

function mapToObservations(extracted, trace) {
  const observations = [];
  
  // Map all lab tests if available
  if (extracted.labTests) {
    Object.entries(extracted.labTests).forEach(([testName, testData]) => {
      observations.push({
        ...observationTemplate,
        id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code: { text: testName.replace(/_/g, ' ') },
        valueQuantity: {
          value: testData.value,
          unit: testData.unit || "unknown"
        },
        extension: [{
          url: "traceability",
          valueString: JSON.stringify({ trace, raw: testData.raw })
        }]
      });
    });
  }
  
  // Backwards compatibility - map legacy 'lab' field
  if (extracted.lab && observations.length === 0) {
    observations.push({
      ...observationTemplate,
      id: `obs-${Date.now()}`,
      code: { text: extracted.lab.testName },
      valueQuantity: {
        value: extracted.lab.value,
        unit: extracted.lab.unit || "unknown"
      },
      extension: [{
        url: "traceability",
        valueString: JSON.stringify({ trace })
      }]
    });
  }
  
  // Map blood pressure if available
  if (extracted.bloodPressure) {
    observations.push({
      ...observationTemplate,
      id: `obs-bp-${Date.now()}`,
      code: { text: "Blood Pressure" },
      component: [
        {
          code: { text: "Systolic" },
          valueQuantity: { value: extracted.bloodPressure.systolic, unit: "mmHg" }
        },
        {
          code: { text: "Diastolic" },
          valueQuantity: { value: extracted.bloodPressure.diastolic, unit: "mmHg" }
        }
      ],
      extension: [{
        url: "traceability",
        valueString: JSON.stringify({ trace })
      }]
    });
  }
  
  return observations;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/map", (req, res) => {
  const { documentId, validated, warnings, trace } = req.body || {};
  if (!validated) {
    return res.status(400).json({ error: "validated is required" });
  }

  const patient = mapToPatient(validated, trace);
  const observations = mapToObservations(validated, trace);

  res.json({
    documentId,
    fhirVersion: mappingConfig.fhirVersion,
    warnings,
    resources: [patient, ...observations].filter(Boolean)
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mapping" });
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`Mapping service listening on ${port}`);
});
