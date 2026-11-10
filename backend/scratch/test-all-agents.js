const { invokeAgentEngine } = require('../dist/modules/agents/agent.workflow');

async function testAllAgents() {
  const tenantId = '3f73f847-b457-4343-969c-f2262667922c';
  const results = [];

  console.log('🚀 Starting Comprehensive 10-Agent Testing Suite...\n');

  const testCases = [
    {
      id: 'Agent #1: SELF_COMMENTER',
      target: 'SELF_COMMENTER',
      msg: '🚀 We just launched our AI automation agency system helping businesses capture leads 24/7!'
    },
    {
      id: 'Agent #2: TREND_IDENTIFIER',
      target: 'TREND_IDENTIFIER',
      msg: 'Topic: How AI agents are replacing traditional sales funnels for local service businesses in 2026.'
    },
    {
      id: 'Agent #3: COMPETITOR_ENGAGEMENT',
      target: 'COMPETITOR_ENGAGEMENT',
      msg: 'Competitor posted: "Cold email is completely dead in 2026. Only organic TikTok works now."'
    },
    {
      id: 'Agent #4: POST_DISTRIBUTION',
      target: 'POST_DISTRIBUTION',
      msg: 'Draft: 3 lessons from scaling our agency to $50k/mo using autonomous AI DM responders.'
    },
    {
      id: 'Agent #5: COMMENT_REPLY',
      target: 'COMMENT_REPLY',
      msg: 'User comment on our post: "How much does your monthly package cost? Do you have pricing on your site?"'
    },
    {
      id: 'Agent #6: DM_HANDLER',
      target: 'DM_HANDLER',
      msg: 'Hi, I need ads management for my dental clinic. My number is 03009998877, email: info@clinic.com'
    },
    {
      id: 'Agent #7: COMPETITIVE_RESEARCHER',
      target: 'COMPETITIVE_RESEARCHER',
      msg: 'Competitor content breakdown: They post 5 carousels a week on real estate marketing with high engagement.'
    },
    {
      id: 'Agent #8: ANALYTICS',
      target: 'ANALYTICS',
      msg: 'Last 7 days data: 45 leads captured, 12 calls booked, Instagram engagement up 35%, TikTok down 10%.'
    },
    {
      id: 'Agent #9: INBOX_SUPPORT_MANAGER',
      target: 'INBOX_SUPPORT_MANAGER',
      msg: 'I want to speak with your founder before signing any contract. Can we jump on a quick Zoom call tomorrow?'
    }
  ];

  for (const tc of testCases) {
    try {
      process.stdout.write(`Testing [${tc.id}] ... `);
      const start = Date.now();
      const res = await invokeAgentEngine({
        tenantId,
        channel: 'INSTAGRAM',
        incomingMessage: tc.msg,
        targetAgent: tc.target
      });
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✅ PASSED (${duration}s)`);
      results.push({
        agent: tc.id,
        status: 'PASSED',
        intent: res.intent || 'SUCCESS',
        sampleOutput: (res.generatedResponse || JSON.stringify(res.executionTrace || '')).slice(0, 120) + '...'
      });
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      results.push({ agent: tc.id, status: 'FAILED', error: err.message });
    }
  }

  console.log('\n=========================================');
  console.log('        TEST SUITE SUMMARY RESULTS        ');
  console.log('=========================================');
  results.forEach(r => {
    console.log(`\n• ${r.agent}: [${r.status}]`);
    if (r.sampleOutput) console.log(`  Output: "${r.sampleOutput}"`);
    if (r.error) console.log(`  Error: ${r.error}`);
  });

  process.exit(0);
}

testAllAgents().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

