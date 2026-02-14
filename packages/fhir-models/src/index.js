const patientTemplate = {
  resourceType: "Patient",
  name: [],
  gender: "unknown"
};

const observationTemplate = {
  resourceType: "Observation",
  status: "final",
  code: {},
  valueQuantity: {}
};

module.exports = { patientTemplate, observationTemplate };
