"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const History = () => {
  /* -------------------- styles / helpers -------------------- */
  const categoryColors = [
    "bg-orange-100 text-orange-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ];

  const getCategoryStyle = (category) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash += category.charCodeAt(i);
    }
    return categoryColors[hash % categoryColors.length];
  };

  const getGradeColor = (grade) => {
    const value = Number(grade);
    if (value >= 85) return "bg-green-600";
    if (value >= 70) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === "Easy") return "bg-green-600";
    if (difficulty === "Medium") return "bg-yellow-600";
    return "bg-red-600";
  };

  /* -------------------- state -------------------- */
  const [selected, setSelected] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------------------- fetch submissions -------------------- */
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

        // Query submissions for this user using PK/SK pattern
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

        const queryData = await queryResponse.json();

        if (!queryData.success) {
          throw new Error(queryData.error || 'Failed to fetch submissions');
        }

        // Transform DynamoDB items to display format
        const transformedData = (queryData.items || [])
          .filter(item => item.submissionId) // Only include actual submissions
          .map(item => {
            // Calculate average score from evaluation
            const scores = item.scores || {};
            const technical = scores.technical || 0;
            const diagramming = scores.diagramming || 0;
            const linguistics = scores.linguistics || 0;
            const averageScore = Math.round((technical + diagramming + linguistics) / 3);

            // Format date from timestamp
            const date = item.timestamp 
              ? new Date(item.timestamp).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            // Create description from design challenge
            const description = item.design && item.target && item.tohelp
              ? `Design ${item.design} for ${item.target} to help ${item.tohelp}`
              : "UX Design Submission";

            // Determine category (could be enhanced based on design type)
            const category = item.design?.toLowerCase().includes('redesign') 
              ? "Redesign" 
              : "New Feature";

            return {
              submissionId: item.submissionId,
              description: description,
              grade: averageScore.toString(),
              date: date,
              category: category,
              timeLimit: "N/A", // Not stored in submission
              difficulty: "Medium", // Default, could be enhanced
              reference: `/submission/${item.submissionId}`, // Link to view details
              actions: "View",
              // Store full item for potential detail view
              fullItem: item,
            };
          })
          // Sort by timestamp descending (newest first)
          .sort((a, b) => {
            const dateA = new Date(a.fullItem?.timestamp || 0);
            const dateB = new Date(b.fullItem?.timestamp || 0);
            return dateB - dateA;
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

  /* -------------------- data -------------------- */
  const data = submissions;

  /* -------------------- filtering + pagination -------------------- */

  const ITEMS_PER_PAGE = 8;

  const filtered = data.filter((item) => {
    const matchesCategory =
      selected === "All" ||
      item.category.toLowerCase() === selected.toLowerCase();

    const matchesSearch =
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="text-black flex flex-col gap-4">
      {/* content header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar" />
          <h1 className="font-medium uppercase">History</h1>
        </div>
        <div className="flex  w-full  justify-end items-center gap-2">
          <input
            type="text"
            placeholder="Search history…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
        </div>
      </div>

      {/* category filters */}
      <div className="flex pb-3 border-b-[0.5px] border-gray-200 text-xs gap-4">
        {["All", "New Feature", "Redesign"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`uppercase relative ${
              selected === cat ? "text-orange-600" : ""
            }`}
          >
            {cat}
            {selected === cat && (
              <div className="absolute bottom-0 left-0 w-full h-px translate-y-3 bg-orange-600" />
            )}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="flex flex-col gap-3 text-xs">
        {loading ? (
          <div className="py-8 text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            Loading submissions...
          </div>
        ) : error ? (
          <div className="py-8 text-red-500 text-center">Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-gray-500 text-center">No submissions found</div>
        ) : (
          <>
            <div>{filtered.length} results found</div>

            <div className="flex gap-6 px-4 py-3 bg-gray-100 uppercase">
              <p className="w-full">Description</p>
              <p className="w-full">Grade</p>
              <p className="w-full">Date</p>
              <p className="w-full">Category</p>
              <p className="w-full">Time</p>
              <p className="w-full">Difficulty</p>
              <p className="w-full">Reference</p>
              <p className="w-full">Feedback</p>
            </div>

            {paginated.map((item) => (
              <div
                key={item.submissionId || `submission-${item.date}-${item.description}`}
                className="flex border-b-[0.5px] border-gray-200 gap-6 px-4 pb-3 items-center"
              >
                <p className="w-full line-clamp-1">{item.description}</p>

                <div className="w-full flex items-center gap-1">
                  <div
                    className={`${getGradeColor(
                      item.grade
                    )} w-1 h-1 rounded-full`}
                  />
                  {item.grade}
                </div>

                <p className="w-full">{item.date}</p>

                <div className="w-full">
                  <span
                    className={`px-2 py-1 rounded-full ${getCategoryStyle(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="w-full">{item.timeLimit}</p>

                <div className="w-full flex items-center gap-1">
                  <div
                    className={`${getDifficultyColor(
                      item.difficulty
                    )} w-1 h-1 rounded-full`}
                  />
                  {item.difficulty}
                </div>

                <p className="w-full truncate">{item.reference}</p>

                <div className="w-full">
                  <Link
                    href={item.reference}
                    className="group border border-gray-100 px-4 py-2 rounded-full flex justify-between items-center"
                  >
                    {item.actions}
                    <i className="fa-solid fa-arrow-right -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                  </Link>
                </div>
              </div>
            ))}

            {/* pagination */}
            <div className="flex  items-center">
              <div className="w-full">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-full disabled:opacity-40"
                >
                  Previous
                </button>
              </div>

              <div className="w-full flex justify-center">
                <span className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="w-full justify-end flex">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-full disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
