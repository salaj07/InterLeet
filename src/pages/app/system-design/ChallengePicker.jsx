import React, { useState, useMemo, useCallback } from "react";
import { Search, Clock, Users } from "lucide-react";
import { templates } from "@/lib/simulator/templates";
import { challenges, blankChallenge } from "@/lib/simulator/challenges";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { DifficultyPill } from "@/components/domain/Tags";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input as UiInput } from "@/components/ui/input";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function ChallengePicker({ onPick, onPickTemplate }) {
  const [tab, setTab] = useState("challenges"); // "challenges" | "practice"
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recommended");

  const all = useMemo(() => [blankChallenge, ...challenges], []);

  // Enrich challenges with metadata for a better UI experience
  const enrichedChallenges = useMemo(() => {
    const data = {
      "url-shortener": { duration: "30m", popularity: 94, attempts: 2420, completion: 82, lastAttempted: "2 days ago", type: "System Design", date: "2026-05-15", progress: "Completed" },
      "video-streaming": { duration: "45m", popularity: 88, attempts: 1850, completion: 45, lastAttempted: "1 week ago", type: "System Design", date: "2026-05-01", progress: "In Progress" },
      "ride-sharing": { duration: "50m", popularity: 91, attempts: 1980, completion: 0, lastAttempted: "Not attempted", type: "Realtime Systems", date: "2026-04-20", progress: "Not Started" },
      "chat-app": { duration: "35m", popularity: 96, attempts: 3200, completion: 74, lastAttempted: "Yesterday", type: "System Design", date: "2026-05-10", progress: "Completed" },
      "ecommerce": { duration: "40m", popularity: 92, attempts: 2100, completion: 0, lastAttempted: "Not attempted", type: "System Design", date: "2026-05-05", progress: "Not Started" },
      "social-feed": { duration: "45m", popularity: 89, attempts: 1540, completion: 48, lastAttempted: "3 days ago", type: "System Design", date: "2026-04-25", progress: "In Progress" },
      "blank": { duration: "Self-paced", popularity: 99, attempts: 5400, completion: 100, lastAttempted: "1 day ago", type: "Sandbox", date: "2026-01-01", progress: "In Progress" }
    };
    
    return all.map(c => ({
      ...c,
      ...(data[c.id] || { duration: "30m", popularity: 80, attempts: 500, completion: 0, lastAttempted: "Not attempted", type: "System Design", date: "2026-01-01", progress: "Not Started" })
    }));
  }, [all]);

  const enrichedTemplates = useMemo(() => {
    const categoriesMap = {
      "basic-web": "Basic",
      "ecommerce": "E-Commerce",
      "url-shortener": "Storage",
      "chat": "Messaging",
      "netflix": "Streaming",
      "instagram": "Social Media",
      "uber": "Distributed Systems",
      "whatsapp": "Messaging",
      "youtube": "Streaming",
      "ai-saas": "AI"
    };
    
    return templates.map(t => ({
      ...t,
      category: categoriesMap[t.id] || "Distributed Systems",
      description: t.description || `Prebuilt ${t.name} reference architecture. Tweak nodes, connect services, and simulate real load.`
    }));
  }, []);

  // Helper to map challenges to categories
  const getChallengeCategories = useCallback((ch) => {
    const list = ["Distributed Systems"];
    if (ch.tags.includes("Messaging") || ch.id === "chat-app") list.push("Messaging");
    if (ch.tags.includes("Feed") || ch.id === "social-feed" || ch.id === "ride-sharing") list.push("Social Media");
    if (ch.tags.includes("CDN") || ch.tags.includes("Encoding") || ch.id === "video-streaming") list.push("Streaming");
    if (ch.id === "ecommerce" || ch.tags.includes("Catalog") || ch.tags.includes("Orders") || ch.tags.includes("Payments")) list.push("E-Commerce");
    if (ch.tags.includes("Search") || ch.id === "ecommerce") list.push("Search");
    if (ch.tags.includes("Database") || ch.tags.includes("Storage") || ch.id === "url-shortener" || ch.id === "video-streaming" || ch.id === "social-feed") list.push("Storage");
    if (ch.tags.includes("CDN") || ch.id === "url-shortener" || ch.id === "video-streaming") list.push("CDN");
    return list;
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = enrichedChallenges.length;
    const easy = enrichedChallenges.filter(c => c.difficulty === "Easy").length;
    const medium = enrichedChallenges.filter(c => c.difficulty === "Medium").length;
    const hard = enrichedChallenges.filter(c => c.difficulty === "Hard").length;
    
    const completed = enrichedChallenges.filter(c => c.progress === "Completed").length;
    const inProgress = enrichedChallenges.filter(c => c.progress === "In Progress").length;
    const notStarted = enrichedChallenges.filter(c => !c.progress || c.progress === "Not Started").length;

    return { total, easy, medium, hard, completed, inProgress, notStarted };
  }, [enrichedChallenges]);

  // Featured challenge
  const featuredChallenge = useMemo(() => {
    return enrichedChallenges.find(c => c.id === "url-shortener");
  }, [enrichedChallenges]);

  // Filtering challenges
  const filteredChallenges = useMemo(() => {
    return enrichedChallenges.filter((ch) => {
      // Difficulty filter
      if (diff !== "all" && ch.difficulty !== diff) return false;
      
      // Category filter
      if (category !== "all") {
        const cats = getChallengeCategories(ch);
        if (!cats.includes(category)) return false;
      }
      
      // Search text filter
      if (q) {
        const term = q.toLowerCase();
        const matchTitle = ch.title.toLowerCase().includes(term);
        const matchBrief = ch.brief.toLowerCase().includes(term);
        const matchTags = ch.tags.some(t => t.toLowerCase().includes(term));
        const matchCats = getChallengeCategories(ch).some(c => c.toLowerCase().includes(term));
        if (!matchTitle && !matchBrief && !matchTags && !matchCats) return false;
      }
      
      return true;
    });
  }, [enrichedChallenges, diff, category, q, getChallengeCategories]);

  // Sorting challenges
  const sortedChallenges = useMemo(() => {
    let list = [...filteredChallenges];
    
    if (sort === "popular") {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sort === "beginner") {
      const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3, "Free": 4 };
      list.sort((a, b) => (diffWeight[a.difficulty] || 99) - (diffWeight[b.difficulty] || 99));
    } else if (sort === "difficulty") {
      const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3, "Free": 4 };
      list.sort((a, b) => (diffWeight[a.difficulty] || 99) - (diffWeight[b.difficulty] || 99));
    } else if (sort === "newest") {
      list.sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    } else {
      // "recommended" - custom order: Blank canvas last
      list.sort((a, b) => {
        if (a.id === "blank") return 1;
        if (b.id === "blank") return -1;
        return (b.popularity || 0) - (a.popularity || 0); // then by popularity
      });
    }
    return list;
  }, [filteredChallenges, sort]);

  // Exclude featured challenge from grid list when displaying in the featured section
  const displayChallenges = useMemo(() => {
    const showFeatured = category === "all" && diff === "all" && !q && featuredChallenge;
    if (showFeatured) {
      return sortedChallenges.filter(c => c.id !== featuredChallenge.id);
    }
    return sortedChallenges;
  }, [sortedChallenges, category, diff, q, featuredChallenge]);

  // Filtering templates
  const filteredTemplates = useMemo(() => {
    return enrichedTemplates.filter((t) => {
      // Category filter
      if (category !== "all" && t.category !== category && category !== "Distributed Systems") {
        if (category === "Social Media" && t.category !== "Social Media") return false;
        if (category === "Messaging" && t.category !== "Messaging") return false;
        if (category === "Streaming" && t.category !== "Streaming") return false;
        if (category === "E-Commerce" && t.category !== "E-Commerce") return false;
        if (category === "Storage" && t.category !== "Storage") return false;
        if (category === "CDN" && t.category !== "CDN" && t.category !== "Streaming" && t.category !== "Social Media") return false;
        if (t.category !== category) return false;
      }

      // Search text filter
      if (q) {
        const term = q.toLowerCase();
        const matchName = t.name.toLowerCase().includes(term);
        const matchDesc = t.description.toLowerCase().includes(term);
        const matchCategory = t.category.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchCategory) return false;
      }

      return true;
    });
  }, [enrichedTemplates, category, q]);

  const categories = [
    "Messaging",
    "Social Media",
    "Streaming",
    "E-Commerce",
    "Search",
    "Storage",
    "CDN",
    "Distributed Systems"
  ];

  return (
    <AppShell>
      <PageHeader
        title="System Design Simulator"
        description="Design and simulate scalable distributed systems."
        actions={
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 border-r border-border pr-4">
              <span className="font-semibold text-foreground">{stats.total}</span> Challenges
            </div>
            <div className="flex items-center gap-1.5 border-r border-border pr-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-foreground">{stats.easy}</span> Easy
            </div>
            <div className="flex items-center gap-1.5 border-r border-border pr-4">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-foreground">{stats.medium}</span> Medium
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="font-semibold text-foreground">{stats.hard}</span> Hard
            </div>
          </div>
        }
      />

      <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Challenges</div>
            <div className="mt-1 text-2xl font-bold font-mono">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Easy
            </div>
            <div className="mt-1 text-2xl font-bold text-success font-mono">{stats.easy}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" /> Medium
            </div>
            <div className="mt-1 text-2xl font-bold text-warning font-mono">{stats.medium}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> Hard
            </div>
            <div className="mt-1 text-2xl font-bold text-destructive font-mono">{stats.hard}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="mt-1 text-2xl font-bold text-emerald-500 font-mono">{stats.completed}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">In Progress</div>
            <div className="mt-1 text-2xl font-bold text-amber-500 font-mono">{stats.inProgress}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Not Started</div>
            <div className="mt-1 text-2xl font-bold text-muted-foreground font-mono">{stats.notStarted}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-border">
          <button
            onClick={() => {
              setTab("challenges");
              setCategory("all");
            }}
            className={cn(
              "pb-3 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              tab === "challenges"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Challenges
          </button>
          <button
            onClick={() => {
              setTab("practice");
              setCategory("all");
            }}
            className={cn(
              "pb-3 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              tab === "practice"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Practice / Templates
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, tags, or concepts..."
              className="h-9 border-transparent bg-background pl-9"
            />
          </div>
          {tab === "challenges" && (
            <div className="flex flex-wrap items-center gap-2">
              <UiSelect value={diff} onValueChange={setDiff}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any difficulty</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </UiSelect>

              <UiSelect value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="beginner">Beginner Friendly</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </UiSelect>
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer",
              category === "all"
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "all" : c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer",
                category === c
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {tab === "challenges" ? sortedChallenges.length : filteredTemplates.length} matches
          </span>
        </div>

        {/* Featured Section */}
        {tab === "challenges" && category === "all" && diff === "all" && !q && featuredChallenge && (
          <div className="mt-6">
            <div className="mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Featured Challenge</div>
            <div
              onClick={() => onPick(featuredChallenge)}
              className="group block cursor-pointer"
            >
              <Card className="border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {featuredChallenge.type}
                      </span>
                      <DifficultyPill d={featuredChallenge.difficulty} />
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full font-mono text-[10px] uppercase tracking-wider">
                        Recommended Start
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2 text-white">
                      {featuredChallenge.title}
                      {featuredChallenge.progress === "Completed" && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" title="Completed" />
                      )}
                      {featuredChallenge.progress === "In Progress" && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title="In Progress" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-3xl">
                      {featuredChallenge.brief}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {featuredChallenge.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t border-border pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 md:min-w-[200px] text-xs text-muted-foreground space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Duration</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredChallenge.duration}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Attempts</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {featuredChallenge.attempts.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status</span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        {featuredChallenge.progress === "Completed" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        {featuredChallenge.progress === "In Progress" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        {featuredChallenge.progress === "Not Started" && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
                        {featuredChallenge.progress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Attempted</span>
                      <span className="font-semibold text-foreground">{featuredChallenge.lastAttempted}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {tab === "challenges" ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => onPick(ch)}
                className="group block cursor-pointer"
              >
                <Card className="h-full border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {ch.type}
                      </span>
                      {ch.difficulty === "Free" ? (
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full font-mono text-[10px] uppercase tracking-wider">
                          Sandbox
                        </Badge>
                      ) : (
                        <DifficultyPill d={ch.difficulty} />
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors flex items-center justify-between gap-2 text-white text-left">
                      <span>{ch.title}</span>
                      {ch.progress === "Completed" && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Completed" />
                      )}
                      {ch.progress === "In Progress" && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="In Progress" />
                      )}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground text-left">{ch.brief}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ch.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {ch.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {ch.attempts.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {ch.progress === "Completed" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {ch.progress === "In Progress" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {ch.progress === "Not Started" && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
                      {ch.progress}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => onPickTemplate(t)}
                className="group block cursor-pointer"
              >
                <Card className="h-full border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t.category}
                      </span>
                      <Badge variant="outline" className="border-border bg-muted/20 text-muted-foreground rounded-full font-mono text-[10px] uppercase tracking-wider">
                        Template
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors text-white text-left">
                      {t.name}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground text-left">{t.description}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {t.nodes.length} nodes
                    </span>
                    <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {t.edges.length} connections
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((tab === "challenges" && sortedChallenges.length === 0) || (tab === "practice" && filteredTemplates.length === 0)) && (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
            <Badge variant="outline" className="mx-auto">No matches</Badge>
            <p className="mt-3 text-sm text-muted-foreground">Try clearing some filters.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
