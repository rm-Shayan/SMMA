'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Mail, Clock, CheckCircle2 } from 'lucide-react';

export const CampaignsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Cold Outreach & Sequences</h1>
          <p className="text-sm text-slate-400 mt-1">Agent #6 (Outreach) and Agent #9 (Inbox Responder) with anti-ban pacing.</p>
        </div>
        <Button variant="primary">New Outreach Campaign</Button>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-100 mb-4">Active Campaigns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Goal / Topic</th>
                <th className="py-3 px-4">Prospects</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Pacing Jitter</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[
                { goal: 'Book Enterprise Cloud Demos', prospects: 100, mode: 'auto', jitter: '45s–180s', status: 'sending' },
                { goal: 'Follow-up on Unresponsive Leads', prospects: 45, mode: 'draft', jitter: 'Manual Review', status: 'awaiting_approval' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-medium text-slate-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    {c.goal}
                  </td>
                  <td className="py-3.5 px-4">{c.prospects} contacts</td>
                  <td className="py-3.5 px-4"><Badge variant="default">{c.mode}</Badge></td>
                  <td className="py-3.5 px-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {c.jitter}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={c.status === 'sending' ? 'success' : 'warning'}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

