'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../Components/Navbar';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch submissions from DynamoDB
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();

        if (!userData.authenticated || !userData.user?.sub) {
          console.log("User not authenticated");
          setSubmissions([]);
          setLoading(false);
          return;
        }

        // Query submissions for this user
        const queryResponse = await fetch('/api/dynamodb/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partitionKey: 'PK',
            partitionValue: `USER#${userData.user.sub}`,
            options: {
              sortKeyName: 'SK',
              sortKeyCondition: 'begins_with(SK, :skPrefix)',
              sortKeyValues: {
                ':skPrefix': 'SUBMISSION#'
              },
            },
          }),
        });

        // Check for auth errors
        if (queryResponse.status === 401) {
          const authData = await queryResponse.json();
          if (authData.requiresAuth || authData.redirectTo) {
            if (typeof window !== 'undefined') {
              const returnUrl = window.location.pathname + window.location.search;
              const loginUrl = authData.redirectTo || '/Signin';
              window.location.href = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}returnUrl=${encodeURIComponent(returnUrl)}`;
            }
            return;
          }
        }

        const queryData = await queryResponse.json();

        if (!queryData.success) {
          throw new Error(queryData.error || 'Failed to fetch submissions');
        }

        // Transform DynamoDB items to display format
        const transformedData = (queryData.items || [])
          .filter(item => item.submissionId)
          .map(item => {
            // Calculate average score - handle both old and new structure
            let averageScore = 0;
            if (item.overall_score !== undefined) {
              averageScore = item.overall_score;
            } else if (item.scores) {
              const technical = item.scores.technical || 0;
              const diagramming = item.scores.diagramming || 0;
              const linguistics = item.scores.linguistics || 0;
              averageScore = Math.round((technical + diagramming + linguistics) / 3);
            } else {
              // New API structure
              const technical = item.technical_overall_score || 0;
              const diagram = item.diagram_overall_score || 0;
              const transcript = item.transcript_overall_score || 0;
              averageScore = Math.round((technical + diagram + transcript) / 3);
            }

            // Format date
            const date = item.timestamp 
              ? new Date(item.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
              : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

            // Format question parts
            const question = [
              item.design ? `DESIGN ${item.design.toUpperCase()}` : 'DESIGN A LANDING PAGE',
              item.target ? `FOR ${item.target.toUpperCase()}` : 'FOR A HOSPITAL',
              item.tohelp ? `TO HELP ${item.tohelp.toUpperCase()}` : 'TO HELP USERS'
            ];

            // Format time
            const formatTime = (seconds) => {
              if (!seconds && seconds !== 0) return 'N/A';
              const mins = Math.floor(seconds / 60);
              return `${mins} Min`;
            };

            return {
              id: item.submissionId,
              question: question,
              grade: averageScore,
              difficulty: 'Medium', // Default
              date: date,
              time: formatTime(item.completionTimeSeconds),
              submissionId: item.submissionId,
            };
          })
          .sort((a, b) => {
            // Sort by most recent first
            return new Date(b.date) - new Date(a.date);
          });

        setSubmissions(transformedData);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const interviews = submissions;

  // Filter interviews based on search query
  const filteredInterviews = interviews.filter((interview) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const questionText = interview.question.join(' ').toLowerCase();
    return (
      questionText.includes(searchLower) ||
      interview.difficulty.toLowerCase().includes(searchLower) ||
      interview.date.includes(searchQuery) ||
      interview.grade.toString().includes(searchQuery)
    );
  });

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE));
  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="bg-white flex flex-col w-full min-h-screen">
      {/* Navbar */}
      <Navbar activeTab="history" />
      
      {/* Main Content */}
      <div className="flex items-center justify-center  w-full flex-1">
        <div className="flex flex-col gap-[24px] items-start w-full max-w-[1200px]">
        {/* Search Bar */}
        <motion.div
          className="flex items-center w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-white border border-[#e0e0e0] flex items-center justify-between px-[16px] py-[12px] rounded-[12px] w-[416px]">
            <input
              type="text"
              placeholder="Search past entries"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-light text-sm text-[#2d2d2d] outline-none w-full bg-transparent placeholder:opacity-50"
            />
            <Search className="w-[14px] h-[14px] text-[#2d2d2d]" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          className="flex flex-col items-start  w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          {/* Table Header */}
          <motion.div
            className="border-b border-[#e4e4e4] px-[16px] text-lg flex items-center py-[16px] w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="flex-1">
              <p className="font-serif  text-black">Interview Question</p>
            </div>
            <div className="flex-1 flex items-center   gap-[16px]">
              <div className="flex-1 flex items-center justify-center">
                <p className="font-serif  text-[#2d2d2d]">Grade</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="font-serif  text-[#2d2d2d]">Difficulty</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="font-serif  text-[#2d2d2d]">Date</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="font-serif  text-[#2d2d2d]">Time</p>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#3168f5] mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 font-light">Loading your history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600 font-light">Error: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredInterviews.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-600 font-light">No submissions found</p>
              <Link href="/Refactor" className="text-sm text-[#3168f5] font-light mt-2 inline-block">
                Start your first interview
              </Link>
            </div>
          )}

          {/* Table Rows */}
          {!loading && !error && paginatedInterviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.4 + (index * 0.1), 
                ease: 'easeOut' 
              }}
              className="w-full"
            >
              <Link
                href={`/submission/${interview.submissionId}`}
                className={`border-b ${
                  index % 2 === 0 ? 'border-[#f1f1f1]' : 'border-[#e4e4e4]'
                } flex items-center  hover:bg-gray-50 transition-colors cursor-pointer`}
              >
              <div className="border-r border-[#e0e0e0] flex-1 flex-col items-start pl-[16px] py-[12px]">
                <div className="flex flex-col gap-[4px] items-start w-full">
                  {interview.question.map((line, lineIndex) => (
                    <div key={lineIndex} className="w-full">
                      <div className="flex gap-[8px] items-center">
                        <div className="flex items-center h-[14px]">
                          <div
                            className={`${
                              lineIndex === 0 ? 'bg-[#3168f5]' : 'bg-white'
                            } h-full w-[2px]`}
                          />
                        </div>
                        <p className="font-light text-sm text-[#2d2d2d] capitalize">
                          {line.toLowerCase()}
                        </p>
                      </div>
                      {lineIndex < interview.question.length - 1 && (
                        <div className="bg-[#e0e0e0] h-px w-full my-[4px]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex items-center  pr-[16px] gap-[16px]">
                {/* Grade Badge */}
                <div className="flex-1 flex items-center justify-center">
                  <div className={`${
                    interview.grade >= 70 ? 'bg-[#60a5fa]' : interview.grade >= 50 ? 'bg-[#3168f5]' : 'bg-[#1e40af]'
                  } flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[100px]`}>
                    <div className="bg-white border border-white rounded-full w-[8px] h-[8px]" />
                    <p className="text-sm text-white font-light">
                      {interview.grade}%
                    </p>
                  </div>
                </div>
                {/* Difficulty Badge */}
                <div className="flex-1 flex items-center justify-center">
                  <div className={`${
                    interview.difficulty === 'Easy' ? 'bg-[#60a5fa]' : 
                    interview.difficulty === 'Medium' ? 'bg-[#3168f5]' : 'bg-[#1e40af]'
                  } flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[100px]`}>
                    <div className="bg-white border border-white rounded-full w-[8px] h-[8px]" />
                    <p className="text-sm text-white font-light">
                      {interview.difficulty}
                    </p>
                  </div>
                </div>
                {/* Date */}
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[#2d2d2d] font-light">
                    {interview.date}
                  </p>
                </div>
                {/* Time */}
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[#2d2d2d] font-light">
                    {interview.time}
                  </p>
                </div>
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination - Only show if there are results */}
        {!loading && !error && filteredInterviews.length > 0 && (
          <motion.div
            className="flex gap-[24px] items-center justify-center w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="border border-[#e0e0e0] flex items-center justify-center px-[16px] py-[10px] rounded-[1000px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-light text-sm text-black">
                Previous
              </p>
            </button>
            <p className="font-light text-sm text-black">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="border border-[#e0e0e0] flex items-center justify-center px-[16px] py-[10px] rounded-[1000px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-light text-sm text-black">
                Next
              </p>
            </button>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}

