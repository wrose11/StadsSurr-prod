import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Calendar, MessageSquare, Megaphone, Map, ArrowUpDown } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

const Posts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("recent");

  useEffect(() => {
    apiFetch("/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch posts:", err);
        setLoading(false);
      });
  }, []);

  // Filter by search query
  let filteredPosts = posts;
  if (searchQuery.trim()) {
    filteredPosts = filteredPosts.filter(post =>
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort posts
  filteredPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "comments":
        return b.comments_count - a.comments_count;
      case "votes":
        return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes);
      case "upvotes":
        return b.upvotes - a.upvotes;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar inlägg...</p>
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
          <h1 className="text-4xl font-bold mb-3">Inlägg från invånare</h1>
          <p className="text-lg text-muted-foreground">
            Debattartiklar, förslag och lokala idéer från Stockholms medborgare.
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök inlägg eller författare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto gap-2" onClick={() => navigate("/posts/map")}>
              <Map className="h-4 w-4" />
              Visa på karta
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sortera efter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Senaste först</SelectItem>
                <SelectItem value="comments">Antal kommentarer</SelectItem>
                <SelectItem value="votes">Totalt engagemang</SelectItem>
                <SelectItem value="upvotes">Mest uppröster</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredPosts.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-green-500/50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                  <CardDescription className="flex items-center gap-3 text-sm">
                    <Link
                      to={`/profile/${post.author_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <User className="h-3.5 w-3.5" />
                      {post.author_name}
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.created_at).toLocaleDateString("sv-SE")}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.content}
                  </p>

                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {post.comments_count}
                    </div>
                    <div className="flex items-center gap-1.5 text-accent font-medium">
                      <Megaphone className="h-4 w-4" />
                      {post.upvotes + post.downvotes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Inga inlägg hittades. Prova en annan sökning.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Posts;
