import React, { useMemo, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";
import { ClipboardCopy, Wand2, Save, Inbox } from "lucide-react";

interface AdminToolsProps {
  isDark: boolean;
}

type TemplateValue = "reminder_email" | "course_summary" | "grading_rubric";

export default function AdminTools({ isDark }: AdminToolsProps) {
  const [template, setTemplate] = useState<TemplateValue>("reminder_email");
  const [subject, setSubject] = useState<string>("Assignment 2");
  const [due, setDue] = useState<string>("Friday 5pm");
  const [details, setDetails] = useState<string>("Submit via LMS, late penalties apply.");
  const [week, setWeek] = useState<string>("5");
  const [topics, setTopics] = useState<string>("Dynamic Programming, Memoization");
  const [assignment, setAssignment] = useState<string>("Project 1");
  const [criteria, setCriteria] = useState<string>("Correctness, Style, Documentation, Efficiency");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const run = async () => {
    setLoading(true);
    setOutput("");
    const variables: Record<string, string> = {};
    if (template === "reminder_email") {
      variables.subject = subject;
      variables.due = due;
      variables.details = details;
    }
    if (template === "course_summary") {
      variables.week = week;
      variables.topics = topics;
    }
    if (template === "grading_rubric") {
      variables.assignment = assignment;
      variables.criteria = criteria;
    }
    try {
      const res = await fetch(API_ENDPOINTS.adminTemplate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, variables }),
      });
      const data = await res.json();
      setOutput(data.output || "");
    } catch {
      setOutput("Something went wrong while generating the template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!output.trim()) return;
    try {
      const res = await fetch(API_ENDPOINTS.contentSave, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: output, name: "admin", as_markdown: true }),
      });
      const data = await res.json();
      if (data?.saved_path) alert(`Saved: ${data.saved_path}`);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${theme.surface} px-6 sm:px-8 py-6 sm:py-8 space-y-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className={`${theme.pill}`}>AI Templates</span>
            <h2 className={`mt-3 text-2xl font-semibold ${theme.heading}`}>Administrative Assistant</h2>
            <p className={`mt-2 text-sm ${theme.mutedText}`}>
              Generate polished communication and resources for your course with a single click.
            </p>
          </div>
          <button
            onClick={run}
            className={`${theme.primaryButton} px-6 py-3`}
            disabled={loading}
          >
            <Wand2 className="w-4 h-4" />
            {loading ? "Generating..." : "Generate Template"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5 items-start">
          <div className={`${theme.surfaceMuted} p-4 space-y-3`}>
            <label className={`${theme.label}`}>Template Type</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateValue)}
              className={`${theme.input} w-full`}
            >
              <option value="reminder_email">Reminder Email</option>
              <option value="course_summary">Course Summary</option>
              <option value="grading_rubric">Grading Rubric</option>
            </select>
            <p className={`${theme.caption}`}>
              Each template adapts to your inputs and produces ready-to-use content.
            </p>
          </div>

          <div className="space-y-4">
            {template === "reminder_email" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Subject line"
                />
                <input
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Due date"
                />
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Important details"
                />
              </div>
            )}

            {template === "course_summary" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Week number"
                />
                <input
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Topics covered"
                />
              </div>
            )}

            {template === "grading_rubric" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Assignment name"
                />
                <input
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  className={`${theme.input}`}
                  placeholder="Criteria list"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {output ? (
        <Section
          title="Generated Output"
          gradient="from-indigo-500 via-purple-500 to-cyan-500"
          icon={<Inbox className="w-5 h-5" />}
          description="Copy or save the output to reuse in future courses."
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className={theme.secondaryButton}
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy
            </button>
            <button onClick={save} className={theme.primaryButton}>
              <Save className="w-4 h-4" />
              Save to History
            </button>
          </div>
          <div className={`${theme.surfaceMuted} p-5 mt-4`}>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {output}
            </pre>
          </div>
        </Section>
      ) : (
        <div className={`${theme.surfaceMuted} px-6 py-5 text-sm ${theme.mutedText}`}>
          The generated content will appear here. Fill in your template details and click{" "}
          <span className="font-semibold text-indigo-500 dark:text-indigo-300">Generate Template</span>.
        </div>
      )}
    </div>
  );
}


