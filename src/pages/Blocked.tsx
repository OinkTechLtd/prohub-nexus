 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Ban, Clock, LogOut, AlertTriangle } from "lucide-react";
 import { formatDistanceToNow, format } from "date-fns";
 import { ru } from "date-fns/locale";
 
 interface BanInfo {
   id: string;
   reason: string;
   ban_type: string;
   expires_at: string | null;
   created_at: string;
 }
 
 const Blocked = () => {
   const navigate = useNavigate();
   const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     checkBanStatus();
   }, []);
 
   const checkBanStatus = async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       
       if (!session) {
         navigate("/auth");
         return;
       }
 
       const { data: ban } = await supabase
         .from("user_bans")
         .select("*")
         .eq("user_id", session.user.id)
         .eq("is_active", true)
         .order("created_at", { ascending: false })
         .limit(1)
         .maybeSingle();
 
       if (!ban) {
         // No active ban, redirect to home
         navigate("/");
         return;
       }
 
       // Check if temporary ban has expired
       if (ban.expires_at && new Date(ban.expires_at) < new Date()) {
         // Ban expired, deactivate it
         await supabase
           .from("user_bans")
           .update({ is_active: false })
           .eq("id", ban.id);
         navigate("/");
         return;
       }
 
       setBanInfo(ban);
     } catch (error) {
       console.error("Error checking ban status:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleSignOut = async () => {
     await supabase.auth.signOut();
     navigate("/auth");
   };
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
       </div>
     );
   }
 
   if (!banInfo) {
     return null;
   }
 
   const isPermanent = banInfo.ban_type === "permanent";
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
       <Card className="max-w-lg w-full border-destructive/50 shadow-2xl">
         <CardHeader className="text-center pb-2">
           <div className="mx-auto mb-4 p-4 bg-destructive/10 rounded-full">
             <Ban className="h-16 w-16 text-destructive" />
           </div>
           <CardTitle className="text-2xl text-destructive">
             Ваш аккаунт заблокирован
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Ban Type */}
           <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-destructive" />
             {isPermanent ? (
               <span className="text-destructive">Перманентная блокировка</span>
             ) : (
              <span className="text-muted-foreground">Временная блокировка</span>
             )}
           </div>
 
           {/* Reason */}
          <div className="bg-secondary rounded-lg p-4 space-y-2">
             <p className="text-sm font-medium text-muted-foreground">Причина блокировки:</p>
             <p className="text-foreground">{banInfo.reason}</p>
           </div>
 
           {/* Duration */}
           {!isPermanent && banInfo.expires_at && (
            <div className="bg-accent/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent-foreground">
                 <Clock className="h-5 w-5" />
                 <span className="font-medium">Срок блокировки</span>
               </div>
               <p className="text-sm">
                 Блокировка истекает:{" "}
                 <span className="font-semibold">
                   {format(new Date(banInfo.expires_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                 </span>
               </p>
               <p className="text-xs text-muted-foreground">
                 (через {formatDistanceToNow(new Date(banInfo.expires_at), { locale: ru })})
               </p>
             </div>
           )}
 
           {isPermanent && (
            <div className="bg-destructive/20 rounded-lg p-4 text-center">
               <p className="text-sm text-destructive font-medium">
                 Ваш аккаунт заблокирован навсегда.
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                 Если вы считаете, что это ошибка, обратитесь к администрации.
               </p>
             </div>
           )}
 
           {/* Ban Date */}
           <p className="text-xs text-center text-muted-foreground">
             Дата блокировки:{" "}
             {format(new Date(banInfo.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
           </p>
 
           {/* Sign Out Button */}
           <Button 
             onClick={handleSignOut} 
             variant="outline" 
             className="w-full"
           >
             <LogOut className="mr-2 h-4 w-4" />
             Выйти из аккаунта
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default Blocked;