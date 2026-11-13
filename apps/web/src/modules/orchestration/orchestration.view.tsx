'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Cpu, Search, CheckCircle } from 'lucide-react';

export const OrchestrationView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Supervisor & Multi-Agent DAGs</h1>
          <p className="text-sm text-slate-400 mt-1">Master Orchestrator (Agent #12) coordinating child agent pipelines.</p>
        </div>
        <Button variant="primary">New Autonomous Task</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supervisor DAG Tasks */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Supervisor Orchestration Pipeline</h2>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Goal: Q1 Enterprise SaaS Expansion</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <p className="text-xs text-slate-400">Budget: 6 Credits • Decomposed into 3 stages</p>
            
            <div className="space-y-2 pt-2 border-t border-slate-900">
              {[
                { step: 1, name: 'Agent #2 (Competitor Researcher)', desc: 'Crawled RivalCorp positioning', done: true },
                { step: 2, name: 'Agent #8 (Publisher)', desc: 'Drafted 2 conversion posts', done: true },
                { step: 3, name: 'Agent #1 (Own Post Engager)', desc: 'Queued conversation starter comments', done: true },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-200">{s.name}:</span>
                  <span className="text-slate-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Competitor Researcher Findings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-semibold text-slate-100">Competitor Intelligence (Agent #2)</h2>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Target: LegacyHub AI</span>
              <Badge variant="info">3 cr burned</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Core vulnerability identified: rigid annual contracts and lack of transparent double-entry credit ledger. Outreach campaigns oriented toward self-serve flexibility.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

