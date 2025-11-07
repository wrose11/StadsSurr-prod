import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Calendar, MessageSquare, ThumbsUp, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
  user_vote?: string;
  user_comment_count: number;
  images?: string;
}

interface UserActivity {
  user: {
    id: number;
    name: string;
    email: string;
    bio: string | null;
    followers_count: number;
  };
  projects: Project[];
}

const phaseColors: Record<string, string> = {
  Samråd: "bg-accent/10 text-accent border-accent/20",
  Granskning: "bg-primary/10 text-primary border-primary/20",
  Planförslag: "bg-muted text-muted-foreground border-border",
  Byggstart: "bg-success/10 text-success border-success/20",
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [activityData, postsData] = await Promise.all([
          apiFetch(`/users/${id}/activity`).then(res => res.json()),
          apiFetch(`/users/${id}/posts`).then(res => res.json())
        ]);
        
        setActivity(activityData);
        setUserPosts(postsData);
        setBio(activityData.user.bio || "");
        
        // Check if current user is following this user
        if (currentUser && currentUser.id !== parseInt(id)) {
          const followRes = await apiFetch(`/users/${id}/is-following`, {
            credentials: "include"
          });
          if (followRes.ok) {
            const { is_following } = await followRes.json();
            setIsFollowing(is_following);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, currentUser]);

  const handleSaveBio = async () => {
  try {
    const res = await apiFetch(`/users/${activity?.user.id}/bio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // send cookies
      body: JSON.stringify({ bio }),
    });

    if (!res.ok) throw new Error("Failed to update bio");

    const updatedUser = await res.json();
    setActivity((prev) =>
      prev ? { ...prev, user: { ...prev.user, bio: updatedUser.bio } } : prev
    );
    setEditingBio(false);
  } catch (err) {
    console.error("Error updating bio:", err);
    alert("Kunde inte spara biografi");
  }
};

const handleFollowToggle = async () => {
  if (!currentUser || !activity) return;
  
  try {
    const method = isFollowing ? "DELETE" : "POST";
    const res = await apiFetch(`/users/${activity.user.id}/follow`, {
      method,
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to update follow status");

    setIsFollowing(!isFollowing);
    
    // Update follower count locally
    setActivity(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          followers_count: prev.user.followers_count + (isFollowing ? -1 : 1)
        }
      };
    });
  } catch (err) {
    console.error("Error toggling follow:", err);
    alert("Kunde inte uppdatera följ-status");
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar profil...</p>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Användare hittades inte</p>
        </main>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === activity.user.id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>

        {/* User header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold">{activity.user.name}</h1>
              {isOwnProfile && (
                <p className="text-sm text-muted-foreground mt-1">{activity.user.email}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {activity.user.followers_count} följare
              </p>
            </div>
            {!isOwnProfile && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollowToggle}
              >
                {isFollowing ? "Följer" : "Följ"}
              </Button>
            )}
          </div>
          
        </div>
        

        {/* Bio section */}

        <Card className="mb-10 border-border bg-card/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bio section */}
          <div className="mb-10">
            {editingBio ? (
              <div className="space-y-3">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none bg-background resize-none shadow-sm"
                  placeholder="Skriv något om dig själv..."
                />
                <div className="flex gap-3">
                  <Button size="sm" onClick={handleSaveBio} className="bg-primary hover:bg-primary/90">
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingBio(false)}>
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className={`text-muted-foreground whitespace-pre-line leading-relaxed ${!activity.user.bio && "italic text-muted-foreground/70"}`}>
                  {activity.user.bio || "Ingen biografi tillagd ännu."}
                </p>

                {isOwnProfile && (
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-primary/10 hover:bg-primary/20 text-primary"
                      onClick={() => setEditingBio(true)}
                    >
                      {activity.user.bio ? "Redigera biografi" : "Lägg till biografi"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
  
        </CardContent>
        </Card>

        {isOwnProfile && (
          <div className="mb-8">
            <Link to="/create-post">
              <Button>Skriv nytt inlägg</Button>
            </Link>
          </div>
        )}

        {userPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Mina inlägg</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {userPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="hover:shadow-lg transition-all hover:border-green-500/50 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        {new Date(post.created_at).toLocaleDateString("sv-SE")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                        <span>{post.comments_count} kommentarer</span>
                        <span>{post.upvotes + post.downvotes} röster</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

          <h2 className="text-2xl font-bold mb-4">
            Aktivitet på Stadsurr
          </h2>
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktivitet i projekt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activity.projects.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antal skrivna kommentarer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {activity.projects.reduce((sum, p) => sum + p.user_comment_count, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antal röser givna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {activity.projects.filter(p => p.user_vote).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects list */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4"> Aktiva projekt</h2>
          {activity.projects.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  {isOwnProfile 
                    ? "Du har inte kommenterat eller röstat på något projekt ännu. Börja utforska projekt för att påverka din stad!" 
                    : "Användaren har inte kommenterat eller röstat på något projekt ännu."}
                </p>
                {isOwnProfile && (
                  <div className="flex justify-center mt-4">
                    <Link to="/projects">
                      <Button>Utforska projekt</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activity.projects.map((project) => (
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
                      
                      <div className="flex items-center gap-4 text-sm">
                        {project.user_comment_count > 0 && (
                          <div className="flex items-center gap-1.5 font-medium text-primary">
                            <MessageSquare className="h-4 w-4" />
                            {project.user_comment_count} {isOwnProfile ? "dina" : ""} kommentarer
                          </div>
                        )}
                        {project.user_vote && (
                          <div className="flex items-center gap-1.5 font-medium text-accent">
                            <ThumbsUp className="h-4 w-4" />
                            Röstat
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
