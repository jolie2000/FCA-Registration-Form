const { getBeneficiaries, saveBeneficiary } = require("../database/database");
const {
  NATIONALITIES,
  MARITAL_STATUSES,
  SETTLEMENT_CAMPS,
  validateBeneficiary,
  createBeneficiaryRecord
} = require("../models/beneficiary");

// Small response helper to keep route handling concise.
function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

// Collects and parses JSON request bodies for POST requests.
function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

async function handleApiRequest(request, response) {
  // Supplies dropdown options to the frontend form.
  if (request.method === "GET" && request.url === "/api/options") {
    sendJson(response, 200, {
      nationalities: NATIONALITIES,
      maritalStatuses: MARITAL_STATUSES,
      settlementCamps: SETTLEMENT_CAMPS
    });
    return;
  }

  // Exposes saved records for inspection or future admin screens.
  if (request.method === "GET" && request.url === "/api/beneficiaries") {
    sendJson(response, 200, { beneficiaries: await getBeneficiaries() });
    return;
  }

  // Validates and stores a new beneficiary registration.
  if (request.method === "POST" && request.url === "/api/beneficiaries") {
    try {
      const payload = await readRequestBody(request);
      const { beneficiary, errors, isValid } = validateBeneficiary(payload);

      if (!isValid) {
        sendJson(response, 400, {
          message: "Validation failed.",
          errors
        });
        return;
      }

      const record = createBeneficiaryRecord(beneficiary);
      await saveBeneficiary(record);

      sendJson(response, 201, {
        message: "Beneficiary registered successfully.",
        beneficiary: record
      });
    } catch (error) {
      sendJson(response, 400, {
        message: "Request body must be valid JSON."
      });
    }

    return;
  }

  // Any unknown API route returns a standard 404 response.
  sendJson(response, 404, {
    message: "Route not found."
  });
}

module.exports = {
  handleApiRequest
};
