import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Ban, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Warning {
  id: string;
  points: number;
  reason: string;
  notes: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  warning_types: {
    name: string;
    description: string | null;
  } | null;
}

interface WarningsListProps {
  userId: string;
  showNotes?: boolean; // Only for moderators
}

export const WarningsList = ({ userId, showNotes = false }: WarningsListProps) => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWarnings = async () => {
      const { data: warningsData } = await supabase
        .from("user_warnings")
        .select(
          `
          id,
          points,
          reason,
          notes,
          expires_at,
          is_expired,
          created_at,
          warning_types (
            name,
            description
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (warningsData) {
        setWarnings(warningsData);

        // Calculate active points
        const activePoints = warningsData
          .filter(
            (w) =>
              !w.is_expired &&
              (!w.expires_at || new Date(w.expires_at) > new Date())
          )
          .reduce((sum, w) => sum + w.points, 0);

        setTotalPoints(activePoints);
      }

      setLoading(false);
    };

    loadWarnings();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Загрузка предупреждений...
        </CardContent>
      </Card>
    );
  }

  const getPointsColor = (points: number) => {
    if (points >= 10) return "text-red-500";
    if (points >= 7) return "text-orange-500";
    if (points >= 5) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getSanctionLevel = (points: number) => {
    if (points >= 15) return { text: "Перманентный бан", color: "bg-red-500" };
    if (points >= 10)
      return { text: "Бан 30 дней", color: "bg-red-400" };
    if (points >= 7) return { text: "Бан 7 дней", color: "bg-orange-500" };
    if (points >= 5) return { text: "Бан 1 день", color: "bg-yellow-500" };
    return null;
  };

  const sanction = getSanctionLevel(totalPoints);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Предупреждения
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getPointsColor(totalPoints)}`}>
              {totalPoints}
            </span>
            <span className="text-sm text-muted-foreground">баллов</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sanction indicator */}
        {sanction && (
          <div
            className={`mb-4 p-3 rounded-lg ${sanction.color} text-white flex items-center gap-2`}
          >
            <Ban className="h-5 w-5" />
            <span className="font-medium">Санкция: {sanction.text}</span>
          </div>
        )}

        {/* Progress bar to next sanction */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Прогресс до санкции</span>
            <span>{totalPoints}/5 баллов</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalPoints >= 15
                  ? "bg-red-500"
                  : totalPoints >= 10
                  ? "bg-red-400"
                  : totalPoints >= 7
                  ? "bg-orange-500"
                  : totalPoints >= 5
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min((totalPoints / 15) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>5 (1д)</span>
            <span>7 (7д)</span>
            <span>10 (30д)</span>
            <span>15 (∞)</span>
          </div>
        </div>

        {warnings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>Нет предупреждений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning) => {
              const isActive =
                !warning.is_expired &&
                (!warning.expires_at ||
                  new Date(warning.expires_at) > new Date());

              return (
                <div
                  key={warning.id}
                  className={`p-3 rounded-lg border ${
                    isActive
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/30 border-muted opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isActive ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {warning.points} балл(ов)
                        </Badge>
                        {warning.warning_types && (
                          <span className="font-medium text-sm">
                            {warning.warning_types.name}
                          </span>
                        )}
                        {!isActive && (
                          <Badge variant="outline" className="text-xs">
                            Истекло
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{warning.reason}</p>
                      {showNotes && warning.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          📝 {warning.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(warning.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </div>
                      {warning.expires_at && isActive && (
                        <div className="mt-1 text-amber-600">
                          Истекает:{" "}
                          {formatDistanceToNow(new Date(warning.expires_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WarningsList;
