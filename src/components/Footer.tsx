import { Heart } from "lucide-react";

interface FooterProps {
  customText?: string;
}

const Footer = ({ customText }: FooterProps) => {
  const displayText = customText || "Made by Oink Platforms";

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
          {displayText}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
