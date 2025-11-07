import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Filter, Calendar, MessageSquare, ThumbsUp, Map, TrendingUp, Megaphone, ArrowUpDown } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/api/config";



interface Project {
  id: number;
  title: string;
  description: string;
  location: string;
  phase: string;
  start_date?: string;
  comments_count: number;
  upvotes: number;
  downvotes: number;
}

const phaseColors: Record<string, string> = {
  "Planering": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Beslutad": "bg-purple-100 text-purple-800 border-purple-300",
  "Pågående": "bg-blue-100 text-blue-800 border-blue-300",
  "Genomfört": "bg-success/10 text-success border-success/20",
};

const Projects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("comments");

  useEffect(() => {
    apiFetch("/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        setLoading(false);
      });
  }, []);
  
  // Get unique phases for filter
  const phases = Array.from(new Set(projects.map(p => p.phase)));
  
  // Step 1: Filter by search query (text input)
  let filteredProjects = projects;
  
  if (searchQuery.trim()) {
    filteredProjects = filteredProjects.filter(project => 
      (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Step 2: Filter by phase
  if (selectedPhase !== "all") {
    filteredProjects = filteredProjects.filter(project => 
      project.phase === selectedPhase
    );
  }
  
  // Step 3: Sort projects
  filteredProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "comments":
        return b.comments_count - a.comments_count;
      case "votes":
        return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes);
      case "upvotes":
        return b.upvotes - a.upvotes;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return b.comments_count - a.comments_count;
    }
  });
  
  const handleMapView = () => {
    const params = new URLSearchParams();
    if (selectedPhase !== "all") {
      params.set("phase", selectedPhase);
    }
    navigate(`/projects/map${params.toString() ? `?${params.toString()}` : ""}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar projekt...</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Pågående och planerade projekt</h1>
          <p className="text-lg text-muted-foreground">
            Utforska Stockholms stadsbyggnadsprojekt. Kommentera, rösta och påverka din stad.
          </p>
        </div>
        
        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök projekt eller område..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto gap-2" onClick={handleMapView}>
              <Map className="h-4 w-4" />
              Visa på karta
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Phase filter */}
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrera fas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla faser</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sortera efter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comments">Antal kommentarer</SelectItem>
                <SelectItem value="votes">Totalt engagemang</SelectItem>
                <SelectItem value="upvotes">Mest uppröster</SelectItem>
                <SelectItem value="title">Titel (A-Ö)</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPhase !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedPhase("all")}>
                Rensa filter
              </Button>
            )}
          </div>
        </div>
        
        {/* Project grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-accent/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl leading-tight">{project.title}</CardTitle>
                    <Badge variant="outline" className={phaseColors[project.phase]}>
                      {project.phase}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {project.comments_count}
                    </div>
                    <div className="flex items-center gap-1.5 text-accent font-medium">
                      <Megaphone className="h-4 w-4" />
                      {project.upvotes + project.downvotes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Inga projekt hittades. Prova en annan sökning.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
