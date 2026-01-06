import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

const GitHubButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => window.open("https://github.com/OinkTechLtd/prohub-nexus", "_blank")}
    >
      <Github className="h-4 w-4" />
      <span className="hidden sm:inline">GitHub</span>
    </Button>
  );
};

export default GitHubButton;