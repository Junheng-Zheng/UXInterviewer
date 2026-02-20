'use client';

import { useState, useEffect } from 'react';
import { Search, Zap, Calendar, Sparkles, FolderSearch, ClockCheck, SplinePointer, UserSearch, HeartHandshake } from 'lucide-react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../Components/Navbar';
import Profile from '../Components/Profile';
import Image from 'next/image';
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
              item.design ? ` ${item.design.toUpperCase()}` : 'DESIGN A LANDING PAGE',
              item.target ? `${item.target.toUpperCase()}` : 'FOR A HOSPITAL',
              item.tohelp ? `${item.tohelp.toUpperCase()}` : 'TO HELP USERS'
            ];

            // Format time
            const formatTime = (seconds) => {
              if (!seconds && seconds !== 0) return 'N/A';
              const mins = Math.floor(seconds / 60);
              return `${mins}m`;
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
  const ITEMS_PER_PAGE = 4;
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

  const getGradeColor = (grade) => {
    if (grade >= 70) return 'oklch(93.8% 0.127 124.321)';
    if (grade >= 50) return 'oklch(97.3% 0.071 103.193)';
    return 'oklch(94.1% 0.03 12.58)';
  };
  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Easy') return 'oklch(93.8% 0.127 124.321)';
    if (difficulty === 'Medium') return 'oklch(97.3% 0.071 103.193)';
        return 'oklch(94.1% 0.03 12.58)';
  };

  const Shimmerblock = () => {
    return (
      <div className="h-[36px] w-full flex-1 rounded-xl bg-gray-200
        relative overflow-hidden
        before:absolute before:inset-0
        before:-translate-x-full
        before:bg-linear-to-r
        before:from-transparent before:via-white before:to-transparent
        before:animate-[shimmer_1.6s_infinite]"/>
    );
  };
