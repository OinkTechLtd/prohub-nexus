import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Landing from "./pages/Landing";
import ForumPanel from "./pages/ForumPanel";
import Auth from "./pages/Auth";
import CategoryView from "./pages/CategoryView";
import TopicView from "./pages/TopicView";
import CreateTopic from "./pages/CreateTopic";
import Resources from "./pages/Resources";
import CreateResource from "./pages/CreateResource";
import ResourceView from "./pages/ResourceView";
import Profile from "./pages/Profile";
import Videos from "./pages/Videos";
import UploadVideo from "./pages/UploadVideo";
import VideoView from "./pages/VideoView";
import VideoSwiper from "./pages/VideoSwiper";
import ModeratorResources from "./pages/ModeratorResources";
import ModeratorApplications from "./pages/ModeratorApplications";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import CreateAd from "./pages/CreateAd";
import AdsDashboard from "./pages/AdsDashboard";
import Withdraw from "./pages/Withdraw";
import AdminPanel from "./pages/AdminPanel";
import Guilds from "./pages/Guilds";
import GuildView from "./pages/GuildView";
import GuildRankings from "./pages/GuildRankings";
import Members from "./pages/Members";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";
import Blocked from "./pages/Blocked";
import RecruitmentBanner from "./components/RecruitmentBanner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import SeasonalEffects from "./components/SeasonalEffects";
import MobileBottomNav from "./components/MobileBottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <SeasonalEffects />
        <BrowserRouter>
          <AuthGuard>
            <RecruitmentBanner />
            <div className="pb-16 lg:pb-0">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/forum" element={<ForumPanel />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/blocked" element={<Blocked />} />
                <Route path="/category/:slug" element={<CategoryView />} />
                <Route path="/topic/:id" element={<TopicView />} />
                <Route path="/create-topic" element={<CreateTopic />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/resource/:id" element={<ResourceView />} />
                <Route path="/create-resource" element={<CreateResource />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/videos/swipe" element={<VideoSwiper />} />
                <Route path="/upload-video" element={<UploadVideo />} />
                <Route path="/video/:id" element={<VideoView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/moderator/resources" element={<ModeratorResources />} />
                <Route path="/apply-moderator" element={<ModeratorApplications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/create-ad" element={<CreateAd />} />
                <Route path="/ads-dashboard" element={<AdsDashboard />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/guilds" element={<Guilds />} />
                <Route path="/guild/:id" element={<GuildView />} />
                <Route path="/guilds/rankings" element={<GuildRankings />} />
                <Route path="/members" element={<Members />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <MobileBottomNav user={user} />
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
