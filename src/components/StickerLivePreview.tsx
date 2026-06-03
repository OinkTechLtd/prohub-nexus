import StyledUsername from "@/components/StyledUsername";
import { Card } from "@/components/ui/card";
import { MessageSquare, Package, MessageCircle, FileText } from "lucide-react";

interface Props {
  username: string;
  usernameCss?: string | null;
  flairOverride: { prefix?: string | null; suffix?: string | null; icon?: string | null; sticker?: string | null };
}

const sample = "Это короткий пример, как будет выглядеть твоё имя со стикером в разных местах форума.";

/**
 * Живой предпросмотр: показывает ник со стикером в карточках темы, поста,
 * ресурса и комментария — без сохранения.
 */
const StickerLivePreview = ({ username, usernameCss, flairOverride }: Props) => {
  const name = (
    <StyledUsername
      username={username || "you"}
      usernameCss={usernameCss}
      flairOverride={flairOverride}
      disableMiniProfile
      className="text-sm"
    />
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Card className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Тема
        </div>
        <div className="font-medium text-sm">Как настроить декорации</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {name}<span>· 2 мин назад</span>
        </div>
      </Card>

      <Card className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Пост
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {name}<span>· только что</span>
        </div>
        <p className="text-xs leading-relaxed">{sample}</p>
      </Card>

      <Card className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" /> Ресурс
        </div>
        <div className="font-medium text-sm">Тема для форума «Glass»</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          Автор: {name}
        </div>
      </Card>

      <Card className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" /> Комментарий
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {name}<span>· к ресурсу</span>
        </div>
        <p className="text-xs leading-relaxed">Огонь, спасибо!</p>
      </Card>
    </div>
  );
};

export default StickerLivePreview;