return (
  <div className="flex flex-col h-dvh text-sm  bg-gray-100 relative">

    {/* Background rails */}
    {/* <div className="absolute top-0 left-0 w-full flex justify-between h-full pointer-events-none">
      {Array.from({ length: 256 }).map((_, index) => (
        <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
      ))}
    </div> */}

    {/* Main framed container */}
    <div className="flex-1 flex  h-full items-stretch justify-center z-10 p-0">
        <div className="flex w-full  relative bg-white flex-col flex-1   rounded-xl items-stretch justify-center">
        <div className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none" style={{ backgroundSize: '16px 16px' }}/>
      
        {/* Top bar */}
        <div className = "flex border-b  z-200 border-gray-200 justify-between w-full items-center p-6">
       <div className = "w-full flex justify-start">
         <div className="w-11 h-11 opacity-12 rounded-lg overflow-hidden relative">
            <Image src="/logo.png" alt="logo" fill />
          </div>
       </div>
          <Navbar activeTab="history" />
        <div className = "w-full flex justify-end">
          <Profile />
          </div>
        </div>

        {/* Inner vertical rails */}
        <div className="min-h-0  border-gray-200/80 flex-1 flex flex-col">

          {/* Content */}
          <div className="p-8 flex-1  h-full   z-20  flex flex-col gap-[24px]">

            {/* Search Bar */}
            <div
              className="flex items-center w-full"
  
            >
              <div className="bg-white border border-gray-200 flex items-center justify-between px-[16px] py-[12px] rounded-[12px] w-[420px]">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-normal text-base text-[#2d2d2d] outline-none w-full bg-transparent placeholder:opacity-50"
                />
                <FolderSearch size={20} className = "cursor-pointer" strokeWidth={1.4} />
              </div>
            </div>

            {/* Table */}
<div className=" flex-1 min-h-0 overflow-y-auto scrollbar-hide mask-[linear-gradient(to_bottom,transparent,black_32px,black_calc(100%-32px),transparent)]">


                <div
              className="flex flex-col  items-start h-full w-full "
            >

              {/* Table Header */}
              <div className="border-b border-gray-200/80 px-[16px] gap-4 text-lg flex items-center py-[16px] w-full">
                <div className="flex-1">
                  <p className="font-serif text-black">Interview Question</p>
                </div>
                <div className="flex-1 flex items-center gap-[16px]">
                  <div className="flex-1 flex items-center  gap-2 justify-center">
                    <Sparkles size={16} strokeWidth={1.2} />
                    <p className="font-serif text-[#2d2d2d]">Grade</p>
                  </div>
                  <div className="flex-1 flex items-center  gap-2 justify-center">
                    <Zap size={16} strokeWidth={1.2} />
                    <p className="font-serif text-[#2d2d2d]">Difficulty</p>
                  </div>
                  <div className="flex-1 flex items-center  gap-2 justify-center">
                    <Calendar size={16} strokeWidth={1.2} />
                    <p className="font-serif text-[#2d2d2d]">Date</p>
                  </div>
                  <div className="flex-1 flex items-center  gap-2 justify-center">
                   <ClockCheck size={16} strokeWidth={1.2} />
                    <p className="font-serif text-[#2d2d2d]">Time Spent</p>
                  </div>
                  <div className="flex-1 flex items-center  gap-2 justify-center">  
                    <Clock size={16} strokeWidth={1.2} />
                    <p className="font-serif text-[#2d2d2d]">Time Limit</p>
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col text-center h-full w-full">
                  <div className = "h-fit  gap-8 p-4 w-full flex items-center justify-center border-b border-gray-200/80">
                    <Shimmerblock />
                    <div className = "flex flex-1 gap-4 items-center">
                     <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                    </div>
                  </div>
                  <div className = "h-fit  gap-8 p-4 w-full flex items-center justify-center border-b border-gray-200/80">
                    <Shimmerblock />
                    <div className = "flex flex-1 gap-4 items-center">
                     <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                    </div>
                  </div>
                  <div className = "h-fit  gap-8 p-4 w-full flex items-center justify-center border-b border-gray-200/80">
                    <Shimmerblock />
                    <div className = "flex flex-1 gap-4 items-center">
                     <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                    </div>
                  </div>
                  <div className = "h-fit  gap-8 p-4 w-full flex items-center justify-center border-b border-gray-200/80">
                      <Shimmerblock />
                    <div className = "flex flex-1 gap-4 items-center">
                      <Shimmerblock />
                      <Shimmerblock />  
                      <Shimmerblock />
                      <Shimmerblock />
                      <Shimmerblock />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="py-12 text-center w-full">
                  <p className="text-sm text-red-600 font-normal">Error: {error}</p>
                </div>
              )}


              {/* Fully Empty (no submissions ever) */}
              {!loading && !error && submissions.length === 0 && (
                <div className="py-12 text-center h-full flex items-center justify-center flex-col gap-3 w-full">
                  <p className="font-serif text-xl font-normal">No submissions found</p>
                  <Link
                    href="/"
                    className="text-white bg-[#262626] px-4 py-3 rounded-xl cursor-pointer hover:bg-black font-normal inline-block"
                  >
                    Start your first interview
                  </Link>
                </div>
              )}


              {/* Search empty (has submissions, but filter cleared them) */}
              {!loading && !error && submissions.length > 0 && filteredInterviews.length === 0 && (
                 <div className="py-12 text-center h-full flex items-center justify-center flex-col gap-3 w-full">
                  <p className="font-serif text-xl text-black/80 font-normal">No results match your search</p>

                </div>
              )}


            
              {/* Rows */}
              {!loading && !error && paginatedInterviews.map((interview, index) => (
                <Link
                  key={interview.id}
                  href={`/submission/${interview.submissionId}`}
                  className="border-b w-full  border-gray-200/80 flex hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 flex border-r flex-wrap gap-2 border-gray-200/80 p-[16px]">
                    {interview.question.map((line, i) => (
                      <div key={i} className="flex gap-[8px] items-center font-normal px-2 py-2 rounded-xl bg-gray-100  text-sm text-[#2d2d2d]">
                        {i === 0 && <div className="w-fit self-stretch py-2 p-4 rounded-lg  flex items-center gap-1 bg-blue-100"> <SplinePointer size={16} strokeWidth={1.2}  />  Design</div>}
                        {i === 1 && <div className="w-fit self-stretch py-2 p-4 rounded-lg  flex items-center gap-1 bg-red-100"> <UserSearch size={16} strokeWidth={1.2}  /> For</div>}
                        {i === 2 && <div className="w-fit self-stretch py-2 p-4 rounded-lg  flex items-center gap-1 bg-pink-100"> <HeartHandshake size={16} strokeWidth={1.2}  /> To Help</div>}
                        {/* <div className={`w-[2px] self-stretch ${i === 0 ? 'bg-blue-100' : 'bg-white'}`} /> */}
                        <p className="capitalize ">{line.toLowerCase()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex items-center pr-[16px] gap-[16px]">
                    <div className="flex-1 flex justify-center">
                      <span className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: getGradeColor(interview.grade) }}>
                        {interview.grade}%
                      </span>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <span className="px-3 py-2 rounded-xl  text-sm" style={{ backgroundColor: getDifficultyColor(interview.difficulty) }}>
                        {interview.difficulty}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-center text-sm">
                      {interview.date}
                    </div>
                    <div className="flex-1 flex justify-center text-sm">
                      {interview.time}
                    </div>
                    <div className="flex-1 flex justify-center text-sm">
                      0m
                    </div>
                  </div>
                </Link>
              ))}
            </div>


  </div>

            {/* Pagination */}
            {!loading && !error && filteredInterviews.length > 0 ? (
              <div className="flex gap-[24px] items-center justify-center w-full pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="border border-gray-200/80 px-[16px] cursor-pointer py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <p className="text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="border border-gray-200/80 px-[16px] cursor-pointer py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : (
              <div className = "w-full h-[36px] flex items-center justify-center">
                <div className = "h-full w-[200px]">
                  <Shimmerblock />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  </div>
);

}

