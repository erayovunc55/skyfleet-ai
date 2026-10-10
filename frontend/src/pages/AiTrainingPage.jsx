import { useEffect, useMemo, useState } from "react";
import "../styles/ai-training.css";
import aiTrainingService from "../services/aiTrainingService";

const EMPTY_FORM = {
  question: "",
  answer: "",
  category: "",
  country: "",
  city: "",
  airport_code: "",
  language: "en",
  priority: "normal",
  status: "active",
};

export default function AiTrainingPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  async function loadEntries() {
    try {
      setLoading(true);
      setError("");

      const response = await aiTrainingService.list();

      setEntries(
        Array.isArray(response?.data)
          ? response.data
          : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Training records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.question.trim()) {
      setError("Question is required.");
      return;
    }

    if (!form.answer.trim()) {
      setError("Correct answer is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        airport_code:
          form.airport_code.trim().toUpperCase() ||
          null,
        category:
          form.category.trim() || null,
        country:
          form.country.trim() || null,
        city:
          form.city.trim() || null,
      };

      if (editingId) {
        await aiTrainingService.update(
          editingId,
          payload,
        );

        setSuccess(
          "AI training record updated successfully.",
        );
      } else {
        await aiTrainingService.create(payload);

        setSuccess(
          "New knowledge taught to Skyfleet AI.",
        );
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      console.error(err);

      const validationErrors =
        err?.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)?.[0]?.[0];

        setError(
          firstError ||
            "Validation error.",
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "The training record could not be saved.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry) {
    setEditingId(entry.id);

    setForm({
      question: entry.question || "",
      answer: entry.answer || "",
      category: entry.category || "",
      country: entry.country || "",
      city: entry.city || "",
      airport_code:
        entry.airport_code || "",
      language: entry.language || "en",
      priority:
        entry.priority || "normal",
      status: entry.status || "active",
    });

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this AI training record?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await aiTrainingService.remove(id);

      setSuccess(
        "Training record deleted.",
      );

      if (editingId === id) {
        resetForm();
      }

      await loadEntries();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Training record could not be deleted.",
      );
    }
  }

  const filteredEntries = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return entries;
    }

    return entries.filter((entry) => {
      const searchable = [
        entry.question,
        entry.answer,
        entry.category,
        entry.country,
        entry.city,
        entry.airport_code,
        entry.language,
        entry.priority,
        entry.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [entries, search]);

  return (
  <div
  className="ai-training-page"
  style={{
    padding: 24,
    maxWidth: 1500,
    margin: "0 auto",
  }}
>
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
          }}
        >
          🧠 Skyfleet AI Training Center
        </h1>

        <p
          style={{
            marginTop: 8,
            opacity: 0.7,
          }}
        >
          Teach operational knowledge,
          procedures and rules to the
          Skyfleet AI Assistant.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            background: "#dcfce7",
            color: "#166534",
          }}
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
            }}
          >
            {editingId
              ? `Edit Training #${editingId}`
              : "Teach AI"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="meeting_point"
              style={inputStyle}
            />
          </label>

          <label>
            Country
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Turkey"
              style={inputStyle}
            />
          </label>

          <label>
            City
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Istanbul"
              style={inputStyle}
            />
          </label>

          <label>
            Airport
            <input
              name="airport_code"
              value={form.airport_code}
              onChange={handleChange}
              placeholder="IST"
              maxLength={10}
              style={inputStyle}
            />
          </label>

          <label>
            Language
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="en">
                English
              </option>
              <option value="tr">
                Turkish
              </option>
              <option value="es">
                Spanish
              </option>
              <option value="de">
                German
              </option>
              <option value="fr">
                French
              </option>
              <option value="ar">
                Arabic
              </option>
            </select>
          </label>

          <label>
            Priority
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="low">
                Low
              </option>
              <option value="normal">
                Normal
              </option>
              <option value="high">
                High
              </option>
              <option value="critical">
                Critical
              </option>
            </select>
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="active">
                Active
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="inactive">
                Inactive
              </option>
            </select>
          </label>
        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          <label>
            Question / Situation
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              placeholder="Example: Passenger cannot find the driver at Istanbul Airport."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          <label>
            Correct Answer / Procedure
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              placeholder="Write the correct Skyfleet procedure..."
              rows={7}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "11px 18px",
              border: 0,
              borderRadius: 8,
              cursor: saving
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Save Correction"
                : "Save & Teach AI"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </form>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
              }}
            >
              Knowledge Base
            </h2>

            <div
              style={{
                opacity: 0.65,
                marginTop: 5,
              }}
            >
              {entries.length} training
              record(s)
            </div>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search knowledge..."
            style={{
              ...inputStyle,
              maxWidth: 320,
            }}
          />
        </div>

        {loading ? (
          <div>
            Loading training records...
          </div>
        ) : filteredEntries.length ===
          0 ? (
          <div>
            No training records found.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    ID
                  </th>
                  <th style={thStyle}>
                    Question
                  </th>
                  <th style={thStyle}>
                    Category
                  </th>
                  <th style={thStyle}>
                    Location
                  </th>
                  <th style={thStyle}>
                    Priority
                  </th>
                  <th style={thStyle}>
                    Status
                  </th>
                  <th style={thStyle}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map(
                  (entry) => (
                    <tr key={entry.id}>
                      <td
                        style={tdStyle}
                      >
                        {entry.id}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          minWidth: 300,
                        }}
                      >
                        <strong>
                          {entry.question}
                        </strong>

                        <div
                          style={{
                            marginTop: 6,
                            opacity: 0.65,
                            fontSize: 13,
                          }}
                        >
                          {entry.answer
                            ?.length > 160
                            ? `${entry.answer.slice(
                                0,
                                160,
                              )}...`
                            : entry.answer}
                        </div>
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {entry.category ||
                          "-"}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {[
                          entry.country,
                          entry.city,
                          entry.airport_code,
                        ]
                          .filter(Boolean)
                          .join(" / ") ||
                          "-"}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {entry.priority}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {entry.status}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                entry,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                entry.id,
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  font: "inherit",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom:
    "1px solid #e5e7eb",
  fontSize: 13,
};

const tdStyle = {
  padding: "12px 10px",
  borderBottom:
    "1px solid #f1f5f9",
  verticalAlign: "top",
  fontSize: 14,
};