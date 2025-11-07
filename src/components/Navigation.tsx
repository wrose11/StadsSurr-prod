import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Home, User, LogOut, UserPlus, FileText, Compass, Heart, UserSearch} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;

  const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="StadsSurr" className="h-10" />
          </Link>

          <div className="flex items-center gap-2">
            <Button variant={isActive("/") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/" aria-current={isActive("/") ? "page" : undefined}>
                <Home className="h-4 w-4" />
                Hem
              </Link>
            </Button>

            <Button variant={isActive("/utforska") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/utforska" aria-current={isActive("/utforska") ? "page" : undefined}>
                <Compass className="h-4 w-4" />
                Utforska
              </Link>
            </Button>

            <Button variant={isActive("/projects") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/projects" aria-current={isActive("/projects") ? "page" : undefined}>
                <Building2 className="h-4 w-4" />
                Projekt
              </Link>
            </Button>

            <Button variant={isActive("/posts") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/posts" aria-current={isActive("/posts") ? "page" : undefined}>
                <FileText className="h-4 w-4" />
                Inlägg
              </Link>
            </Button>

            {user && (
              <Button variant={isActive("/for-you") ? "default" : "ghost"} size="sm" asChild>
                <Link to="/for-you">
                <Heart className="h-4 w-4" />
                För dig
                
                </Link>
              </Button>
            )}

            {user && (
              <Button variant={isActive("/users/search") ? "default" : "ghost"} size="sm" asChild>
                <Link to="/users/search">
                <UserSearch className="h-4 w-4" />
                Sök användare</Link>
              </Button>
            )}

            {user ? (
              <>
                <Button 
                  variant={isActive(`/profile/${user.id}`) ? "default" : "ghost"} 
                  size="sm" 
                  asChild
                >
                  <Link to={`/profile/${user.id}`}>
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logga ut
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isActive("/login") ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to="/login" aria-current={isActive("/login") ? "page" : undefined}>
                    <User className="h-4 w-4" />
                    Logga in
                  </Link>
                </Button>

                <Button
                  variant={isActive("/create-account") ? "default" : "ghost"}
                  size="sm"
                  className="ml-2"
                  asChild
                >
                  <Link to="/create-account" aria-current={isActive("/create-account") ? "page" : undefined}>
                    <UserPlus className="h-4 w-4" />
                    Skapa konto
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
