import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  crypto_currency: string;
  crypto_address: string;
  status: string;
  created_at: string;
  tx_id: string | null;
}

const Withdraw = () => {
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("USDT");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from("user_earnings")
        .select("amount, withdrawn")
        .eq("user_id", user.id);

      if (earningsError) throw earningsError;

      const total = earningsData?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const withdrawn = earningsData?.filter(e => e.withdrawn).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      
      setAvailableBalance(total - withdrawn);

      // Load withdrawal requests
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < 10) {
      toast({
        title: "Минимальная сумма",
        description: "Минимальная сумма вывода составляет $10",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Недостаточно средств",
        description: "У вас недостаточно средств для вывода",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: user.id,
          amount: withdrawAmount,
          crypto_currency: cryptoCurrency,
          crypto_address: cryptoAddress,
        });

      if (error) throw error;

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка на вывод средств принята и будет обработана в течение 24 часов",
      });

      setAmount("");
      setCryptoAddress("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка вывода",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Завершено";
      case "processing":
        return "Обрабатывается";
      case "rejected":
        return "Отклонено";
      default:
        return "В ожидании";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Вывод средств</h1>
          <p className="text-muted-foreground">Выведите заработанные средства на криптовалютный кошелек</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Доступный баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold text-green-500">
                  ${availableBalance.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Новая заявка</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Криптовалюта</Label>
                  <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT (TRC20)</SelectItem>
                      <SelectItem value="BTC">Bitcoin</SelectItem>
                      <SelectItem value="ETH">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Минимум $10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес кошелька</Label>
                  <Input
                    id="address"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    placeholder="Введите адрес кошелька"
                    required
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Минимальная сумма вывода: $10. Обработка занимает до 24 часов.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>История выводов</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                У вас пока нет заявок на вывод
              </p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <p className="font-semibold">
                          ${parseFloat(withdrawal.amount.toString()).toFixed(2)} - {withdrawal.crypto_currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{getStatusText(withdrawal.status)}</p>
                      {withdrawal.tx_id && (
                        <p className="text-xs text-muted-foreground">
                          TX: {withdrawal.tx_id.substring(0, 10)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Withdraw;
