"use client";

import React, { useMemo, useState } from "react";
import { GradingResult } from "@/types";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

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
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const runGrading = async (saveWithEdit?: boolean) => {
    if (!grQuestion.trim() || !grAnswer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.grade, {
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
            className={`${theme.textarea} w-full min-h-[120px]`}
            rows={4}
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium">Student Answer (or Code)</label>
          <textarea
            value={grAnswer}
            onChange={(e) => setGrAnswer(e.target.value)}
            className={`${theme.textarea} w-full min-h-[160px]`}
            rows={6}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grIsCode} onChange={(e) => setGrIsCode(e.target.checked)} /> Code submission</label>
          <button onClick={() => runGrading(false)} disabled={loading || !grQuestion.trim() || !grAnswer.trim()} className={`${theme.primaryButton} ${loading || !grQuestion.trim() || !grAnswer.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            Generate Grade
          </button>
        </div>

        {grResult && (
          <div className={`${theme.surface} p-6 space-y-4`}>
            {typeof grResult.grade === 'number' && (
              <div className="flex items-center justify-between">
                <div className={`${theme.badge}`}>Suggested Grade</div>
                <div className="text-3xl font-semibold text-emerald-500">{grResult.grade}%</div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback (editable)</label>
              <textarea
                value={grEditedFeedback}
                onChange={(e) => setGrEditedFeedback(e.target.value)}
                rows={3}
                className={`${theme.textarea} w-full`}
              />
              <button onClick={() => runGrading(true)} disabled={loading || !grEditedFeedback.trim()} className={`${theme.primaryButton} !bg-gradient-to-r !from-emerald-500 !to-teal-500 ${loading || !grEditedFeedback.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
                Save to History
              </button>
            </div>
            {(grResult.detected_issues && grResult.detected_issues.length > 0) && (
              <div className="text-sm space-y-2">
                <div className={`${theme.badge}`}>Detected Issues</div>
                <ul className="list-disc ml-5 space-y-1">
                  {grResult.detected_issues!.map((it, idx) => (<li key={idx}>{it}</li>))}
                </ul>
              </div>
            )}
            {(grResult.strengths && grResult.strengths.length > 0) && (
              <div className="text-sm space-y-2">
                <div className={`${theme.badge}`}>Strengths</div>
                <ul className="list-disc ml-5 space-y-1">
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
