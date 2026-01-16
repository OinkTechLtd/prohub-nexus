import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import GuildCard from "@/components/GuildCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGuilds } from "@/hooks/useGuilds";
import { Plus, Search, Users, Crown, Shield, Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Guilds = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGuild, setNewGuild] = useState({
    name: "",
    tag: "",
    description: "",
    color: "#6366f1",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { guilds, isLoading, createGuild, useUserGuilds } = useGuilds();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  const { data: userGuilds = [] } = useUserGuilds(currentUser?.id);

  const filteredGuilds = guilds.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGuild = async () => {
    if (!newGuild.name || !newGuild.tag) {
      toast({
        title: "Ошибка",
        description: "Заполните название и тег гильдии",
        variant: "destructive",
      });
      return;
    }

    if (newGuild.tag.length > 5) {
      toast({
        title: "Ошибка",
        description: "Тег должен быть не длиннее 5 символов",
        variant: "destructive",
      });
      return;
    }

    await createGuild.mutateAsync({
      name: newGuild.name,
      tag: newGuild.tag.toUpperCase(),
      description: newGuild.description || null,
      color: newGuild.color,
      logo_url: null,
      banner_url: null,
      owner_id: currentUser.id,
      is_official: false,
    });

    setCreateDialogOpen(false);
    setNewGuild({ name: "", tag: "", description: "", color: "#6366f1" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Гильдии
            </h1>
            <p className="text-muted-foreground mt-1">
              Объединяйтесь с единомышленниками
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/guilds/rankings")}>
              <Trophy className="h-4 w-4 mr-2" />
              Рейтинг
            </Button>
            {currentUser && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать гильдию
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создание гильдии</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input
                      placeholder="Моя гильдия"
                      value={newGuild.name}
                      onChange={(e) =>
                        setNewGuild({ ...newGuild, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тег (до 5 символов)</Label>
                    <Input
                      placeholder="TAG"
                      maxLength={5}
                      value={newGuild.tag}
                      onChange={(e) =>
                        setNewGuild({
                          ...newGuild,
                          tag: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      placeholder="Расскажите о вашей гильдии..."
                      value={newGuild.description}
                      onChange={(e) =>
                        setNewGuild({ ...newGuild, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Цвет</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newGuild.color}
                        onChange={(e) =>
                          setNewGuild({ ...newGuild, color: e.target.value })
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={newGuild.color}
                        onChange={(e) =>
                          setNewGuild({ ...newGuild, color: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateGuild}
                    disabled={createGuild.isPending}
                  >
                    {createGuild.isPending ? "Создание..." : "Создать гильдию"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="h-10 w-10 text-primary" />
              <div>
                <div className="text-2xl font-bold">{guilds.length}</div>
                <div className="text-sm text-muted-foreground">Всего гильдий</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Crown className="h-10 w-10 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {guilds.filter((g) => g.is_official).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Официальных гильдий
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Shield className="h-10 w-10 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{userGuilds.length}</div>
                <div className="text-sm text-muted-foreground">Ваших гильдий</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-6"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск гильдий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Guild List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Загрузка гильдий...
            </CardContent>
          </Card>
        ) : filteredGuilds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchQuery ? "Гильдии не найдены" : "Пока нет гильдий"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuilds.map((guild, index) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GuildCard
                  {...guild}
                  onClick={() => navigate(`/guild/${guild.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Guilds;
