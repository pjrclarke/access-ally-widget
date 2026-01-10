import jsPDF from "jspdf";
import { AuditResult, AuditIssue } from "./useAccessibilityAudit";

interface ExportMetadata {
  pageUrl: string;
  pageTitle: string;
  scanDate: string;
  scanTime: string;
}

function getMetadata(): ExportMetadata {
  const now = new Date();
  return {
    pageUrl: window.location.href,
    pageTitle: document.title || "Untitled Page",
    scanDate: now.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    scanTime: now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function getIssueTypeLabel(type: AuditIssue["type"]): string {
  switch (type) {
    case "error":
      return "Critical";
    case "warning":
      return "Warning";
    case "info":
      return "Recommendation";
    default:
      return type;
  }
}

function getScoreRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Improvement";
  if (score >= 40) return "Poor";
  return "Critical Issues";
}

export function exportToJSON(result: AuditResult): void {
  const metadata = getMetadata();
  
  const report = {
    report: {
      title: "Accessibility Audit Report",
      generator: "AccessibleAI Widget",
      version: "1.0.0",
    },
    metadata: {
      url: metadata.pageUrl,
      title: metadata.pageTitle,
      scannedAt: new Date().toISOString(),
      humanReadableDate: `${metadata.scanDate} at ${metadata.scanTime}`,
    },
    summary: {
      score: result.score,
      scoreRating: getScoreRating(result.score),
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      passRate: `${Math.round((result.passedChecks / result.totalChecks) * 100)}%`,
      issueCount: {
        total: result.issues.length,
        critical: result.issues.filter((i) => i.type === "error").length,
        warnings: result.issues.filter((i) => i.type === "warning").length,
        recommendations: result.issues.filter((i) => i.type === "info").length,
      },
    },
    issues: result.issues.map((issue, index) => ({
      id: index + 1,
      internalId: issue.id,
      severity: getIssueTypeLabel(issue.type),
      severityLevel: issue.type,
      wcagCriteria: issue.wcagCriteria,
      wcagLink: `https://www.w3.org/WAI/WCAG21/Understanding/${getWcagLink(issue.wcagCriteria)}`,
      title: issue.title,
      description: issue.description,
      affectedElement: issue.element || null,
      remediation: issue.howToFix,
      priority: issue.type === "error" ? "High" : issue.type === "warning" ? "Medium" : "Low",
    })),
    wcagGuidelines: {
      standard: "WCAG 2.1",
      level: "AA",
      note: "This automated scan checks for common accessibility issues. A comprehensive audit requires manual testing with assistive technologies.",
    },
    recommendations: generateRecommendations(result),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `accessibility-audit-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getWcagLink(criteria: string): string {
  const links: Record<string, string> = {
    "1.1.1": "non-text-content",
    "1.3.1": "info-and-relationships",
    "2.4.1": "bypass-blocks",
    "2.4.2": "page-titled",
    "2.4.3": "focus-order",
    "2.4.4": "link-purpose-in-context",
    "3.1.1": "language-of-page",
    "4.1.2": "name-role-value",
  };
  return links[criteria] || "understanding-techniques";
}

function generateRecommendations(result: AuditResult): string[] {
  const recommendations: string[] = [];
  
  if (result.score < 50) {
    recommendations.push("This page has significant accessibility barriers. Consider engaging an accessibility specialist for a comprehensive review.");
  }
  
  const criticalIssues = result.issues.filter((i) => i.type === "error");
  if (criticalIssues.length > 0) {
    recommendations.push(`Address the ${criticalIssues.length} critical issue(s) first as these create the most significant barriers for users.`);
  }
  
  if (result.issues.some((i) => i.id === "img-alt")) {
    recommendations.push("Add descriptive alt text to all meaningful images. Use empty alt=\"\" for decorative images.");
  }
  
  if (result.issues.some((i) => i.id === "form-labels")) {
    recommendations.push("Ensure all form inputs have associated labels using the 'for' attribute or aria-label.");
  }
  
  if (result.issues.some((i) => i.id.includes("heading"))) {
    recommendations.push("Review the heading structure to ensure it follows a logical hierarchy (H1 → H2 → H3).");
  }
  
  if (result.score >= 80) {
    recommendations.push("The page has a good foundation. Consider manual testing with screen readers like NVDA or VoiceOver.");
  }
  
  recommendations.push("Test the page with keyboard-only navigation to ensure all interactive elements are accessible.");
  recommendations.push("Verify colour contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).");
  
  return recommendations;
}

export function exportToPDF(result: AuditResult): void {
  const metadata = getMetadata();
  const doc = new jsPDF();
  
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  
  // Helper functions
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(...color);
    return doc.splitTextToSize(text, contentWidth);
  };
  
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(99, 102, 241); // Primary color
  doc.rect(0, 0, pageWidth, 45, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Accessibility Audit Report", margin, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated by AccessibleAI Widget`, margin, 35);
  
  yPos = 60;
  
  // Page Information Section
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos - 5, contentWidth, 35, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPos - 5, contentWidth, 35, "S");
  
  const lines = addText("Page Information", 12, true);
  doc.text(lines, margin + 5, yPos + 5);
  
  yPos += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`URL: ${metadata.pageUrl}`, margin + 5, yPos + 5);
  doc.text(`Title: ${metadata.pageTitle}`, margin + 5, yPos + 12);
  doc.text(`Scan Date: ${metadata.scanDate} at ${metadata.scanTime}`, margin + 5, yPos + 19);
  
  yPos += 45;
  
  // Score Section
  const scoreColor: [number, number, number] = result.score >= 80 
    ? [34, 197, 94] // green
    : result.score >= 50 
    ? [234, 179, 8] // yellow
    : [239, 68, 68]; // red
  
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin, yPos, 60, 50, 5, 5, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(`${result.score}%`, margin + 10, yPos + 30);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Score", margin + 10, yPos + 42);
  
  // Score details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin + 75, yPos + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Rating: ${getScoreRating(result.score)}`, margin + 75, yPos + 22);
  doc.text(`Checks Passed: ${result.passedChecks} of ${result.totalChecks}`, margin + 75, yPos + 32);
  doc.text(`Total Issues Found: ${result.issues.length}`, margin + 75, yPos + 42);
  
  yPos += 65;
  
  // Issue Breakdown
  const criticalCount = result.issues.filter((i) => i.type === "error").length;
  const warningCount = result.issues.filter((i) => i.type === "warning").length;
  const infoCount = result.issues.filter((i) => i.type === "info").length;
  
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos, contentWidth, 25, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Issue Breakdown:", margin + 5, yPos + 10);
  
  // Critical badge
  if (criticalCount > 0) {
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margin + 5, yPos + 13, 35, 8, 2, 2, "F");
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.text(`${criticalCount} Critical`, margin + 8, yPos + 18.5);
  }
  
  // Warning badge
  if (warningCount > 0) {
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(margin + 45, yPos + 13, 35, 8, 2, 2, "F");
    doc.setTextColor(161, 98, 7);
    doc.setFontSize(8);
    doc.text(`${warningCount} Warnings`, margin + 48, yPos + 18.5);
  }
  
  // Info badge
  if (infoCount > 0) {
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(margin + 85, yPos + 13, 45, 8, 2, 2, "F");
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(8);
    doc.text(`${infoCount} Recommendations`, margin + 88, yPos + 18.5);
  }
  
  yPos += 40;
  
  // Issues Section
  if (result.issues.length > 0) {
    checkPageBreak(30);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Detailed Issues", margin, yPos);
    yPos += 10;
    
    result.issues.forEach((issue, index) => {
      checkPageBreak(60);
      
      const issueHeight = 55;
      
      // Issue card background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, issueHeight, 3, 3, "FD");
      
      // Severity indicator
      const severityColor: [number, number, number] = issue.type === "error" 
        ? [239, 68, 68]
        : issue.type === "warning" 
        ? [234, 179, 8]
        : [99, 102, 241];
      doc.setFillColor(...severityColor);
      doc.rect(margin, yPos, 4, issueHeight, "F");
      
      // Issue number and title
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${issue.title}`, margin + 10, yPos + 10);
      
      // WCAG badge
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(pageWidth - margin - 30, yPos + 4, 25, 8, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`WCAG ${issue.wcagCriteria}`, pageWidth - margin - 28, yPos + 9.5);
      
      // Severity label
      doc.setFontSize(8);
      doc.setTextColor(...severityColor);
      doc.text(getIssueTypeLabel(issue.type).toUpperCase(), margin + 10, yPos + 18);
      
      // Description
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(issue.description, contentWidth - 20);
      doc.text(descLines.slice(0, 2), margin + 10, yPos + 26);
      
      // How to fix
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("How to fix:", margin + 10, yPos + 40);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const fixLines = doc.splitTextToSize(issue.howToFix, contentWidth - 35);
      doc.text(fixLines.slice(0, 2), margin + 35, yPos + 40);
      
      // Element reference if available
      if (issue.element) {
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Element: ${issue.element}`, margin + 10, yPos + 50);
      }
      
      yPos += issueHeight + 5;
    });
  }
  
  // Recommendations Section
  checkPageBreak(50);
  yPos += 10;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Recommendations", margin, yPos);
  yPos += 10;
  
  const recommendations = generateRecommendations(result);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  
  recommendations.forEach((rec, index) => {
    checkPageBreak(20);
    const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, contentWidth - 10);
    doc.text(recLines, margin + 5, yPos);
    yPos += recLines.length * 5 + 5;
  });
  
  // Footer on last page
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This report was generated by AccessibleAI Widget. Automated scans check for common issues but", margin, yPos + 8);
  doc.text("cannot replace manual testing with assistive technologies. WCAG 2.1 Level AA is the recommended standard.", margin, yPos + 14);
  doc.text(`Report generated: ${metadata.scanDate} at ${metadata.scanTime}`, margin, yPos + 22);
  
  // Save
  doc.save(`accessibility-audit-${new Date().toISOString().split("T")[0]}.pdf`);
}
