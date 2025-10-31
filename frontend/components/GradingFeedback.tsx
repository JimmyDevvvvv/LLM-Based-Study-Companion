"use client";

import React, { useState } from "react";
import { GradingResult } from "@/types";

interface GradingFeedbackProps {
  isDark: boolean;
}

export default function GradingFeedback({ isDark }: GradingFeedbackProps) {
  const [grQuestion, setGrQuestion] = useState<string>("");
  const [grAnswer, setGrAnswer] = useState<string>("");
  const [grIsCode, setGrIsCode] = useState<boolean>(false);
  const [grResult, setGrResult] = useState<GradingResult | null>(null);
  const [grEditedFeedback, setGrEditedFeedback] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const runGrading = async (saveWithEdit?: boolean) => {
    if (!grQuestion.trim() || !grAnswer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: grQuestion,
          answer: grAnswer,
          is_code: grIsCode,
          instructor_edit: saveWithEdit ? grEditedFeedback : undefined
        })
      });
      const data = await res.json();
      setGrResult(data);
      if (!saveWithEdit && data && data.feedback) setGrEditedFeedback(data.feedback);
    } catch (e) {
      setGrResult({ feedback: "Error running grading. Ensure backend is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Question / Assignment</label>
          <textarea
            value={grQuestion}
            onChange={(e) => setGrQuestion(e.target.value)}
            className={`w-full px-4 py-3 border-2 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none`}
            rows={4}
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium">Student Answer (or Code)</label>
          <textarea
            value={grAnswer}
            onChange={(e) => setGrAnswer(e.target.value)}
            className={`w-full px-4 py-3 border-2 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none`}
            rows={6}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grIsCode} onChange={(e) => setGrIsCode(e.target.checked)} /> Code submission</label>
          <button onClick={() => runGrading(false)} disabled={loading || !grQuestion.trim() || !grAnswer.trim()} className={`px-4 py-2 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
            Generate Grade
          </button>
        </div>

        {grResult && (
          <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            {typeof grResult.grade === 'number' && (
              <div className="mb-2 text-sm">Suggested Grade: <span className="font-semibold">{grResult.grade}%</span></div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback (editable)</label>
              <textarea
                value={grEditedFeedback}
                onChange={(e) => setGrEditedFeedback(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300'}`}
              />
              <button onClick={() => runGrading(true)} disabled={loading || !grEditedFeedback.trim()} className={`px-4 py-2 rounded-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>
                Save to History
              </button>
            </div>
            {(grResult.detected_issues && grResult.detected_issues.length > 0) && (
              <div className="mt-3 text-sm">
                <div className="font-semibold mb-1">Detected Issues</div>
                <ul className="list-disc ml-5">
                  {grResult.detected_issues!.map((it, idx) => (<li key={idx}>{it}</li>))}
                </ul>
              </div>
            )}
            {(grResult.strengths && grResult.strengths.length > 0) && (
              <div className="mt-3 text-sm">
                <div className="font-semibold mb-1">Strengths</div>
                <ul className="list-disc ml-5">
                  {grResult.strengths!.map((it, idx) => (<li key={idx}>{it}</li>))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
