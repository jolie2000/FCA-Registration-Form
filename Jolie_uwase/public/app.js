const form = document.getElementById("beneficiaryForm");
const successAlert = document.getElementById("successAlert");
const closeAlertButton = document.getElementById("closeAlert");

const optionEndpoints = {
  nationality: "nationalities",
  maritalStatus: "maritalStatuses",
  settlementCamp: "settlementCamps"
};

// Uses today's date as the hidden registration date default.
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getFieldContainer(fieldName) {
  const element = form.elements[fieldName];
  if (!element) {
    return null;
  }

  if (element instanceof RadioNodeList) {
    return element[0].closest(".field");
  }

  return element.closest(".field");
}

// Applies the error state and message to a field wrapper.
function setFieldError(fieldName, message) {
  const container = getFieldContainer(fieldName);
  if (!container) {
    return;
  }

  container.classList.add("field-invalid");
  const messageElement = container.querySelector(".error-message");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

// Removes the error state from a single field.
function clearFieldError(fieldName) {
  const container = getFieldContainer(fieldName);
  if (!container) {
    return;
  }

  container.classList.remove("field-invalid");
  const messageElement = container.querySelector(".error-message");
  if (messageElement) {
    messageElement.textContent = "";
  }
}

// Clears all form validation messages before a new submit attempt.
function clearAllErrors() {
  [
    "firstName",
    "lastName",
    "placeOfBirth",
    "dateOfBirth",
    "dateOfRegistration",
    "gender",
    "dateOfJoiningSettlementCamp",
    "nationality",
    "maritalStatus",
    "settlementCamp"
  ].forEach(clearFieldError);
}

// Makes select fields look active once a value has been chosen.
function syncSelectAppearance() {
  ["nationality", "maritalStatus", "settlementCamp"].forEach((fieldName) => {
    const select = form.elements[fieldName];
    if (select) {
      select.classList.toggle("has-value", Boolean(select.value));
    }
  });
}

function resetFormState() {
  // Reset returns the form to its required default state.
  form.reset();
  form.elements.gender.value = "Female";
  form.elements.dateOfRegistration.value = getTodayDate();
  clearAllErrors();
  syncSelectAppearance();
}

function hideSuccessAlert() {
  successAlert.classList.add("hidden");
}

function showSuccessAlert() {
  // Scroll to the top so the user sees the success state immediately.
  successAlert.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Collects the current form values into one object for validation/submission.
function getFormValues() {
  return {
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    placeOfBirth: form.elements.placeOfBirth.value.trim(),
    dateOfBirth: form.elements.dateOfBirth.value,
    dateOfRegistration: form.elements.dateOfRegistration.value,
    gender: form.elements.gender.value || "Female",
    dateOfJoiningSettlementCamp: form.elements.dateOfJoiningSettlementCamp.value,
    nationality: form.elements.nationality.value,
    maritalStatus: form.elements.maritalStatus.value,
    settlementCamp: form.elements.settlementCamp.value
  };
}

function validateForm(values) {
  const errors = {};

  // Shared text field validation.
  ["firstName", "lastName", "placeOfBirth"].forEach((fieldName) => {
    if (!values[fieldName]) {
      errors[fieldName] = "This field is required.";
      return;
    }

    if (values[fieldName].length < 2) {
      errors[fieldName] = "Invalid field";
    }
  });

  // Required-field checks for non-text inputs.
  if (!values.dateOfBirth) {
    errors.dateOfBirth = "This field is required.";
  }

  if (!values.dateOfRegistration) {
    errors.dateOfRegistration = "This field is required.";
  }

  if (!values.dateOfJoiningSettlementCamp) {
    errors.dateOfJoiningSettlementCamp = "This field is required.";
  }

  if (!values.nationality) {
    errors.nationality = "This field is required.";
  }

  if (!values.maritalStatus) {
    errors.maritalStatus = "This field is required.";
  }

  if (!values.settlementCamp) {
    errors.settlementCamp = "This field is required.";
  }

  if (!errors.dateOfBirth && !errors.dateOfRegistration) {
    if (new Date(values.dateOfBirth) >= new Date(values.dateOfRegistration)) {
      errors.dateOfBirth = "Date of birth must be before date of registration.";
    }
  }

  if (!errors.dateOfJoiningSettlementCamp && !errors.dateOfRegistration) {
    if (new Date(values.dateOfJoiningSettlementCamp) <= new Date(values.dateOfRegistration)) {
      errors.dateOfJoiningSettlementCamp =
        "Date of joining settlement camp must be after date of registration.";
    }
  }

  return errors;
}

async function loadOptions() {
  // Fetches dropdown options from the backend so the lists stay in sync.
  const response = await fetch("/api/options");
  const payload = await response.json();

  Object.entries(optionEndpoints).forEach(([fieldName, payloadName]) => {
    const select = form.elements[fieldName];
    payload[payloadName].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  });

  syncSelectAppearance();
}

async function submitForm(values) {
  // Sends the validated form data to the backend API.
  const response = await fetch("/api/beneficiaries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  const payload = await response.json();

  if (!response.ok) {
    return payload.errors || {};
  }

  resetFormState();
  showSuccessAlert();
  return {};
}

function handleRealtimeValidation(event) {
  // Clear field-level errors as the user corrects input.
  clearFieldError(event.target.name);

  if (event.target.tagName === "SELECT") {
    event.target.classList.toggle("has-value", Boolean(event.target.value));
  }
}

form.addEventListener("input", handleRealtimeValidation);
form.addEventListener("change", handleRealtimeValidation);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideSuccessAlert();
  clearAllErrors();

  // Frontend validation runs before the API request is made.
  const values = getFormValues();
  const clientErrors = validateForm(values);

  if (Object.keys(clientErrors).length > 0) {
    Object.entries(clientErrors).forEach(([fieldName, message]) => {
      setFieldError(fieldName, message);
    });
    return;
  }

  const serverErrors = await submitForm(values);
  Object.entries(serverErrors).forEach(([fieldName, message]) => {
    setFieldError(fieldName, message);
  });
});

closeAlertButton.addEventListener("click", () => {
  // Closing the alert restores the form to the clean default state.
  hideSuccessAlert();
  resetFormState();
});

// Set the starting form state and load dropdown data on page load.
resetFormState();

loadOptions().catch(() => {
  ["nationality", "maritalStatus", "settlementCamp"].forEach((fieldName) => {
    setFieldError(fieldName, "Failed to load field options.");
  });
});
