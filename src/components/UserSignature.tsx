 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface UserSignatureProps {
   userId: string;
   className?: string;
 }
 
 const UserSignature = ({ userId, className = "" }: UserSignatureProps) => {
   const [signature, setSignature] = useState<string | null>(null);
   const [enabled, setEnabled] = useState(true);
 
   useEffect(() => {
     const loadSignature = async () => {
       const { data } = await supabase
         .from("profiles")
         .select("signature, signature_enabled")
         .eq("id", userId)
         .single();
 
       if (data && data.signature_enabled && data.signature) {
         setSignature(data.signature);
         setEnabled(data.signature_enabled);
       }
     };
 
     if (userId) {
       loadSignature();
     }
   }, [userId]);
 
   if (!signature || !enabled) {
     return null;
   }
 
   return (
     <div className={`mt-4 pt-3 border-t border-dashed text-sm text-muted-foreground italic ${className}`}>
       <div className="max-h-20 overflow-hidden">
         {signature}
       </div>
     </div>
   );
 };
 
 export default UserSignature;