'use client';

import React from 'react';
import { StatCard } from '../../components/molecules/stat-card';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Bot, Mail, Share2, Shield, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Operations Command</h1>
        <p className="text-sm text-slate-400 mt-1">Multi-agent orchestrator telemetry and active execution metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Agents"
          value="12 / 12"
          subtitle="All autonomous workers online"
          badgeText="Healthy"
          badgeVariant="success"
          icon={<Bot className="w-5 h-5" />}
        />
        <StatCard
          title="Cold Outreach"
          value="1,420"
          subtitle="Emails dispatched with anti-ban pacing"
          badgeText="98% Deliv"
          badgeVariant="info"
          icon={<Mail className="w-5 h-5" />}
        />
        <StatCard
          title="Social Engagement"
          value="342"
          subtitle="Post starter comments & triage"
          badgeText="45s Jitter"
          badgeVariant="default"
          icon={<Share2 className="w-5 h-5" />}
        />
        <StatCard
          title="Credit Burn"
          value="48 cr"
          subtitle="Double-entry ledger verified"
          badgeText="Balance: 402"
          badgeVariant="warning"
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      {/* Quick Launchpad & Active Agent Grid */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">12 Specialized Agent Status</h2>
          </div>
          <Link href="/orchestration">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-400">
              Launch Supervisor DAG <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {[
            { id: 1, name: 'Own Post Engager', status: 'Auto Pacing', color: 'success' },
            { id: 2, name: 'Competitor Researcher', status: 'Idle', color: 'default' },
            { id: 3, name: 'Comment Responder', status: 'Listening', color: 'info' },
            { id: 4, name: 'Analytics Telemetry', status: 'Scheduled', color: 'default' },
            { id: 5, name: 'Daily Brief Generator', status: 'Completed', color: 'success' },
            { id: 6, name: 'Cold Outreach Agent', status: 'Paced Sending', color: 'info' },
            { id: 7, name: 'Competitor Engager', status: 'Assisted Mode', color: 'warning' },
            { id: 8, name: 'Publisher & Content', status: 'Drafting', color: 'default' },
            { id: 9, name: 'Inbox Classifier', status: 'Listening', color: 'info' },
            { id: 10, name: 'Trainee & SOP Evaluator', status: 'Idle', color: 'default' },
            { id: 11, name: 'Company Ops (RAG)', status: 'pgvector Ready', color: 'success' },
            { id: 12, name: 'Supervisor Orchestrator', status: 'Coordinating', color: 'success' },
          ].map((agent) => (
            <div key={agent.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">#{agent.id} {agent.name}</span>
              </div>
              <Badge variant={agent.color as any}>{agent.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

