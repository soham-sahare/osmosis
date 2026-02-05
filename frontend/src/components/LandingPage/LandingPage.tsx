import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Workflow,
  Zap,
  Code2,
  Database,
  GitBranch,
  Play,
  CheckCircle2,
  Sparkles,
  FileText,
  ChevronLeft,
  LayoutGrid,
  ChevronDown,
  Undo2,
  Redo2,
  Calendar,
  Download,
  Sun,
  Save,
} from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";

export const LandingPage: React.FC = () => {
  usePageTitle("Osmosis");
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("Sources");

  const components = {
    Sources: [
      {
        name: "Database Reader",
        icon: Database,
        color: "text-blue-500",
        desc: "Read from Postgres, MySQL, Oracle, SQLite, MongoDB.",
      },
      {
        name: "File Reader",
        icon: FileText,
        color: "text-green-500",
        desc: "Parse CSV, JSON, Parquet, and Excel files from local or S3.",
      },
      {
        name: "Kafka Consumer",
        icon: Zap,
        color: "text-orange-500",
        desc: "Stream data from Kafka topics in real-time.",
      },
      {
        name: "REST Client",
        icon: Code2,
        color: "text-purple-500",
        desc: "Fetch data from any external API endpoint.",
      },
      {
        name: "Row Generator",
        icon: LayoutGrid,
        color: "text-pink-500",
        desc: "Generate mock data for testing and development.",
      },
    ],
    Processors: [
      {
        name: "Map Fields",
        icon: Workflow,
        color: "text-blue-400",
        desc: "Transform individual fields using Python expressions.",
      },
      {
        name: "Filter Rows",
        icon: GitBranch,
        color: "text-red-400",
        desc: "Filter data streams based on complex conditions.",
      },
      {
        name: "Aggregate",
        icon: LayoutGrid,
        color: "text-yellow-400",
        desc: "Group by fields and calculate sums, averages, counts.",
      },
      {
        name: "Sort",
        icon: ChevronDown,
        color: "text-cyan-400",
        desc: "Sort data stream by one or multiple columns.",
      },
      {
        name: "Deduplicate",
        icon: CheckCircle2,
        color: "text-teal-400",
        desc: "Remove duplicate records based on primary keys.",
      },
      {
        name: "Python Script",
        icon: Code2,
        color: "text-green-400",
        desc: "Execute custom Python logic on every row.",
      },
    ],
    Destinations: [
      {
        name: "Database Writer",
        icon: Database,
        color: "text-blue-600",
        desc: "Write to any supported SQL or NoSQL database.",
      },
      {
        name: "File Writer",
        icon: FileText,
        color: "text-green-600",
        desc: "Export data to CSV, JSON, Parquet formats.",
      },
      {
        name: "Kafka Producer",
        icon: Zap,
        color: "text-orange-600",
        desc: "Push transformed data to Kafka topics.",
      },
    ],
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Workflow,
      title: "Visual Pipeline Builder",
      description:
        "Drag-and-drop interface to design complex ETL workflows without writing code",
    },
    {
      icon: Zap,
      title: "Smart Execution",
      description:
        "Hybrid execution order respects dependencies while following visual layout",
    },
    {
      icon: Code2,
      title: "Workspace Variables",
      description:
        "Define global variables and reuse them across your entire workspace with {{VARIABLE}} syntax",
    },
    {
      icon: Database,
      title: "Multiple Data Sources",
      description:
        "Connect to CSV, Excel, Parquet files and transform data with powerful components",
    },
    {
      icon: GitBranch,
      title: "Advanced Transformations",
      description:
        "Filter, map, aggregate, and join data with intuitive configuration",
    },
    {
      icon: Play,
      title: "Scheduled Execution",
      description:
        "Run jobs on a schedule with cron expressions or trigger them manually",
    },
  ];

  const useCases = [
    {
      title: "Data Migration",
      description:
        "Move data between systems, transform formats, and ensure data quality",
    },
    {
      title: "Report Generation",
      description:
        "Automate daily/weekly reports by combining multiple data sources",
    },
    {
      title: "Data Cleaning",
      description: "Filter, deduplicate, and standardize messy datasets",
    },
    {
      title: "API Integration",
      description:
        "Extract data from APIs, transform, and load into your database",
    },
  ];

  const recentFeatures = [
    "Workspace Context Variables for global configuration",
    "Hybrid execution order (dependency + visual position)",
    "Multi-node selection (Shift+Click, Shift+Drag, Cmd+A)",
    "Enhanced Log components with cleaner output",
    "Improved schema propagation across components",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-[100%] blur-[100px] pointer-events-none fade-in" />

        <div
          className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-4 leading-tight">
              <span className="relative inline-block">
                
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Osmosis
                </span>
                <div className="absolute -top-2 -right-12 px-2 py-1 rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] flex items-center gap-1.5 shadow-xl">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-[#a3a3a3] tracking-wide">
                    v2.0
                  </span>
                </div>
              </span>
            </h1>
            <p className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Orchestrate Your Data With Confidence
            </p>

            <p className="text-xl text-gray-600 dark:text-[#a3a3a3] mb-10 max-w-2xl mx-auto leading-relaxed">
              Build, visualize, and schedule production-ready ETL pipelines in
              minutes. The modern data platform for engineering teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/workspaces")}
                className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div
            className="mt-20 relative max-w-6xl mx-auto rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#141414] shadow-2xl overflow-hidden animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#0a0a0a] dark:via-transparent dark:to-transparent z-10 pointer-events-none" />

            {/* Main App Window - Full Width */}
            <div className="flex flex-col h-[600px] bg-white dark:bg-[#0a0a0a]">
              {/* App Header */}
              <div className="h-12 border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#141414] flex items-center justify-between px-4 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[#666] hover:text-white cursor-pointer transition-colors">
                    <ChevronLeft size={16} />
                    <span className="text-sm font-medium">Back</span>
                  </div>
                  <div className="h-4 w-[1px] bg-[#333]"></div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      MOT SMART HRP
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[10px] text-[#666]">
                        Saved just now
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[#a3a3a3]">
                    <div className="p-1.5 hover:bg-[#222] rounded cursor-pointer hover:text-white transition-colors">
                      <Undo2 size={16} />
                    </div>
                    <div className="p-1.5 hover:bg-[#222] rounded cursor-pointer hover:text-white transition-colors">
                      <Redo2 size={16} />
                    </div>
                  </div>
                  <div className="h-4 w-[1px] bg-[#333]"></div>
                  <div className="p-1.5 hover:bg-[#222] rounded cursor-pointer text-[#a3a3a3] hover:text-white transition-colors flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="text-xs font-medium hidden lg:block">
                      Schedule
                    </span>
                  </div>
                  <div className="p-1.5 hover:bg-[#222] rounded cursor-pointer text-[#a3a3a3] hover:text-white transition-colors">
                    <Download size={16} />
                  </div>
                  <div className="p-1.5 hover:bg-[#222] rounded cursor-pointer text-[#a3a3a3] hover:text-white transition-colors">
                    <Sun size={16} />
                  </div>
                  <div className="h-4 w-[1px] bg-[#333]"></div>
                  <button className="px-3 py-1.5 text-[#ccc] hover:text-white text-xs font-semibold hover:bg-[#222] rounded transition-colors flex items-center gap-2 border border-transparent hover:border-[#333]">
                    <Save size={14} />
                    Save
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    <Play size={12} className="fill-current" />
                    Run
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* App Sidebar */}

                {/* Mock Sidebar */}
                <div className="w-64 border-r border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111] p-4 hidden md:block">
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                    Components
                  </div>
                  <div className="space-y-2">
                    {[
                      "Database Reader",
                      "Kafka Consumer",
                      "Map Fields",
                      "Filter Rows",
                      "Aggregate",
                      "Postgres Writer",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center ${i < 2 ? "bg-blue-500/10 text-blue-500" : i < 5 ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"}`}
                        >
                          <LayoutGrid size={14} />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-white dark:bg-[#0a0a0a] relative overflow-hidden group cursor-grab active:cursor-grabbing">
                  {/* Dot Grid */}
                  <div
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2]"
                    style={{
                      backgroundImage:
                        "radial-gradient(#888 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  ></div>

                  {/* Pipeline Viz */}
                  <div
                    className="relative w-full h-full fade-in-up origin-center scale-90 md:scale-100"
                    style={{ animationDelay: "0.2s" }}
                  >
                    {/* SVG Connections Layer */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none stroke-gray-300 dark:stroke-[#444]"
                      fill="none"
                      strokeWidth="2"
                    >
                      {/* Reader 1 -> Map */}
                      <path
                        d="M140 100 C 220 100, 220 180, 280 180"
                        className="opacity-50"
                      />
                      <circle
                        cx="220"
                        cy="140"
                        r="2"
                        fill="#444"
                        className="animate-[shimmer_3s_infinite]"
                        style={{ animationDuration: "3s" }}
                      />

                      {/* Reader 2 -> Map */}
                      <path
                        d="M140 260 C 220 260, 220 180, 280 180"
                        className="opacity-50"
                      />

                      {/* Map -> Filter */}
                      <path
                        d="M400 180 C 440 180, 440 140, 480 140"
                        className="opacity-50"
                      />

                      {/* Filter -> Writer */}
                      <path
                        d="M600 140 C 640 140, 640 140, 680 140"
                        className="opacity-50"
                      />
                    </svg>

                    {/* Nodes */}

                    {/* File Reader 1 */}
                    <div className="absolute top-[70px] left-[20px] w-32 p-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl flex flex-col items-center gap-2 group hover:border-blue-500/50 transition-colors cursor-pointer">
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        4
                      </div>
                      <div className="w-8 h-8 rounded bg-green-500/10 dark:bg-[#222] flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <FileText size={16} />
                      </div>
                      <div className="text-xs font-medium text-gray-700 dark:text-[#ccc]">
                        Sales Data
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#666] font-mono">
                        CSV Reader
                      </div>
                    </div>

                    {/* File Reader 2 */}
                    <div className="absolute top-[230px] left-[20px] w-32 p-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl flex flex-col items-center gap-2 group hover:border-blue-500/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-[#222] flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Database size={16} />
                      </div>
                      <div className="text-xs font-medium text-gray-700 dark:text-[#ccc]">
                        User Users
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#666] font-mono">
                        Postgres
                      </div>
                    </div>

                    {/* Map Node */}
                    <div className="absolute top-[150px] left-[280px] w-32 p-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl flex flex-col items-center gap-2 z-10 hover:border-blue-500/50 transition-colors cursor-pointer">
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                        4
                      </div>
                      <div className="w-8 h-8 rounded bg-purple-500/10 dark:bg-[#222] flex items-center justify-center text-purple-400">
                        <Workflow size={16} />
                      </div>
                      <div className="text-xs font-medium text-gray-700 dark:text-[#ccc]">
                        Transform
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#666] font-mono">
                        Map Fields
                      </div>
                    </div>

                    {/* Filter Node */}
                    <div className="absolute top-[110px] left-[480px] w-32 p-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl flex flex-col items-center gap-2 hover:border-blue-500/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded bg-orange-500/10 dark:bg-[#222] flex items-center justify-center text-orange-400">
                        <GitBranch size={16} />
                      </div>
                      <div className="text-xs font-medium text-gray-700 dark:text-[#ccc]">
                        Active Users
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#666] font-mono">
                        Filter
                      </div>
                    </div>

                    {/* Writer Node */}
                    <div className="absolute top-[110px] left-[680px] w-32 p-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl flex flex-col items-center gap-2 hover:border-blue-500/50 transition-colors cursor-pointer">
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div className="w-8 h-8 rounded bg-green-500/10 dark:bg-[#222] flex items-center justify-center text-green-400">
                        <Database size={16} />
                      </div>
                      <div className="text-xs font-medium text-gray-700 dark:text-[#ccc]">
                        Analytics DB
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#666] font-mono">
                        Writer
                      </div>
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-white dark:bg-[#111] border border-gray-300 dark:border-green-500/30 rounded-full flex items-center gap-2 shadow-2xl z-30 ring-1 ring-black/5 dark:ring-green-500/20">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      <span className="text-xs font-mono text-gray-900 dark:text-green-400 font-bold tracking-wide">
                        Pipeline Running: 1.2s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Components Showcase Section */}
      <div className="py-24 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-[#262626]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Comprehensive Component Library
            </h2>
            <p className="text-gray-600 dark:text-[#a3a3a3] text-lg max-w-2xl mx-auto">
              Connect to anything, transform everything. Over 20+ built-in
              components ready to use.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 dark:bg-[#141414] p-1 rounded-xl border border-gray-200 dark:border-[#262626]">
              {["Sources", "Processors", "Destinations"].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-[#a3a3a3] hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#222]"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {components[activeTab as keyof typeof components].map((comp, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] p-6 rounded-xl hover:border-blue-500/30 transition-colors group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-3 rounded-lg ${comp.color.replace("text-", "bg-")}/10 ${comp.color}`}
                  >
                    <comp.icon size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {comp.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-[#a3a3a3] leading-relaxed">
                  {comp.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Installation Section */}
      <div className="py-24 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#262626]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Get Started in Minutes
              </h2>
              <p className="text-gray-600 dark:text-[#a3a3a3] text-lg mb-8">
                Open source and easy to deploy. Run locally with Docker or
                install manually on your server.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      Clone Repository
                    </h4>
                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-[#a3a3a3] shadow-sm dark:shadow-none">
                      <span className="text-blue-500 dark:text-blue-400">
                        git
                      </span>{" "}
                      clone https://github.com/sohamsahare/Osmosis.git
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      Backend Setup
                    </h4>
                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-[#a3a3a3] shadow-sm dark:shadow-none">
                      <div className="mb-2">
                        <span className="text-purple-500 dark:text-purple-400">
                          cd
                        </span>{" "}
                        *backend* && python -m venv venv
                      </div>
                      <div className="mb-2">
                        <span className="text-purple-500 dark:text-purple-400">
                          source
                        </span>{" "}
                        venv/bin/activate
                      </div>
                      <div>
                        <span className="text-purple-500 dark:text-purple-400">
                          pip
                        </span>{" "}
                        install -r requirements.txt
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      Frontend Setup
                    </h4>
                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-[#a3a3a3] shadow-sm dark:shadow-none">
                      <div className="mb-2">
                        <span className="text-purple-500 dark:text-purple-400">
                          cd
                        </span>{" "}
                        *frontend*
                      </div>
                      <div className="mb-2">
                        <span className="text-purple-500 dark:text-purple-400">
                          npm
                        </span>{" "}
                        install
                      </div>
                      <div>
                        <span className="text-purple-500 dark:text-purple-400">
                          npm
                        </span>{" "}
                        run dev
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-2xl p-8 relative z-10 shadow-2xl">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-[#262626] pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-xs text-gray-500 dark:text-[#666] font-mono">
                    terminal — zsh
                  </span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <div>
                    <span className="text-green-500 dark:text-green-400">
                      ➜
                    </span>{" "}
                    <span className="text-blue-500 dark:text-blue-400">
                      Osmosis
                    </span>{" "}
                    <span className="text-gray-500 dark:text-[#666]">
                      git:(main)
                    </span>{" "}
                    python app.py
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    INFO: Started server process [12345]
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    INFO: Waiting for application startup.
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    INFO: Application startup complete.
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    INFO: Uvicorn running on http://127.0.0.1:8000
                  </div>
                  <div className="h-4" />
                  <div>
                    <span className="text-green-500 dark:text-green-400">
                      ➜
                    </span>{" "}
                    <span className="text-blue-500 dark:text-blue-400">
                      Osmosis
                    </span>{" "}
                    <span className="text-gray-500 dark:text-[#666]">
                      git:(main)
                    </span>{" "}
                    npm run dev
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    <span className="text-green-500 dark:text-green-400">
                      VITE v4.4.9
                    </span>{" "}
                    ready in 345 ms
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4"></div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    {" "}
                    ➜{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      Local:
                    </span>{" "}
                    http://localhost:5173/
                  </div>
                  <div className="text-gray-500 dark:text-[#a3a3a3] pl-4">
                    {" "}
                    ➜{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      Network:
                    </span>{" "}
                    use --host to expose
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="py-24 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-[#262626]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works: Under the Hood
            </h2>
            <p className="text-gray-600 dark:text-[#a3a3a3] text-lg max-w-2xl mx-auto">
              A transparent look at the engineering decisions behind Osmosis.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-8">
            {/* Step 1: Hybrid Storage */}
            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl overflow-hidden group hover:border-blue-500/30 transition-colors p-8 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Database size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  1. Hybrid Storage Layer
                </h3>
              </div>
              <p className="text-gray-600 dark:text-[#a3a3a3] mb-6 leading-relaxed">
                We use a hybrid approach to optimize for both performance and
                portability. Configuration is split between structured
                relational data and portable file-based assets.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded-lg p-4">
                  <div className="text-gray-900 dark:text-white font-bold mb-2 flex items-center gap-2">
                    <Database size={14} className="text-purple-500" /> SQLite
                    Database
                  </div>
                  <ul className="text-sm text-gray-500 dark:text-[#666] space-y-1 ml-6 list-disc">
                    <li>Job Metadata & Schedules</li>
                    <li>Execution History & Logs</li>
                    <li>Context Variables (Secrets)</li>
                    <li>Workspace Configuration</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded-lg p-4">
                  <div className="text-gray-900 dark:text-white font-bold mb-2 flex items-center gap-2">
                    <FileText size={14} className="text-yellow-500" /> File
                    System (JSON)
                  </div>
                  <ul className="text-sm text-gray-500 dark:text-[#666] space-y-1 ml-6 list-disc">
                    <li>Database Connections</li>
                    <li>File Mount Configurations</li>
                    <li>Exported Pipeline Blueprints</li>
                    <li>Local Data Cache</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2: Execution Engine */}
            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl overflow-hidden group hover:border-green-500/30 transition-colors p-8 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                  <Workflow size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  2. Intelligent Execution Engine
                </h3>
              </div>
              <p className="text-gray-600 dark:text-[#a3a3a3] mb-6 leading-relaxed">
                The engine linearizes your visual graph into an optimized
                execution plan, ensuring data integrity and respecting all
                upstream dependencies.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-xs font-mono text-gray-500 dark:text-[#666]">
                    1
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                      Topological Sort (Kahn's Algorithm)
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#666]">
                      We treat the pipeline as a Directed Acyclic Graph (DAG)
                      and use Kahn's algorithm to resolve a linear execution
                      order `O(V+E)` that guarantees dependencies are met before
                      a node runs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-xs font-mono text-gray-500 dark:text-[#666]">
                    2
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                      Modular Executors & Context
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#666]">
                      Each node runs in an isolated `Executor` class. The engine
                      passes a `JobContext` containing resolved variables,
                      database connections, and file system pointers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-xs font-mono text-gray-500 dark:text-[#666]">
                    3
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                      Data Flow Optimization
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#666]">
                      Data is passed between nodes as in-memory Pandas
                      DataFrames, minimizing serialization overhead for
                      high-throughput processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="py-24 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#262626]"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-gray-600 dark:text-[#a3a3a3] text-lg max-w-2xl mx-auto">
              Everything you need to build, monitor, and scale your data
              infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-300 group shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#262626] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-[#a3a3a3] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div id="use-cases" className="py-24 bg-white dark:bg-[#0f0f0f]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Built for Scale
              </h2>
              <p className="text-gray-600 dark:text-[#a3a3a3] text-lg">
                Whether you're moving gigabytes or petabytes, Osmosis scales
                with you.
              </p>
            </div>
            <button className="text-blue-500 dark:text-blue-400 font-medium hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-2 group">
              View all integrations{" "}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="flex gap-6 p-6 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#222] transition-colors shadow-sm dark:shadow-none"
              >
                <div className="shrink-0 mt-1">
                  <CheckCircle2 className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-[#a3a3a3]">
                    {useCase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Updates Section */}
      <div id="updates" className="py-24 container mx-auto px-6">
        <div className="bg-gradient-to-br from-gray-100 to-white dark:from-[#141414] dark:to-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-[#262626] p-12 relative overflow-hidden shadow-xl dark:shadow-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-16 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-6">
                <Sparkles className="text-blue-400 w-5 h-5" />
                <span className="text-blue-400 font-semibold tracking-wide uppercase text-sm">
                  What's New
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Continuous Innovation
              </h2>
              <p className="text-gray-600 dark:text-[#a3a3a3] mb-8 text-lg">
                We release updates weekly to help you build better pipelines.
              </p>
              <button
                onClick={() => navigate("/workspaces")}
                className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black font-semibold rounded-lg dark:hover:bg-gray-200 transition-colors shadow-lg dark:shadow-none"
              >
                Available Now
              </button>
            </div>
            <div className="flex-1 space-y-4">
              {recentFeatures.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] shadow-sm dark:shadow-none"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-gray-700 dark:text-[#e5e5e5] font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-[#262626] py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 dark:text-[#666] text-sm">
            © {new Date().getFullYear()} sohamsahare.
          </p>
        </div>
      </footer>
    </div>
  );
};
