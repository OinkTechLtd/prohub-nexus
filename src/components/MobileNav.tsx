import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, Home, Package, Video, Shield, MessageCircle, User, LogOut } from "lucide-react";
import { useState } from "react";

interface MobileNavProps {
  user: any;
  showModeratorLink: boolean;
  onSignOut: () => void;
}

export const MobileNav = ({ user, showModeratorLink, onSignOut }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  const closeNav = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <span className="text-xl font-bold text-primary">ProHub</span>
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Beta</span>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/"
              onClick={closeNav}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Форум</span>
            </Link>
            
            <Link
              to="/resources"
              onClick={closeNav}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Package className="h-5 w-5" />
              <span>Ресурсы</span>
            </Link>
            
            <Link
              to="/videos"
              onClick={closeNav}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Video className="h-5 w-5" />
              <span>Видео</span>
            </Link>
            
            {showModeratorLink && (
              <Link
                to="/moderator/resources"
                onClick={closeNav}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-primary"
              >
                <Shield className="h-5 w-5" />
                <span>Модерация</span>
              </Link>
            )}
          </nav>
          
          {user && (
            <div className="border-t p-4 space-y-2">
              <Link
                to="/profile"
                onClick={closeNav}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Профиль</span>
              </Link>
              
              <Link
                to="/messages"
                onClick={closeNav}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Сообщения</span>
              </Link>
              
              <button
                onClick={() => {
                  closeNav();
                  onSignOut();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
