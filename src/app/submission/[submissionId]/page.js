"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Results from "@/app/Components/Templates/Results";
import useStore from "@/store/module";

const SubmissionDetailPage = () => {
  const params = useParams();
  const submissionId = params?.submissionId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);

  const setDesign = useStore((state) => state.setDesign);
  const setTarget = useStore((state) => state.setTarget);
  const setTohelp = useStore((state) => state.setTohelp);
  const setEvaluation = useStore((state) => state.setEvaluation);
  const setScreenshot = useStore((state) => state.setScreenshot);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) {
        setError("No submission ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get current user to verify ownership
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();

        if (!userData.authenticated || !userData.user?.sub) {
          throw new Error("Not authenticated");
        }

        // Get the submission from DynamoDB
        // The submissionId from URL is like "submission-1234567890-abc123"
        // In DynamoDB, SK is stored as "SUBMISSION#submission-1234567890-abc123"
        const skValue = submissionId.startsWith('SUBMISSION#') 
          ? submissionId 
          : `SUBMISSION#${submissionId}`;
        
        const getResponse = await fetch('/api/dynamodb/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: {
              PK: `USER#${userData.user.sub}`,
              SK: skValue,
            },
          }),
        });

        // Check for auth errors before parsing JSON
        if (getResponse.status === 401) {
          const authData = await getResponse.json();
          if (authData.requiresAuth || authData.redirectTo) {
            // Store current path for redirect after login
            if (typeof window !== 'undefined') {
              const returnUrl = window.location.pathname + window.location.search;
              const loginUrl = authData.redirectTo || '/Signin';
              window.location.href = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}returnUrl=${encodeURIComponent(returnUrl)}`;
            }
            return;
          }
        }

        const getData = await getResponse.json();

        if (!getData.success || !getData.item) {
          throw new Error("Submission not found");
        }

        const item = getData.item;

        // Verify the submission belongs to the user
        if (item.userId !== userData.user.sub) {
          throw new Error("Unauthorized access");
        }

        // Populate the store with submission data so Results component can use it
        setDesign(item.design || "");
        setTarget(item.target || "");
        setTohelp(item.tohelp || "");
        setEvaluation(item.evaluation || null);
        
        // Note: Screenshot is not stored, but we can try to render Excalidraw from excalidrawData
        // For now, set screenshot to null
        setScreenshot(null);

        setSubmission(item);
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError(err.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, setDesign, setTarget, setTohelp, setEvaluation, setScreenshot]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error: {error}</p>
          <a href="/Navigation" className="text-blue-600 hover:underline">
            Back to History
          </a>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">Submission not found</p>
          <a href="/Navigation" className="text-blue-600 hover:underline">
            Back to History
          </a>
        </div>
      </div>
    );
  }

  // Render the Results component - it will use the data from the store
  return <Results submissionData={submission} />;
};

export default SubmissionDetailPage;

