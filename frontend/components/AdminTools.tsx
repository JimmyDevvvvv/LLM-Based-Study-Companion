"use client";

import React, { useState } from "react";
import Section from "./Section";

export default function AdminTools({ isDark }: { isDark: boolean }) {
  const [template, setTemplate] = useState<string>('reminder_email');
  const [subject, setSubject] = useState<string>('Assignment 2');
  const [due, setDue] = useState<string>('Friday 5pm');
  const [details, setDetails] = useState<string>('Submit via LMS, late penalties apply.');
  const [week, setWeek] = useState<string>('5');
  const [topics, setTopics] = useState<string>('Dynamic Programming, Memoization');
  const [assignment, setAssignment] = useState<string>('Project 1');
  const [criteria, setCriteria] = useState<string>('Correctness, Style, Documentation, Efficiency');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const run = async () => {
    setLoading(true);
    setOutput('');
    const variables: any = {};
    if (template === 'reminder_email') { variables.subject = subject; variables.due = due; variables.details = details; }
    if (template === 'course_summary') { variables.week = week; variables.topics = topics; }
    if (template === 'grading_rubric') { variables.assignment = assignment; variables.criteria = criteria; }
    try {
      const res = await fetch('http://127.0.0.1:5000/admin/template', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, variables })
      });
      const data = await res.json();
      setOutput(data.output || '');
    } catch (e) { setOutput('Error.'); } finally { setLoading(false); }
  };

  const save = async () => {
    if (!output.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/content/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: output, name: 'admin', as_markdown: true }) });
      const data = await res.json();
      if (data && data.saved_path) alert(`Saved: ${data.saved_path}`);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm">Template:</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`}>
          <option value="reminder_email">Reminder Email</option>
          <option value="course_summary">Course Summary</option>
          <option value="grading_rubric">Grading Rubric</option>
        </select>
        <button onClick={run} className={`px-4 py-2 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`} disabled={loading}>
          Generate
        </button>
      </div>

      {template === 'reminder_email' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Subject" />
          <input value={due} onChange={(e) => setDue(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Due" />
          <input value={details} onChange={(e) => setDetails(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Details" />
        </div>
      )}
      {template === 'course_summary' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={week} onChange={(e) => setWeek(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Week" />
          <input value={topics} onChange={(e) => setTopics(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Topics" />
        </div>
      )}
      {template === 'grading_rubric' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={assignment} onChange={(e) => setAssignment(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Assignment" />
          <input value={criteria} onChange={(e) => setCriteria(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Criteria list" />
        </div>
      )}

      {output && (
        <Section title="Output">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(output)} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
            <button onClick={save} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>Save</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-lg ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>{output}</pre>
        </Section>
      )}
    </div>
  );
}


