import { useParams, useNavigate, Link} from "react-router-dom";
import { MapPin, Calendar, ThumbsUp, ThumbsDown, MessageSquare, Share2, Image as ImageIcon, Newspaper, ExternalLink, ArrowLeft } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ConsultationForm from "@/components/ConsultationForm";
import { extractFirstHeadingAndRest } from "@/lib/utils";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { apiFetch } from "@/api/config";

type DecisionStep = { step: string; period?: string };

type NewsArticle = {
  title: string;
  url: string;
  source?: string;
  date?: string;    // ISO
  summary?: string;
};

interface Project {
  id: number;
  title: string;
  description: string;
  location: string;
  phase: string;
  comments_count: number;
  upvotes: number;
  downvotes: number;
  url: string;
  tidplan_html?: string;
  user_vote?: string;
  latitude?: number;
  longitude?: number;
  images?: string;
}

interface Comment {
  id: number;
  project_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  likes: number;
  liked_by_user?: boolean;
}

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const phaseColors: Record<string, string> = {
  "Planering": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Beslutad": "bg-purple-100 text-purple-800 border-purple-300",
  "Pågående": "bg-blue-100 text-blue-800 border-blue-300",
  "Genomfört": "bg-success/10 text-success border-success/20",
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[] | null>(null);   // null = ej hämtat, [] = tomt
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      apiFetch(`/projects/${id}`).then(res => res.json()),
      apiFetch(`/projects/${id}/comments`).then(res => res.json())
    ])
      .then(([projectData, commentsData]) => {
        setProject(projectData);
        setComments(commentsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch project:", err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    setNews(null);
    setNewsError(null);

    apiFetch(`/projects/${id}/news`)
      .then(async (res) => {
        if (!res.ok) {
          const e = await res.text().catch(() => "");
          throw new Error(e || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((items: NewsArticle[]) => {
        // sortera nyaste först om du vill
        items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        setNews(items);
      })
      .catch((err) => {
        console.error("Failed to fetch news:", err);
        setNews([]);           // viktig: [] gör att kortet inte visas
        setNewsError(err.message);
      });
  }, [id]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      toast({
        title: "Logga in för att rösta",
        description: "Du måste vara inloggad för att rösta på projekt.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      const res = await apiFetch("/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: Number(id), vote_type: voteType }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to vote");
      }

      // Refresh project data
      const projectData = await apiFetch(`/projects/${id}`).then(res => res.json());
      setProject(projectData);
    } catch (err: any) {
      toast({
        title: "Kunde inte rösta",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Logga in för att kommentera",
        description: "Du måste vara inloggad för att kommentera.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const res = await apiFetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: Number(id), content: newComment }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to post comment");
      }

      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment("");

      toast({
        title: "Kommentar publicerad",
        description: "Din kommentar har lagts till.",
      });
    } catch (err: any) {
      toast({
        title: "Kunde inte publicera kommentar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Logga in för att gilla",
        description: "Du måste vara inloggad för att gilla en kommentar.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Prevent liking your own comment
    if (comment.user_id === user?.id) {
      toast({
        title: "Du kan inte gilla din egen kommentar",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiFetch(`/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Kunde inte gilla kommentaren");
      const data = await res.json();

      // Update likes count and liked_by_user state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes: data.likes, liked_by_user: data.liked }
            : c
        )
      );
    } catch (err: any) {
      toast({
        title: "Fel",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar projekt...</p>
        </main>
      </div>
    );
  }

  const totalVotes = project.upvotes + project.downvotes;
  const supportPercentage = totalVotes > 0 ? Math.round((project.upvotes / totalVotes) * 100) : 0;


  const hasTidplan = !!project.tidplan_html?.trim();
  const { title: tidplanTitle, content: tidplanContent } = extractFirstHeadingAndRest(project.tidplan_html);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Badge variant="outline" className={`mb-3 ${phaseColors[project.phase] || 'bg-accent/10 text-accent border-accent/20'}`}>
                {project.phase}
              </Badge>
              <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </div>
                {/* <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Start: {project.start_date || "TBA"}
                </div> */}
                {/* {project.estimated_completion && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Klart: {project.estimated_completion}
                  </div>
                )} */}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Om projektet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
                      {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Läs mer om projektet →
                      </a>
                    )}
              </CardContent>
            </Card>

            {/* Image Gallery */}
            {project.images && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Bild
                  </CardTitle>
                </CardHeader>
                <CardContent>
                      <img
                        src={project.images}
                        alt={`${project.title} - bild`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(project.images)}
                      />
                </CardContent>
              </Card>
            )}

            {/* Tidplan - HTML rendering */}
            {hasTidplan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {tidplanTitle ?? "Tidplan"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: tidplanContent }}
                  />
                </CardContent>
              </Card>
            )}

            {/* News Articles */}
            {news && news.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Nyhetsartiklar
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="space-y-4">
                  {news.map((a, idx) => (
                    <li key={idx} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline break-words"
                          title={a.title}
                          >
                            {a.title}
                          </a>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            {a.source && <span className="uppercase tracking-wide">{a.source}</span>}
                            {a.date && (
                              <>
                                <span>•</span>
                                <time dateTime={a.date}>
                                  {new Date(a.date).toLocaleDateString("sv-SE")}
                                </time>
                              </>
                            )}
                          </div>
                          {a.summary && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {a.summary}
                            </p>
                          )}
                          </div>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                          >
                            Öppna <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* (valfritt) liten placeholder medan nyheter hämtas */}
          {news === null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Nyhetsartiklar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Hämtar nyheter…</p>
              </CardContent>
            </Card>
          )}

            {/* Mini Map */}
            {project.latitude && project.longitude && !selectedImage &&(
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Projektets plats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[project.latitude, project.longitude]}
                      zoom={14}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[project.latitude, project.longitude]} />
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Kommentarer ({project.comments_count})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add comment */}
                <div className="space-y-3">
                  <Textarea 
                    placeholder={isAuthenticated ? "Skriv din kommentar eller fråga här..." : "Logga in för att kommentera"}
                    className="min-h-[100px]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!isAuthenticated}
                  />
                  <div className="flex justify-end">
                    <Button 
                      variant="accent" 
                      onClick={handleCommentSubmit}
                      disabled={!isAuthenticated || !newComment.trim() || submitting}
                    >
                      {submitting ? "Publicerar..." : "Publicera kommentar"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments list */}
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Inga kommentarer än. Var första att kommentera!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              to={`/profile/${comment.user_id}`}
                              className="font-medium hover:underline"
                            >
                              {comment.user_name}
                            </Link>
                            {/* <p className="font-medium">{comment.user_name}</p> */}
                            <p className="text-sm text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString("sv-SE")}
                            </p>
                          </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex items-center gap-1 text-sm transition-colors ${
                                comment.liked_by_user ? "text-accent" : "text-muted-foreground"
                              }`}
                              onClick={() => handleLike(comment.id)}
                              disabled={comment.user_id === user?.id} // disable for own comments
                            >
                              <ThumbsUp
                                className={`h-4 w-4 ${
                                  comment.liked_by_user ? "fill-accent stroke-accent" : ""
                                }`}
                              />
                              <span>{comment.likes}</span>
                            </Button>
                        </div>
                        <p className="text-muted-foreground">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - engagement */}
          <div className="space-y-6">
            {/* Voting card */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medborgarsupport</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stöd projektet</span>
                    <span className="font-semibold text-success">{supportPercentage}%</span>
                  </div>
                  <Progress value={supportPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{totalVotes} röster totalt</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    variant={project.user_vote === "upvote" ? "success" : "outline"} 
                    className="w-full gap-2"
                    onClick={() => handleVote("upvote")}
                    disabled={!isAuthenticated && project.user_vote !== "upvote"}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={project.user_vote === "downvote" ? "destructive" : "outline"}
                    className="w-full gap-2"
                    onClick={() => handleVote("downvote")}
                    disabled={!isAuthenticated && project.user_vote !== "downvote"}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground">
                    Logga in för att rösta
                  </p>
                )}
              </CardContent>
            </Card> */}
          <Card>
  <CardHeader>
    <CardTitle>Medborgarsupport</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex gap-3">
      <Button
        className={`flex-1 ${project.user_vote === "upvote" ? "bg-green-500 hover:bg-green-600" : ""}`}
        onClick={() => handleVote("upvote")}
        disabled={!isAuthenticated}
      >
        <ThumbsUp className="h-5 w-5 mr-2" />
      </Button>
      <Button
        variant="outline"
        className={`flex-1 ${project.user_vote === "downvote" ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
        onClick={() => handleVote("downvote")}
        disabled={!isAuthenticated}
      >
        <ThumbsDown className="h-5 w-5 mr-2" />
      </Button>
    </div>

    {totalVotes > 0 && (
      <div className="pt-2">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Stöd</span>
          <span className="font-medium">{supportPercentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${supportPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{totalVotes} röster totalt</p>
      </div>
    )}

    {!isAuthenticated && (
      <p className="text-xs text-center text-muted-foreground">
        Logga in för att rösta
      </p>
    )}
  </CardContent>
</Card>





            {/* Decision process */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Beslutsprocess</CardTitle>
  </CardHeader>
  <CardContent>
    {project?.phase ? (
      <>
        <div className="space-y-4">
          {["Planering", "Beslutad", "Pågående", "Genomfört"].map(
            (stage, index, stages) => {
              const currentIndex = stages.findIndex(
                (s) => s === project.phase
              );
              const status =
                index < currentIndex
                  ? "completed"
                  : index === currentIndex
                  ? "current"
                  : "upcoming";

              return (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        "w-3 h-3 rounded-full " +
                        (status === "current"
                          ? "bg-accent ring-4 ring-accent/20"
                          : status === "completed"
                          ? "bg-success"
                          : "bg-muted")
                      }
                    />
                    {index < stages.length - 1 && (
                      <div className="w-0.5 h-12 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p
                      className={
                        "font-medium " +
                        (status === "current" ? "text-accent" : "")
                      }
                    >
                      {stage}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* <div className="mt-4 p-3 bg-civic-subtle rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Viktigt:</strong> Din åsikt räknas mest under samråd och
            granskning.
          </p>
        </div> */}

      </>
    ) : (
      <p className="text-sm text-muted-foreground">
        Ingen beslutsprocess tillagd för detta projekt.
      </p>
    )}
  </CardContent>
</Card>

            {/* Consultation form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lämna synpunkt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Dela din synpunkt kopplad till den pågående processen ({project.phase}).
                </p>
                <ConsultationForm
                  projectId={Number(id)}
                  phase={project.phase}
                  isAuthenticated={isAuthenticated}
                  onSubmitted={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
