"use client";
import { useState } from "react";
import Link from "next/link";
const History = () => {
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

  const [selected, setSelected] = useState("All");
  const [search, setSearch] = useState("");
  const data = [
    {
      description: "Design a new feature for the app",
      grade: "41",
      date: "2025-01-01",
      category: "New Feature",
      timeLimit: "10 minutes",
      difficulty: "Easy",
      reference: "https://www.google.com",
      actions: "View",
    },
    {
      description: "Design a new feature for the app",
      grade: "41",
      date: "2025-01-01",
      category: "Redesign",
      timeLimit: "10 minutes",
      difficulty: "Easy",
      reference: "https://www.google.com",
      actions: "View",
    },
    {
      description: "Design a new feature for the app",
      grade: "41",
      date: "2025-01-01",
      category: "New Feature",
      timeLimit: "10 minutes",
      difficulty: "Easy",
      reference: "https://www.google.com",
      actions: "View",
    },
    {
      description: "Design a new feature for the app",
      grade: "41",
      date: "2025-01-01",
      category: "New Feature",
      timeLimit: "10 minutes",
      difficulty: "Easy",
      reference: "https://www.google.com",
      actions: "View",
    },
    {
      description: "Design a new feature for the app",
      grade: "41",
      date: "2025-01-01",
      category: "New Feature",
      timeLimit: "10 minutes",
      difficulty: "Easy",
      reference: "https://www.google.com",
      actions: "View",
    },
  ];
  return (
    <div className="text-black p-12 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar"></i>
          <h1 className="font-medium uppercase">History</h1>
        </div>
        <div className="flex items-center w-full justify-end gap-2">
          <input
            type="text"
            placeholder="Search history…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
          <button className="cursor-pointer flex items-center text-xs gap-2 border border-gray-300 rounded-full px-3 py-2">
            <i className="fa-solid fa-filter "></i>
            Filter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex py-3 border-b border-gray-200 text-xs gap-4">
        <button
          onClick={() => setSelected("All")}
          className={`uppercase ${
            selected === "All" ? "border-b border-orange-600" : ""
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelected("New Feature")}
          className={`uppercase ${
            selected === "New Feature" ? "border-b border-orange-600" : ""
          }`}
        >
          New Feature
        </button>
        <button
          onClick={() => setSelected("Redesign")}
          className={`uppercase ${
            selected === "Redesign" ? "border-b border-orange-600" : ""
          }`}
        >
          Redesign
        </button>
      </div>

      {/* table header */}

      {/* table body */}
      <div className="flex flex-col gap-4 text-xs">
        {(() => {
          const filtered = data.filter((item) => {
            const matchesCategory =
              selected === "All" ||
              item.category.toLowerCase() === selected.toLowerCase();

            const matchesSearch =
              item.description.toLowerCase().includes(search.toLowerCase()) ||
              item.category.toLowerCase().includes(search.toLowerCase());

            return matchesCategory && matchesSearch;
          });

          if (filtered.length === 0) {
            return (
              <div className="px-4 py-8 text-xs text-gray-500 text-center">
                No results found
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-3">
              {filtered.length} results found
              <div className="flex gap-6 text-xs items-center px-4 py-3 bg-gray-100">
                <p className="w-full uppercase ">Description</p>
                <p className="w-full uppercase ">Grade</p>
                <p className="w-full uppercase ">Date</p>
                <p className="w-full uppercase ">Category</p>
                <p className="w-full uppercase ">Time Limit</p>
                <p className="w-full uppercase ">Difficulty</p>
                <p className="w-full uppercase ">Reference</p>
                <p className="w-full uppercase ">Actions</p>
              </div>
              {filtered.map((item, index) => (
                <div
                  key={index}
                  className="flex border-b border-gray-200 gap-6 items-center px-4 pb-3"
                >
                  <p className="w-full line-clamp-1">{item.description}</p>
                  <div className="w-full flex items-center gap-1">
                    <div
                      className={`${getGradeColor(
                        item.grade
                      )} w-1 h-1 rounded-full`}
                    />{" "}
                    {item.grade}
                  </div>
                  <p className="w-full">{item.date}</p>
                  <div className="w-full">
                    <p
                      className={`w-fit px-2 py-1 rounded-full ${getCategoryStyle(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </p>
                  </div>
                  <p className="w-full">{item.timeLimit}</p>
                  <div className="w-full flex items-center gap-1">
                    <div
                      className={`${getDifficultyColor(
                        item.difficulty
                      )} w-1 h-1 rounded-full`}
                    />{" "}
                    {item.difficulty}
                  </div>
                  <p className="w-full">{item.reference}</p>
                  <div className="w-full">
                    <Link
                      href={item.reference}
                      className="border justify-between group border-gray-100 w-full px-4 py-2 rounded-full flex items-center "
                    >
                      {item.actions}
                      <i className="group-hover:rotate-0 -rotate-45 transition-all duration-300 fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default History;
