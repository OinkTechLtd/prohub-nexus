import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { signUpSchema, signInSchema } from "@/lib/authSchemas";
import { Separator } from "@/components/ui/separator";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import TwoFactorVerify from "@/components/TwoFactorVerify";

const SLTV_CLIENT_ID = "aa0b8e6fea64873f8355043e6b3a42ff";
const SLTV_API = "https://sltvid.lovable.app";

type AuthStep = "login" | "2fa-setup" | "2fa-verify";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sltvLoading, setSltvLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await check2FAStatus();
    }
  };

  const check2FAStatus = async () => {
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactors = factorsData?.totp || [];
      const verifiedFactors = totpFactors.filter((f) => f.status === "verified");

      if (verifiedFactors.length === 0) {
        // No 2FA set up - require setup
        setAuthStep("2fa-setup");
      } else {
        // 2FA is set up - check current AAL level
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
          // Need to verify 2FA
          setAuthStep("2fa-verify");
        } else {
          // Fully authenticated
          navigate("/");
        }
      }
    } catch (error) {
      console.error("2FA check error:", error);
      navigate("/");
    }
  };

  // Handle SLTV callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleSltvCallback(code);
    }
  }, [searchParams]);

  const handleSltvCallback = async (code: string) => {
    setSltvLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sltv-callback?code=${code}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth")}`,
        { method: "GET" }
      );

      const data = await response.json();
      console.log("SLTV callback response:", data);

      if (!response.ok) {
        throw new Error(data.error || data.details || "SLTV login failed");
      }

      if (data.token_hash) {
        // Verify the magic link token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (error) throw error;

        toast({
          title: "Вход выполнен",
          description: "Добро пожаловать через SLTV ID!",
        });
        
        await check2FAStatus();
      }
    } catch (error: any) {
      console.error("SLTV error:", error);
      toast({
        title: "Ошибка SLTV",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSltvLoading(false);
      // Clean URL
      window.history.replaceState({}, document.title, "/auth");
    }
  };

  const handleSltvLogin = () => {
    const redirectUri = encodeURIComponent(window.location.origin + "/auth");
    const authUrl = `${SLTV_API}/oauth/authorize?client_id=${SLTV_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid profile email`;
    window.location.href = authUrl;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = signUpSchema.safeParse({
        email,
        password,
        username: username || undefined,
      });

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast({
          title: "Ошибка валидации",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username || email.split("@")[0],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Регистрация успешна!",
        description: "Теперь настройте двухфакторную аутентификацию",
      });
      
      setAuthStep("2fa-setup");
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = signInSchema.safeParse({
        email,
        password,
      });

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast({
          title: "Ошибка валидации",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await check2FAStatus();
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetupComplete = () => {
    toast({ title: "2FA настроен успешно!" });
    navigate("/");
  };

  const handle2FAVerifySuccess = () => {
    navigate("/");
  };

  const handle2FACancel = () => {
    setAuthStep("login");
  };

  // Render 2FA setup/verify screens
  if (authStep === "2fa-setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TwoFactorSetup onComplete={handle2FASetupComplete} />
      </div>
    );
  }

  if (authStep === "2fa-verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TwoFactorVerify onSuccess={handle2FAVerifySuccess} onCancel={handle2FACancel} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">ProHub</CardTitle>
          <CardDescription>Форум разработчиков и профессионалов</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Пароль</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || sltvLoading}>
                  {loading ? "Загрузка..." : "Войти"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSltvLogin}
                  disabled={loading || sltvLoading}
                >
                  {sltvLoading ? "Загрузка..." : "Войти с помощью SLTV ID"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Имя пользователя</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Пароль</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || sltvLoading}>
                  {loading ? "Загрузка..." : "Зарегистрироваться"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSltvLogin}
                  disabled={loading || sltvLoading}
                >
                  {sltvLoading ? "Загрузка..." : "Войти с помощью SLTV ID"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
