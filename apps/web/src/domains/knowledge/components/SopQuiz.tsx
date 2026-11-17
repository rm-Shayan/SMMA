"use client";

import React, { useState } from "react";
import { Award, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import type { SopModule } from "../types";

export interface SopQuizProps {
  module: SopModule;
  onComplete?: (score: number) => void;
}

export function SopQuiz({ module, onComplete }: SopQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = module.questions[currentIdx];

  const handleSelectOption = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const handleNext = () => {
    if (currentIdx < module.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      const score = calculateScore();
      onComplete?.(score);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    module.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) correct++;
    });
    return Math.round((correct / module.questions.length) * 100);
  };

  if (isFinished) {
    const score = calculateScore();
    const passed = score >= module.passingScore;

    return (
      <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
            passed ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          }`}
        >
          {passed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {passed ? "SOP Certification Passed!" : "Certification Retake Needed"}
          </h3>
          <p className="text-xs text-muted-foreground">
            You scored {score}% (Passing score: {module.passingScore}%)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsFinished(false);
            setCurrentIdx(0);
            setSelectedAnswers({});
          }}
        >
          Retake Quiz
        </Button>
      </div>
    );
  }

  if (!currentQ) {
    return null;
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {module.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-primary">
          Question {currentIdx + 1} of {module.questions.length}
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">{currentQ.question}</p>

        <div className="space-y-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentIdx] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-muted/20 text-foreground hover:bg-muted/50"
                }`}
              >
                <span>{option}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="sm"
          disabled={selectedAnswers[currentIdx] === undefined}
          onClick={handleNext}
        >
          {currentIdx === module.questions.length - 1 ? "Submit Quiz" : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
