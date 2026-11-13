'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Share2, MessageSquare, ThumbsUp, ShieldAlert } from 'lucide-react';

export const SocialView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Social Media & Paced Engagement</h1>
          <p className="text-sm text-slate-400 mt-1">Publisher (#8), Own Post Engager (#1), Comment Responder (#3) and Competitor Engager (#7).</p>
        </div>
        <Button variant="primary">Draft New Post</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Social Posts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Content Calendar & Published Posts
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { platform: 'LinkedIn', topic: 'Autonomous Multi-Agent Orchestration', status: 'published', time: '10m ago' },
              { platform: 'Facebook', topic: 'AI Security and Double-Entry Ledgers', status: 'approved', time: '1h ago' },
            ].map((p, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{p.platform}</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{p.topic}</p>
                  <span className="text-xs text-slate-500">{p.time}</span>
                </div>
                <Badge variant={p.status === 'published' ? 'success' : 'info'}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Inbound Comment Triage */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Agent #3 Public Comment Triage
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { author: 'Alex Mercer', text: 'How do you integrate with our CRM?', sentiment: 'inquiry', action: 'auto_replied' },
              { author: 'David S.', text: 'Is there a trial without credit card?', sentiment: 'inquiry', action: 'auto_replied' },
            ].map((c, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{c.author}</span>
                  <Badge variant="success">{c.action}</Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1.5 italic">"{c.text}"</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

