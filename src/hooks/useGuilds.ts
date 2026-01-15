import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_id: string;
  color: string;
  created_at: string;
  member_count: number;
  is_official: boolean;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  guilds?: Guild;
}

export const useGuilds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all guilds
  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ["guilds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guilds")
        .select("*")
        .order("member_count", { ascending: false });

      if (error) throw error;
      return data as Guild[];
    },
  });

  // Fetch guild by ID with members
  const useGuild = (guildId?: string) => {
    return useQuery({
      queryKey: ["guild", guildId],
      queryFn: async () => {
        if (!guildId) return null;

        const { data: guild, error: guildError } = await supabase
          .from("guilds")
          .select("*")
          .eq("id", guildId)
          .single();

        if (guildError) throw guildError;

        // Fetch members separately and join with profiles
        const { data: membersRaw, error: membersError } = await supabase
          .from("guild_members")
          .select("id, guild_id, user_id, role, joined_at")
          .eq("guild_id", guildId)
          .order("role");

        if (membersError) throw membersError;

        // Fetch profiles for members
        const userIds = membersRaw?.map(m => m.user_id) || [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const members: GuildMember[] = (membersRaw || []).map(m => ({
          ...m,
          profiles: profiles?.find(p => p.id === m.user_id) as any
        }));

        return { ...guild, members } as Guild & { members: GuildMember[] };
      },
      enabled: !!guildId,
    });
  };

  // Fetch user's guilds
  const useUserGuilds = (userId?: string) => {
    return useQuery({
      queryKey: ["user-guilds", userId],
      queryFn: async () => {
        if (!userId) return [];

        const { data: memberships, error } = await supabase
          .from("guild_members")
          .select("id, guild_id, user_id, role, joined_at")
          .eq("user_id", userId);

        if (error) throw error;

        // Fetch guilds data
        const guildIds = memberships?.map(m => m.guild_id) || [];
        if (guildIds.length === 0) return [];

        const { data: guildsData } = await supabase
          .from("guilds")
          .select("*")
          .in("id", guildIds);

        return (memberships || []).map(m => ({
          ...m,
          guilds: guildsData?.find(g => g.id === m.guild_id) as Guild | undefined
        })) as GuildMember[];
      },
      enabled: !!userId,
    });
  };

  // Create guild
  const createGuild = useMutation({
    mutationFn: async (guild: Omit<Guild, 'id' | 'created_at' | 'member_count'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("guilds")
        .insert({ ...guild, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase
        .from("guild_members")
        .insert({ guild_id: data.id, user_id: user.id, role: 'owner' });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast({ title: "Гильдия создана!" });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания гильдии",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join guild
  const joinGuild = useMutation({
    mutationFn: async (guildId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("guild_members")
        .insert({ guild_id: guildId, user_id: user.id, role: 'member' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      queryClient.invalidateQueries({ queryKey: ["user-guilds"] });
      toast({ title: "Вы вступили в гильдию!" });
    },
  });

  // Leave guild
  const leaveGuild = useMutation({
    mutationFn: async (guildId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("guild_id", guildId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      queryClient.invalidateQueries({ queryKey: ["user-guilds"] });
      toast({ title: "Вы покинули гильдию" });
    },
  });

  return {
    guilds,
    isLoading,
    useGuild,
    useUserGuilds,
    createGuild,
    joinGuild,
    leaveGuild,
  };
};
