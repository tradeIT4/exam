import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api, apiBaseURL, assetUrl } from "../services/api.js";
import tessbinLogo from "../logo/download.png";

const steps = [
  "Personal Information",
  "Training Information",
  "Employment & Assessment",
  "Review & Submit"
];

const fieldGroups = [
  [
    "firstName", "lastName", "grandfatherName", "gender", "age", "nationality", "subCity",
    "woreda", "address", "phoneNumber", "maritalStatus", "physicalDisability", "passportPhoto", "fayadaDigitalId"
  ],
  [
    "occupation", "assessmentLevel", "collegeInstituteName", "institutionType", "trainingStartYear",
    "trainingEndYear", "trainingMode", "trainingType", "cooperativeTraining"
  ],
  ["employmentStatus", "companyCategory", "registerFor", "assessmentType"],
  ["agreementAccepted"]
];

const defaultValues = {
  physicalDisability: "No",
  companyCategory: "Not applicable",
  registerFor: "Both",
  assessmentType: "New Assessment"
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxUploadSize = 2 * 1024 * 1024;

function validateUpload(files) {
  const file = files?.[0];
  if (!file) return "This image is required";
  if (!allowedImageTypes.includes(file.type)) return "Uploaded files must be JPG, PNG, or WEBP";
  if (file.size > maxUploadSize) return "Each uploaded image must be 2 MB or smaller";
  return true;
}

function FieldError({ error }) {
  return error ? <div className="invalid-feedback d-block">{error.message}</div> : null;
}

function Field({ label, error, span = "third", children }) {
  return (
    <div className={`form-field form-field-${span}`}>
      <label className="form-label">{label}</label>
      {children}
      <FieldError error={error} />
    </div>
  );
}

function SelectField({ label, error, span = "third", registerProps, children }) {
  return (
    <Field label={label} error={error} span={span}>
      <select className={`form-select ${error ? "is-invalid" : ""}`} {...registerProps}>{children}</select>
    </Field>
  );
}

function TextField({ label, error, span = "third", registerProps, ...props }) {
  return (
    <Field label={label} error={error} span={span}>
      <input className={`form-control ${error ? "is-invalid" : ""}`} {...registerProps} {...props} />
    </Field>
  );
}

function RadioGroup({ label, error, options, registerProps, span = "half" }) {
  return (
    <Field label={label} error={error} span={span}>
      <div className="choice-row">
        {options.map((option) => (
          <label className="form-check-inline" key={option}>
            <input type="radio" value={option} {...registerProps} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div className="review-item">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

export default function ApplicationRegistration() {
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(null);
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues, mode: "onTouched" });

  const values = watch();
  const photoName = values.passportPhoto?.[0]?.name;
  const fayadaName = values.fayadaDigitalId?.[0]?.name;

  const reviewItems = useMemo(() => [
    ["First Name", values.firstName],
    ["Last Name", values.lastName],
    ["Grandfather Name", values.grandfatherName],
    ["Gender", values.gender],
    ["Age", values.age],
    ["Nationality", values.nationality],
    ["Sub City", values.subCity],
    ["Woreda", values.woreda],
    ["Address", values.address],
    ["Phone Number", values.phoneNumber],
    ["Email", values.email],
    ["Marital Status", values.maritalStatus],
    ["Physical Disability", values.physicalDisability],
    ["Disability Description", values.disabilityDescription],
    ["Passport Photo", photoName],
    ["FAYADA DIGITAL ID", fayadaName],
    ["Occupation", values.occupation],
    ["Assessment Level", values.assessmentLevel],
    ["College/Institute Name", values.collegeInstituteName],
    ["Institution Type", values.institutionType],
    ["Training Start Year", values.trainingStartYear],
    ["Training End Year", values.trainingEndYear],
    ["Training Mode", values.trainingMode],
    ["Training Type", values.trainingType],
    ["Cooperative Training", values.cooperativeTraining],
    ["Employment Status", values.employmentStatus],
    ["Company Name", values.companyName],
    ["Company Category", values.companyCategory],
    ["Register For", values.registerFor],
    ["Assessment Type", values.assessmentType]
  ], [values, photoName, fayadaName]);

  async function goNext() {
    const fields = [...fieldGroups[step]];
    if (step === 0 && values.physicalDisability === "Yes") fields.push("disabilityDescription");
    const isValid = await trigger(fields, { shouldFocus: true });
    if (isValid) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function onSubmit(data) {
    setServerError("");
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "passportPhoto" || key === "fayadaDigitalId") return;
      formData.append(key, value ?? "");
    });
    formData.append("passportPhoto", data.passportPhoto[0]);
    formData.append("fayadaDigitalId", data.fayadaDigitalId[0]);

    try {
      const response = await api.post("/applications", formData);
      setSuccess(response.data);
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;
      const message = serverMessage || (error.request ? `Unable to reach the application server at ${apiBaseURL}. Check your connection and make sure each uploaded image is 2 MB or smaller.` : "Unable to submit application. Please try again.");
      setServerError(status ? `${message} (HTTP ${status})` : message);
    }
  }

  if (success) {
    const passportPhotoUrl = assetUrl(success.uploads?.passportPhoto);
    const fayadaDigitalIdUrl = assetUrl(success.uploads?.fayadaDigitalId);

    return (
      <main className="application-page">
        <div className="application-container application-container-narrow">
          <section className="success-panel text-center mx-auto">
            <CheckCircle2 size={58} className="success-check" />
            <h1>Application Submitted Successfully</h1>
            {success.applicationNumber && <div className="application-number">{success.applicationNumber}</div>}
            <p className="success-note">Your images were saved in MongoDB and loaded below from the application record.</p>
            <div className="submitted-image-grid">
              {passportPhotoUrl && (
                <a href={passportPhotoUrl} target="_blank" rel="noreferrer" className="submitted-image-card">
                  <span>Passport Photo</span>
                  <img src={passportPhotoUrl} alt="Submitted passport" />
                </a>
              )}
              {fayadaDigitalIdUrl && (
                <a href={fayadaDigitalIdUrl} target="_blank" rel="noreferrer" className="submitted-image-card">
                  <span>FAYADA / National ID</span>
                  <img src={fayadaDigitalIdUrl} alt="Submitted FAYADA National ID" />
                </a>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="application-page">
      <div className="application-container">
        <div className="application-shell">
          <aside className="application-sidebar">
            <div className="service-mark"><img src={tessbinLogo} alt="Tessbin logo" /></div>
            <h1>Competency Assessment Registration</h1>
            <p>Complete the application form and review all information before submission.</p>
            <div className="step-list">
              {steps.map((label, index) => (
                <button
                  type="button"
                  className={`step-button ${index === step ? "active" : ""} ${index < step ? "complete" : ""}`}
                  key={label}
                  onClick={() => index < step && setStep(index)}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <section className="application-content">
            <div className="form-heading">
              <span>Step {step + 1} of {steps.length}</span>
              <h2>{steps[step]}</h2>
            </div>

            {serverError && <div className="alert-danger">{serverError}</div>}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {step === 0 && (
                <div className="form-grid">
                  <TextField label="First Name" error={errors.firstName} registerProps={register("firstName", { required: "First name is required" })} />
                  <TextField label="Last Name" error={errors.lastName} registerProps={register("lastName", { required: "Last name is required" })} />
                  <TextField label="Grandfather Name" error={errors.grandfatherName} registerProps={register("grandfatherName", { required: "Grandfather name is required" })} />
                  <SelectField label="Gender" error={errors.gender} registerProps={register("gender", { required: "Gender is required" })}><option value="">Select gender</option><option>Male</option><option>Female</option></SelectField>
                  <TextField label="Age" type="number" error={errors.age} registerProps={register("age", { required: "Age is required", min: { value: 15, message: "Minimum age is 15" } })} />
                  <TextField label="Nationality" error={errors.nationality} registerProps={register("nationality", { required: "Nationality is required" })} />
                  <TextField label="Sub City" error={errors.subCity} registerProps={register("subCity", { required: "Sub city is required" })} />
                  <TextField label="Woreda" error={errors.woreda} registerProps={register("woreda", { required: "Woreda is required" })} />
                  <TextField label="Phone Number" error={errors.phoneNumber} registerProps={register("phoneNumber", { required: "Phone number is required", minLength: { value: 7, message: "Enter a valid phone number" } })} />
                  <TextField label={<span>Email <span className="muted-text">(optional)</span></span>} type="email" span="half" error={errors.email} registerProps={register("email", { pattern: { value: /^\S+@\S+$/i, message: "Enter a valid email" } })} />
                  <SelectField label="Marital Status" span="half" error={errors.maritalStatus} registerProps={register("maritalStatus", { required: "Marital status is required" })}><option value="">Select status</option><option>Single</option><option>Married</option></SelectField>
                  <Field label="Address" error={errors.address} span="full"><textarea className={`form-control ${errors.address ? "is-invalid" : ""}`} rows={2} {...register("address", { required: "Address is required" })} /></Field>
                  <RadioGroup label="Physical Disability" options={["No", "Yes"]} registerProps={register("physicalDisability", { required: true })} />
                  {values.physicalDisability === "Yes" && <TextField label="Disability Description" span="half" error={errors.disabilityDescription} registerProps={register("disabilityDescription", { required: "Disability description is required" })} />}
                  <Field label="Upload Passport Photo (3x4)" error={errors.passportPhoto} span="half"><input className={`form-control ${errors.passportPhoto ? "is-invalid" : ""}`} type="file" accept="image/png,image/jpeg,image/webp" {...register("passportPhoto", { validate: validateUpload })} /></Field>
                  <Field label="Upload FAYADA DIGITAL ID" error={errors.fayadaDigitalId} span="half"><input className={`form-control ${errors.fayadaDigitalId ? "is-invalid" : ""}`} type="file" accept="image/png,image/jpeg,image/webp" {...register("fayadaDigitalId", { validate: validateUpload })} /></Field>
                </div>
              )}

              {step === 1 && (
                <div className="form-grid">
                  <TextField label="Occupation" span="half" error={errors.occupation} registerProps={register("occupation", { required: "Occupation is required" })} />
                  <TextField label="Assessment Level" span="half" error={errors.assessmentLevel} registerProps={register("assessmentLevel", { required: "Assessment level is required" })} />
                  <TextField label="College/Institute Name" span="full" error={errors.collegeInstituteName} registerProps={register("collegeInstituteName", { required: "College or institute name is required" })} />
                  <SelectField label="Institution Type" error={errors.institutionType} registerProps={register("institutionType", { required: "Institution type is required" })}><option value="">Select type</option><option>Government</option><option>Private</option><option>Other</option></SelectField>
                  <TextField label="Training Start Year" type="number" error={errors.trainingStartYear} registerProps={register("trainingStartYear", { required: "Start year is required" })} />
                  <TextField label="Training End Year" type="number" error={errors.trainingEndYear} registerProps={register("trainingEndYear", { required: "End year is required" })} />
                  <SelectField label="Training Mode" error={errors.trainingMode} registerProps={register("trainingMode", { required: "Training mode is required" })}><option value="">Select mode</option><option>Regular</option><option>Extension</option><option>Distance</option><option>Other</option></SelectField>
                  <SelectField label="Training Type" error={errors.trainingType} registerProps={register("trainingType", { required: "Training type is required" })}><option value="">Select type</option><option>Formal</option><option>Non-formal</option></SelectField>
                  <SelectField label="Cooperative Training" error={errors.cooperativeTraining} registerProps={register("cooperativeTraining", { required: "Cooperative training is required" })}><option value="">Select option</option><option>Large scale enterprise</option><option>Medium scale enterprise</option><option>Small scale enterprise</option><option>None</option></SelectField>
                </div>
              )}

              {step === 2 && (
                <div className="form-grid">
                  <SelectField label="Employment Status" span="half" error={errors.employmentStatus} registerProps={register("employmentStatus", { required: "Employment status is required" })}><option value="">Select status</option><option>Self employed</option><option>Government employed</option><option>Private employed</option><option>Unemployed</option></SelectField>
                  <TextField label={<span>Company Name <span className="muted-text">(optional)</span></span>} span="half" registerProps={register("companyName")} />
                  <SelectField label="Company Category" span="half" error={errors.companyCategory} registerProps={register("companyCategory", { required: "Company category is required" })}><option>Not applicable</option><option>Micro and small scale enterprise</option><option>Medium and large enterprise</option></SelectField>
                  <RadioGroup label="Register For" options={["Theory", "Practical", "Both"]} error={errors.registerFor} registerProps={register("registerFor", { required: "Select what to register for" })} />
                  <RadioGroup label="Assessment Type" options={["New Assessment", "Reassessment"]} error={errors.assessmentType} registerProps={register("assessmentType", { required: "Assessment type is required" })} />
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="review-grid">{reviewItems.map(([label, value]) => <ReviewItem key={label} label={label} value={value} />)}</div>
                  <label className="agreement-check">
                    <input type="checkbox" {...register("agreementAccepted", { required: "Confirmation is required" })} />
                    <span>I confirm that the information provided is correct.</span>
                  </label>
                  <FieldError error={errors.agreementAccepted} />
                </div>
              )}

              <div className="wizard-actions">
                <button className="btn-outline-application" type="button" onClick={goBack} disabled={step === 0 || isSubmitting}><ChevronLeft size={18} /> Back</button>
                {step < steps.length - 1 ? (
                  <button className="btn-government" type="button" onClick={goNext}>Next <ChevronRight size={18} /></button>
                ) : (
                  <button className="btn-government" type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="spin-icon" size={18} />} Submit Application</button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}


