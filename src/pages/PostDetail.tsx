import { useParams, useNavigate, Link } from "react-router-dom";
import { User as UserIcon, Calendar, ThumbsUp, ThumbsDown, MessageSquare, Share2, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/api/config";


interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  author_id: number;
  author_name: string;
  comments_count: number;
  upvotes: number;
  downvotes: number;
  user_vote?: string;
  latitude?: number;
  longitude?: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  likes: number;
  liked_by_user?: boolean;
}

// Create custom green marker icon
const greenIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="#22c55e" stroke="#16a34a" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.13 12.5 28.5 12.5 28.5S25 20.63 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      apiFetch(`/posts/${id}`).then(res => res.json()),
      apiFetch(`/posts/${id}/comments`).then(res => res.json())
    ])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setComments(commentsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch post:", err);
        setLoading(false);
      });
  }, [id]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      toast({
        title: "Logga in för att rösta",
        description: "Du måste vara inloggad för att rösta på inlägg.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 0);
      return;
    }

    try {
      const res = await apiFetch(`/posts/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(id), vote_type: voteType }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to vote");
      }

      // Refresh post data
      const postData = await apiFetch(`/posts/${id}`).then(res => res.json());
      setPost(postData);
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
      const res = await apiFetch(`/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(id), content: newComment }),
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

    if (comment.user_id === user?.id) {
      toast({
        title: "Du kan inte gilla din egen kommentar",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiFetch(`/post-comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Kunde inte gilla kommentaren");
      const data = await res.json();

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

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar inlägg...</p>
        </main>
      </div>
    );
  }

  const totalVotes = post.upvotes + post.downvotes;
  const supportPercentage = totalVotes > 0 ? Math.round((post.upvotes / totalVotes) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <Link
                  to={`/profile/${post.author_id}`}
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <UserIcon className="h-4 w-4" />
                  {post.author_name}
                </Link>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.created_at).toLocaleDateString("sv-SE")}
                </div>
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
            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Innehåll</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </CardContent>
            </Card>

            {/* Image */}
            {post.image_url && (
              <Card>
                <CardContent className="pt-6">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Mini Map */}
            {post.latitude && post.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Plats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[post.latitude, post.longitude]}
                      zoom={14}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[post.latitude, post.longitude]} icon={greenIcon} />
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
                  Kommentarer ({post.comments_count})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add comment */}
                <div className="space-y-3">
                  <Textarea
                    placeholder={isAuthenticated ? "Skriv din kommentar här..." : "Logga in för att kommentera"}
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


          {/* Right column - voting and stats */}
          <div className="space-y-6">
            {/* Voting card */}
            <Card>
              <CardHeader>
                <CardTitle>Rösta på inlägget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    className={`flex-1 ${post.user_vote === "upvote" ? "bg-green-500 hover:bg-green-600" : ""}`}
                    onClick={() => handleVote("upvote")}
                    disabled={!isAuthenticated}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 ${post.user_vote === "downvote" ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kommentarer</span>
                  <span className="font-medium">{post.comments_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Totala röster</span>
                  <span className="font-medium">{totalVotes}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
