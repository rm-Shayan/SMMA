'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BookOpen, GraduationCap, Database } from 'lucide-react';

export const KnowledgeView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Knowledge Base & SOP Onboarding</h1>
          <p className="text-sm text-slate-400 mt-1">Agent #11 (Company Ops RAG) and Agent #10 (Trainee SOP Evaluator).</p>
        </div>
        <Button variant="primary">Upload New SOP</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Documents */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">pgvector Knowledge Documents</h2>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Incident Response & On-Call SLA', chunks: 14, source: 'Notion', status: 'embedded' },
              { title: 'Double-Entry Credit Accounting Policy', chunks: 8, source: 'Confluence', status: 'embedded' },
            ].map((doc, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{doc.title}</p>
                  <span className="text-xs text-slate-500">{doc.chunks} chunks • Source: {doc.source}</span>
                </div>
                <Badge variant="success">1536-dim</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Trainee Progress */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">Trainee SOP Evaluation (Agent #10)</h2>
          </div>
          <div className="space-y-3">
            {[
              { user: 'Ali Khan', module: 'Module 1: Incident SLA', score: 90, status: 'passed' },
              { user: 'Sara Ahmed', module: 'Module 2: Credit Policies', score: 95, status: 'passed' },
            ].map((t, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.user}</p>
                  <span className="text-xs text-slate-500">{t.module} • Score: {t.score}%</span>
                </div>
                <Badge variant="success">{t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

