const NATIONALITIES = [
  "Ugandan",
  "Kenyan",
  "Tanzanian",
  "Burundian",
  "Rwandese",
  "Somali",
  "South Sudanese"
];

const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated"
];

const SETTLEMENT_CAMPS = [
  "Gulu settlement camp",
  "Arua settlement camp",
  "Mbarara settlement camp",
  "Kasese settlement camp",
  "Busia settlement camp",
  "Mbale settlement camp",
  "Kigezi settlement camp"
];

// Normalizes text inputs so validation is not affected by extra spaces.
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Uses JavaScript date parsing for date-based validation rules.
function isValidDate(value) {
  return !Number.isNaN(Date.parse(value));
}

function validateBeneficiary(input) {
  // Build a clean version of the payload before running validation rules.
  const beneficiary = {
    firstName: normalizeText(input.firstName),
    lastName: normalizeText(input.lastName),
    placeOfBirth: normalizeText(input.placeOfBirth),
    dateOfBirth: normalizeText(input.dateOfBirth),
    dateOfRegistration: normalizeText(input.dateOfRegistration),
    gender: normalizeText(input.gender) || "Female",
    dateOfJoiningSettlementCamp: normalizeText(input.dateOfJoiningSettlementCamp),
    nationality: normalizeText(input.nationality),
    maritalStatus: normalizeText(input.maritalStatus),
    settlementCamp: normalizeText(input.settlementCamp)
  };

  const errors = {};

  // Shared required + minimum-length validation for text fields.
  ["firstName", "lastName", "placeOfBirth"].forEach((field) => {
    if (!beneficiary[field]) {
      errors[field] = "This field is required.";
      return;
    }

    if (beneficiary[field].length < 2) {
      errors[field] = "Invalid field";
    }
  });

  if (!beneficiary.dateOfBirth) {
    errors.dateOfBirth = "This field is required.";
  } else if (!isValidDate(beneficiary.dateOfBirth)) {
    errors.dateOfBirth = "Enter a valid date of birth.";
  }

  if (!beneficiary.dateOfRegistration) {
    errors.dateOfRegistration = "This field is required.";
  } else if (!isValidDate(beneficiary.dateOfRegistration)) {
    errors.dateOfRegistration = "Enter a valid date of registration.";
  }

  if (!beneficiary.dateOfJoiningSettlementCamp) {
    errors.dateOfJoiningSettlementCamp = "This field is required.";
  } else if (!isValidDate(beneficiary.dateOfJoiningSettlementCamp)) {
    errors.dateOfJoiningSettlementCamp = "Enter a valid date of joining settlement camp.";
  }

  if (!["Female", "Male"].includes(beneficiary.gender)) {
    errors.gender = "Select a valid gender.";
  }

  if (!NATIONALITIES.includes(beneficiary.nationality)) {
    errors.nationality = "This field is required.";
  }

  if (!MARITAL_STATUSES.includes(beneficiary.maritalStatus)) {
    errors.maritalStatus = "This field is required.";
  }

  if (!SETTLEMENT_CAMPS.includes(beneficiary.settlementCamp)) {
    errors.settlementCamp = "This field is required.";
  }

  // Date of birth must be earlier than the registration date.
  if (!errors.dateOfBirth && !errors.dateOfRegistration) {
    const dateOfBirth = new Date(beneficiary.dateOfBirth);
    const dateOfRegistration = new Date(beneficiary.dateOfRegistration);

    if (dateOfBirth >= dateOfRegistration) {
      errors.dateOfBirth = "Date of birth must be before date of registration.";
    }
  }

  // Joining the settlement camp must happen after registration.
  if (!errors.dateOfJoiningSettlementCamp && !errors.dateOfRegistration) {
    const dateOfJoiningSettlementCamp = new Date(beneficiary.dateOfJoiningSettlementCamp);
    const dateOfRegistration = new Date(beneficiary.dateOfRegistration);

    if (dateOfJoiningSettlementCamp <= dateOfRegistration) {
      errors.dateOfJoiningSettlementCamp = "Date of joining settlement camp must be after date of registration.";
    }
  }

  return {
    beneficiary,
    errors,
    isValid: Object.keys(errors).length === 0
  };
}

function createBeneficiaryRecord(beneficiary) {
  // Each saved record gets a simple generated id and timestamp.
  return {
    id: `BEN-${Date.now()}`,
    ...beneficiary,
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  NATIONALITIES,
  MARITAL_STATUSES,
  SETTLEMENT_CAMPS,
  validateBeneficiary,
  createBeneficiaryRecord
};
