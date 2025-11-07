import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectsMap from "./pages/ProjectsMap";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import PostsMap from "./pages/PostsMap";
import CreatePost from "./pages/CreatePost";
import UserProfile from "./pages/UserProfile";
import UserSearch from "./pages/UserSearch";
import ForYouPage from "./pages/ForYouPage";
import NotFound from "./pages/NotFound";
import CreateAccount from "./pages/CreateAccount";
import Login from "./pages/Login";
import About from "./pages/About";
import Utforska from "./pages/Utforska";
import UtforskaMap from "./pages/UtforskaMap";
import TermsModal from "./pages/TermsModal";

const queryClient = new QueryClient();


function AppRoutes() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | undefined;
  const background = state?.backgroundLocation;

  return (
    <>
      {/* Render the app; if a modal is open, show the *background* page under it */}
      <Routes location={background || location}>
        <Route path="/" element={<Home />} />
        
        <Route path="/utforska" element={<Utforska />} />
        <Route path="/utforska/map" element={<UtforskaMap />} />
        
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/map" element={<ProjectsMap />} />
        <Route path="/project/:id" element={<ProjectDetail />} />

        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/map" element={<PostsMap />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/create-post" element={<CreatePost />} />

        <Route path="/profile/:id" element={<UserProfile />} />
        <Route path="/users/search" element={<UserSearch />} />
        <Route path="/for-you" element={<ForYouPage />} />

        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms-of-reference" element={<TermsModal />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Only mount the modal route when we *have* a background page.
         That way you see the page you came from behind the modal.
         If someone hits /terms-of-reference directly, no modal is mounted here,
         so nothing shows behind it. */}
      {background && (
        <Routes>
          <Route path="/terms-of-reference" element={<TermsModal />} />
        </Routes>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
