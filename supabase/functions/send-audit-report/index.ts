import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditIssue {
  id: string;
  type: "error" | "warning" | "info";
  wcagCriteria: string;
  title: string;
  description: string;
  element?: string;
  howToFix: string;
}

interface AuditResult {
  score: number;
  issues: AuditIssue[];
  passedChecks: number;
  totalChecks: number;
  timestamp: string;
}

function getWcagLink(criteria: string): string {
  const criteriaNumber = criteria.replace(/[^\d.]/g, '');
  return `https://www.w3.org/WAI/WCAG21/Understanding/${criteria.toLowerCase().replace(/\s/g, '-')}.html`;
}

function getPriorityLabel(type: string): string {
  switch (type) {
    case 'error': return 'Critical - Must Fix';
    case 'warning': return 'Important - Should Fix';
    case 'info': return 'Suggestion - Consider Fixing';
    default: return 'Unknown Priority';
  }
}

function generateHtmlReport(result: AuditResult, pageUrl: string): string {
  const timestamp = new Date(result.timestamp).toLocaleString();
  const scoreColor = result.score >= 90 ? '#22c55e' : result.score >= 70 ? '#eab308' : '#ef4444';
  
  const issuesByType = {
    error: result.issues.filter(i => i.type === 'error'),
    warning: result.issues.filter(i => i.type === 'warning'),
    info: result.issues.filter(i => i.type === 'info'),
  };

  const issuesHtml = result.issues.map(issue => `
    <div style="border: 1px solid ${issue.type === 'error' ? '#fecaca' : issue.type === 'warning' ? '#fef08a' : '#bfdbfe'}; 
                background: ${issue.type === 'error' ? '#fef2f2' : issue.type === 'warning' ? '#fefce8' : '#eff6ff'}; 
                border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="background: ${issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#eab308' : '#3b82f6'}; 
                     color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${issue.type.toUpperCase()}
        </span>
        <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #6b7280;">
          ${issue.wcagCriteria}
        </span>
      </div>
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px;">${issue.title}</h3>
      <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px;">${issue.description}</p>
      ${issue.element ? `
        <div style="background: #1f2937; color: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-bottom: 12px; overflow-x: auto;">
          ${issue.element.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      ` : ''}
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 12px;">
        <strong style="color: #065f46; font-size: 12px;">HOW TO FIX:</strong>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">${issue.howToFix}</p>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 32px; border-radius: 12px; margin-bottom: 24px; }
    .score-card { display: flex; align-items: center; gap: 24px; background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: white; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .summary-card { background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-number { font-size: 24px; font-weight: bold; }
    .section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0 0 8px 0; font-size: 28px;">Accessibility Audit Report</h1>
    <p style="margin: 0; opacity: 0.9;">Generated on ${timestamp}</p>
    <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">${pageUrl}</p>
  </div>

  <div class="score-card">
    <div class="score-circle" style="background: ${scoreColor};">${result.score}</div>
    <div>
      <h2 style="margin: 0 0 4px 0;">Overall Score</h2>
      <p style="margin: 0; color: #6b7280;">${result.passedChecks} of ${result.totalChecks} checks passed</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-number" style="color: #ef4444;">${issuesByType.error.length}</div>
      <div style="color: #6b7280; font-size: 14px;">Critical Issues</div>
    </div>
    <div class="summary-card">
      <div class="summary-number" style="color: #eab308;">${issuesByType.warning.length}</div>
      <div style="color: #6b7280; font-size: 14px;">Warnings</div>
    </div>
    <div class="summary-card">
      <div class="summary-number" style="color: #3b82f6;">${issuesByType.info.length}</div>
      <div style="color: #6b7280; font-size: 14px;">Suggestions</div>
    </div>
  </div>

  ${result.issues.length > 0 ? `
    <div class="section">
      <h2 style="margin: 0 0 20px 0;">Issues Found (${result.issues.length})</h2>
      ${issuesHtml}
    </div>
  ` : `
    <div class="section" style="text-align: center; padding: 40px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h2 style="margin: 0 0 8px 0; color: #22c55e;">No Issues Found!</h2>
      <p style="margin: 0; color: #6b7280;">Your page passed all accessibility checks.</p>
    </div>
  `}

  <div class="section">
    <h2 style="margin: 0 0 16px 0;">Recommendations</h2>
    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
      ${result.score < 100 ? '<li>Address critical issues first as they have the biggest impact on accessibility</li>' : ''}
      ${result.score < 90 ? '<li>Run this audit regularly as you make changes to your site</li>' : ''}
      <li>Test with real assistive technologies (screen readers, keyboard navigation)</li>
      <li>Include users with disabilities in your testing process</li>
      <li>Review WCAG 2.1 guidelines for comprehensive accessibility coverage</li>
    </ul>
  </div>

  <div class="footer">
    <p>Generated by Accessibility Widget • <a href="https://www.w3.org/WAI/WCAG21/quickref/" style="color: #3b82f6;">WCAG 2.1 Quick Reference</a></p>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, auditResult, pageUrl, senderName } = await req.json();

    if (!recipientEmail || !auditResult) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail and auditResult" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please add RESEND_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = generateHtmlReport(auditResult, pageUrl || 'Unknown URL');
    const scoreEmoji = auditResult.score >= 90 ? '✅' : auditResult.score >= 70 ? '⚠️' : '❌';
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Accessibility Audit <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${scoreEmoji} Accessibility Audit Report - Score: ${auditResult.score}/100`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email. Please check the email address and try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send audit report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
