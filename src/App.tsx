import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import RecruitmentBanner from "./components/RecruitmentBanner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import SeasonalEffects from "./components/SeasonalEffects";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <SeasonalEffects />
      <BrowserRouter>
        <RecruitmentBanner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/forum" element={<ForumPanel />} />
          <Route path="/auth" element={<Auth />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
