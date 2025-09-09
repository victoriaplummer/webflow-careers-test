"use client";

import { useState, useEffect } from "react";
import type { GreenhouseQuestion } from "../lib/greenhouse";

// Type declarations for SVG elements
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      textarea: React.DetailedHTMLProps<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        HTMLTextAreaElement
      >;
    }
  }
}

interface JobApplicationFormProps {
  ghSlug: string;
  jobId: string;
  jobTitle: string;
}

interface FormData {
  [key: string]: string | File | File[] | string[];
}

interface QuestionsResponse {
  questions: GreenhouseQuestion[];
}

interface SubmitResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export function JobApplicationForm({
  ghSlug,
  jobId,
  jobTitle,
}: JobApplicationFormProps) {
  const [questions, setQuestions] = useState<GreenhouseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({});

  // Fetch questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `/careers-portal/api/questions?ghSlug=${encodeURIComponent(
            ghSlug
          )}&jobId=${encodeURIComponent(jobId)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch application questions");
        }

        const data = (await response.json()) as QuestionsResponse;
        setQuestions(data.questions || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load application form"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [ghSlug, jobId]);

  const handleInputChange = (
    fieldName: string,
    value: string | File | File[] | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFileChange = (fieldName: string, files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      handleInputChange(fieldName, fileArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      submitFormData.append("ghSlug", ghSlug);
      submitFormData.append("jobId", jobId);

      // Add all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle multiple files
          value.forEach((file) => {
            submitFormData.append(key, file);
          });
        } else if (value instanceof File) {
          // Handle single file
          submitFormData.append(key, value);
        } else {
          // Handle text values
          submitFormData.append(key, value);
        }
      });

      const response = await fetch("careers-portal/api/apply", {
        method: "POST",
        body: submitFormData,
      });

      const result = (await response.json()) as SubmitResponse;

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      setSuccess(true);
      setFormData({});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: GreenhouseQuestion) => {
    const questionId = question.id || Math.random(); // Use random ID if not provided
    const isRequired = question.required;

    // Handle questions with nested fields
    if (question.fields && question.fields.length > 0) {
      return (
        <div key={questionId} className="form-control w-full">
          <label className="label">
            <span className="label-text">
              {question.label}
              {isRequired && <span className="text-error"> *</span>}
            </span>
          </label>
          {question.description && (
            <p className="text-sm text-base-content/70 mb-2">
              {question.description}
            </p>
          )}
          <div className="space-y-4">
            {question.fields.map((field, fieldIndex) => {
              const fieldName = field.name;
              const fieldType = field.type;
              const currentValue = formData[fieldName];

              switch (fieldType) {
                case "input_text":
                  return (
                    <div
                      key={`${questionId}-${fieldIndex}`}
                      className="form-control"
                    >
                      <input
                        type="text"
                        name={fieldName}
                        required={isRequired}
                        value={
                          typeof currentValue === "string" ? currentValue : ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange(fieldName, e.target.value)
                        }
                        className="input input-bordered w-full focus:input-primary transition-all duration-200"
                        placeholder={
                          question.description || "Enter your response..."
                        }
                      />
                    </div>
                  );

                case "textarea":
                  return (
                    <div
                      key={`${questionId}-${fieldIndex}`}
                      className="form-control"
                    >
                      <textarea
                        name={fieldName}
                        required={isRequired}
                        value={
                          typeof currentValue === "string" ? currentValue : ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          handleInputChange(fieldName, e.target.value)
                        }
                        className="textarea textarea-bordered w-full min-h-32 resize-y focus:textarea-primary transition-all duration-200 force-text-wrap"
                        placeholder={
                          question.description || "Enter your response here..."
                        }
                      />
                      <div className="label">
                        <span className="label-text-alt text-base-content/50">
                          Feel free to provide detailed information
                        </span>
                      </div>
                    </div>
                  );

                case "input_file":
                  return (
                    <div
                      key={`${questionId}-${fieldIndex}`}
                      className="form-control"
                    >
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          name={fieldName}
                          required={isRequired}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleFileChange(fieldName, e.target.files)
                          }
                          className="file-input file-input-bordered w-full focus:file-input-primary transition-all duration-200"
                          accept=".pdf,.doc,.docx,.txt"
                        />
                      </div>
                      {question.description && (
                        <div className="label">
                          <span className="label-text-alt text-base-content/70 leading-relaxed">
                            {question.description}
                          </span>
                        </div>
                      )}
                    </div>
                  );

                case "multi_value_single_select":
                  return (
                    <div
                      key={`${questionId}-${fieldIndex}`}
                      className="form-control"
                    >
                      <select
                        name={fieldName}
                        required={isRequired}
                        value={
                          typeof currentValue === "string" ? currentValue : ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange(fieldName, e.target.value)
                        }
                        className="select select-bordered w-full focus:select-primary transition-all duration-200"
                      >
                        <option value="">Select an option</option>
                        {field.values?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );

                case "input_hidden":
                  // Skip hidden fields - they're typically auto-filled
                  return null;

                default:
                  return (
                    <div
                      key={`${questionId}-${fieldIndex}`}
                      className="form-control w-full"
                    >
                      <label className="label">
                        <span className="label-text">
                          {field.name} ({fieldType})
                          {isRequired && <span className="text-error"> *</span>}
                        </span>
                      </label>
                      <input
                        type="text"
                        name={fieldName}
                        required={isRequired}
                        value={
                          typeof currentValue === "string" ? currentValue : ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange(fieldName, e.target.value)
                        }
                        className="input input-bordered w-full"
                        placeholder={`Unsupported field type: ${fieldType}`}
                      />
                    </div>
                  );
              }
            })}
          </div>
        </div>
      );
    }

    // Fallback for old structure (shouldn't happen with new API)
    return (
      <div key={questionId} className="form-control w-full">
        <label className="label">
          <span className="label-text">
            {question.label || question.name || "Unknown Question"}
            {isRequired && <span className="text-error"> *</span>}
          </span>
        </label>
        <input
          type="text"
          name={`question_${questionId}`}
          required={isRequired}
          className="input input-bordered w-full"
          placeholder="Unsupported question format"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-4">Loading application form...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap={"round" as const}
                strokeLinejoin={"round" as const}
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap={"round" as const}
                strokeLinejoin={"round" as const}
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Application submitted successfully! We'll be in touch soon.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-8 shadow-sm theme-card">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="alert alert-info max-w-md mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap={"round" as const}
                  strokeLinejoin={"round" as const}
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <h3 className="font-bold">
                  No application questions available
                </h3>
                <div className="text-xs">
                  Please use the "Apply on Greenhouse" button above to apply
                  directly.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap={"round" as const}
                      strokeLinejoin={"round" as const}
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {questions
                    .filter(
                      (q) =>
                        q.label === "First Name" ||
                        q.label === "Last Name" ||
                        q.label === "Email" ||
                        q.label === "Phone"
                    )
                    .map(renderQuestion)}
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap={"round" as const}
                      strokeLinejoin={"round" as const}
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Documents & Links
                </h3>
                <div className="space-y-6">
                  {questions
                    .filter(
                      (q) =>
                        q.label === "Resume/CV" ||
                        q.label === "Cover Letter" ||
                        q.label === "LinkedIn Profile" ||
                        q.label === "Website" ||
                        q.label.includes("portfolio") ||
                        q.label.includes("GitHub")
                    )
                    .map(renderQuestion)}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap={"round" as const}
                      strokeLinejoin={"round" as const}
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Additional Information
                </h3>
                <div className="space-y-6">
                  {questions
                    .filter(
                      (q) =>
                        q.label === "Preferred Pronouns" ||
                        q.label.includes("consent")
                    )
                    .map(renderQuestion)}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="form-control">
                  <button
                    type={"submit" as const}
                    disabled={submitting}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap={"round" as const}
                            strokeLinejoin={"round" as const}
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Submit Application
                      </>
                    )}
                  </button>
                  <p className="text-xs text-base-content/50 mt-2 text-center">
                    By submitting this application, you agree to our privacy
                    policy and terms of service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
