import { useState, useEffect } from 'react';

export interface ReportedIssue {
  id: string;
  title: string;
  category: string;
  location: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  reportedTime: string;
  verifiedCount: number;
  status: 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Awaiting Community Verification' | 'Awaiting AI Verification' | 'Pending AI Verification' | 'AI Verified' | 'Closed';
  distance: string;
  image: string;
  description: string;
  landmark?: string;
  contactNumber?: string;
  isAnonymous?: boolean;
  resolvedImage?: string;
  completionNotes?: string;
  completionDate?: string;
  citizenVerificationImage?: string;
  isVerifiedByAI?: boolean;
  verificationConfidence?: number;
}

// Global listeners and in-memory list synced with localStorage
let listeners: Array<() => void> = [];
let reportedIssuesList: ReportedIssue[] = [];

// Initialize from localStorage safely
try {
  const stored = localStorage.getItem('civicq_reported_issues');
  if (stored) {
    reportedIssuesList = JSON.parse(stored);
  }
} catch (e) {
  console.error('Error reading localStorage reported issues:', e);
}

function notify() {
  listeners.forEach(l => {
    try {
      l();
    } catch (err) {
      console.error('Error in listener:', err);
    }
  });
}

export const issueStore = {
  addIssue(issue: ReportedIssue) {
    // Avoid duplicates
    if (reportedIssuesList.some(i => i.id === issue.id)) {
      return;
    }
    reportedIssuesList.push(issue);
    try {
      localStorage.setItem('civicq_reported_issues', JSON.stringify(reportedIssuesList));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
    notify();
  },
  
  getIssues() {
    return reportedIssuesList;
  },
  
  getIssueById(id: string): ReportedIssue | undefined {
    return reportedIssuesList.find(issue => issue.id === id);
  },

  updateIssue(id: string, updates: Partial<ReportedIssue>) {
    reportedIssuesList = reportedIssuesList.map(issue => {
      if (issue.id === id) {
        return { ...issue, ...updates };
      }
      return issue;
    });
    try {
      localStorage.setItem('civicq_reported_issues', JSON.stringify(reportedIssuesList));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
    notify();
  },
  
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

export function useReportedIssues() {
  const [issues, setIssues] = useState<ReportedIssue[]>(reportedIssuesList);
  
  useEffect(() => {
    const unsub = issueStore.subscribe(() => {
      setIssues([...reportedIssuesList]);
    });
    return unsub;
  }, []);
  
  return issues;
}
