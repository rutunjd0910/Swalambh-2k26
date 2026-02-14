const express = require("express");

const app = express();
app.use(express.json({ limit: "5mb" }));

function validate(extracted) {
  const warnings = [];

  if (extracted.age !== null && (extracted.age < 0 || extracted.age > 120)) {
    warnings.push("age_out_of_range");
  }

  if (extracted.bloodPressure) {
    const { systolic, diastolic } = extracted.bloodPressure;
    if (systolic < 60 || systolic > 250) warnings.push("bp_systolic_out_of_range");
    if (diastolic < 30 || diastolic > 150) warnings.push("bp_diastolic_out_of_range");
  }

  if (extracted.lab && extracted.lab.value < 0) {
    warnings.push("lab_value_negative");
  }

  return { extracted, warnings };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/validate", (req, res) => {
  const { documentId, extracted, trace } = req.body || {};
  if (!extracted) {
    return res.status(400).json({ error: "extracted is required" });
  }

  const result = validate(extracted);

  res.json({
    documentId,
    validated: result.extracted,
    warnings: result.warnings,
    trace
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "validation" });
});

const port = process.env.PORT || 3004;
app.listen(port, () => {
  console.log(`Validation service listening on ${port}`);
});
