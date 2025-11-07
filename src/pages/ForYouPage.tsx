import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar, MessageSquare, Megaphone, User, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/api/config";

interface FeedItem {
  type: "project" | "post";
  id: number;
  title: string;
  description?: string;
  content?: string;
  location?: string;
  phase?: string;
  comments_count: number;
  upvotes: number;
  downvotes: number;
  created_at?: string;
  user_id?: number;
  user_name?: string;
}

const phaseColors: Record<string, string> = {
  "Planering": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Beslutad": "bg-purple-100 text-purple-800 border-purple-300",
  "Pågående": "bg-blue-100 text-blue-800 border-blue-300",
  "Genomfört": "bg-success/10 text-success border-success/20",
};

const ForYouPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    apiFetch("/for_you", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setFeed(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch feed:", err);
        setLoading(false);
      });
  }, [isAuthenticated, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar ditt flöde...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="h-10 w-10 text-primary" />
            För dig
          </h1>
          <p className="text-muted-foreground">
            Aktivitet från personer du följer
          </p>
        </div>

        {feed.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Ditt flöde är tomt</h2>
              <p className="text-muted-foreground mb-6">
                Börja följa andra användare för att se deras aktivitet här.
              </p>
              <Link to="/users/search">
                <Button>Sök användare</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {feed.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.type === "project" ? `/project/${item.id}` : `/posts/${item.id}`}
              >
                <Card className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.type === "project" ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Projekt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                              Inlägg
                            </Badge>
                          )}
                          {item.phase && (
                            <Badge variant="outline" className={phaseColors[item.phase]}>
                              {item.phase}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight">{item.title}</CardTitle>
                      </div>
                    </div>
                    {item.type === "post" && item.user_name && (
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <User className="h-3.5 w-3.5" />
                        {item.user_name}
                        {item.created_at && (
                          <span className="text-muted-foreground/60">
                            {" • "}
                            {new Date(item.created_at).toLocaleDateString("sv-SE")}
                          </span>
                        )}
                      </CardDescription>
                    )}
                    {item.type === "project" && item.location && (
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {item.description || item.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        {item.comments_count}
                      </div>
                    <div className="flex items-center gap-1.5 text-accent font-medium">
                      <Megaphone className="h-4 w-4" />
                      {item.upvotes + item.downvotes}
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ForYouPage;
