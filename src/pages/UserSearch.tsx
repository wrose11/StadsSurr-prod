import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/api/config";

interface UserResult {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  followers_count: number;
}

const UserSearch = () => {
  const { isAuthenticated, user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Load all users initially
    apiFetch("/users", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [isAuthenticated, authLoading, navigate]);

  const filteredUsers = users.filter(u => {
    if (u.id === currentUser?.id) return false; // Don't show current user
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.bio && u.bio.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar användare...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sök användare</h1>
          <p className="text-muted-foreground">
            Hitta och följ andra användare på StadsSurr
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Sök efter namn, e-post eller biografi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Inga användare hittades" : "Inga användare tillgängliga"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Link key={user.id} to={`/profile/${user.id}`}>
                 <Card className="hover:shadow-md transition-shadow cursor-pointer">
                   <CardHeader>
                     <CardTitle className="text-xl hover:text-primary transition-colors">
                       {user.name}
                     </CardTitle>
                     <CardDescription>{user.email}</CardDescription>
                   </CardHeader>
                   <CardContent>
                     {user.bio && (
                       <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                         {user.bio}
                       </p>
                     )}
                     <p className="text-xs text-muted-foreground">
                       {user.followers_count} följare
                     </p>
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

export default UserSearch;
