import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ad {
  id: string;
  title: string;
  description: string;
  media_url: string | null;
  click_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  campaign_id: string;
  ad_campaigns: {
    ad_type: string;
    cost_per_view: number;
    cost_per_click: number;
  };
}

interface AdDisplayProps {
  location: string; // "sidebar", "header", "content"
  interests?: string[];
}

const AdDisplay = ({ location, interests = [] }: AdDisplayProps) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [user, setUser] = useState<any>(null);
  const [visible, setVisible] = useState(true);
  const [impressionRecorded, setImpressionRecorded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (user && !impressionRecorded) {
      fetchAd();
    }
  }, [user, interests, impressionRecorded]);

  const fetchAd = async () => {
    try {
      // Fetch user interests
      let userInterests = interests;
      if (user && interests.length === 0) {
        const { data: interestsData } = await supabase
          .from("user_interests")
          .select("interest")
          .eq("user_id", user.id);
        
        userInterests = interestsData?.map(i => i.interest) || [];
      }

      // Fetch relevant ads
      const { data: ads, error } = await supabase
        .from("ads")
        .select(`
          *,
          ad_campaigns!inner(
            ad_type,
            cost_per_view,
            cost_per_click,
            target_interests,
            status,
            budget_total,
            budget_spent
          )
        `)
        .eq("ad_campaigns.status", "active")
        .lt("ad_campaigns.budget_spent", "ad_campaigns.budget_total");

      if (error) throw error;

      // Filter by interests and select best match
      const matchedAds = (ads || []).filter((ad: any) => {
        const targetInterests = ad.ad_campaigns.target_interests || [];
        return targetInterests.some((interest: string) => 
          userInterests.includes(interest)
        );
      });

      if (matchedAds.length > 0) {
        // Random selection from matched ads
        const selectedAd = matchedAds[Math.floor(Math.random() * matchedAds.length)];
        setAd(selectedAd);
        recordImpression(selectedAd.id);
      }
    } catch (error) {
      console.error("Error fetching ad:", error);
    }
  };

  const recordImpression = async (adId: string) => {
    try {
      await supabase.from("ad_impressions").insert({
        ad_id: adId,
        user_id: user?.id || null,
      });

      // Update campaign budget
      if (ad?.ad_campaigns) {
        const costPerView = parseFloat(ad.ad_campaigns.cost_per_view.toString());
        const { data: campaign } = await supabase
          .from("ad_campaigns")
          .select("budget_spent")
          .eq("id", ad.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from("ad_campaigns")
            .update({ budget_spent: parseFloat(campaign.budget_spent.toString()) + costPerView })
            .eq("id", ad.campaign_id);
        }
      }

      setImpressionRecorded(true);

      // Notify content creator about earnings
      await recordEarnings(adId, ad?.ad_campaigns?.cost_per_view || 0, "ad_views");
    } catch (error) {
      console.error("Error recording impression:", error);
    }
  };

  const handleClick = async () => {
    if (!ad) return;

    try {
      await supabase.from("ad_clicks").insert({
        ad_id: ad.id,
        user_id: user?.id || null,
      });

      // Record click earnings
      await recordEarnings(ad.id, ad.ad_campaigns?.cost_per_click || 0, "ad_clicks");

      // Open link
      if (ad.click_url) {
        window.open(ad.click_url, "_blank");
      }
    } catch (error) {
      console.error("Error recording click:", error);
    }
  };

  const recordEarnings = async (adId: string, amount: number, source: string) => {
    if (!user) return;

    try {
      await supabase.from("user_earnings").insert({
        user_id: user.id,
        amount,
        source,
        ad_id: adId,
      });
    } catch (error) {
      console.error("Error recording earnings:", error);
    }
  };

  if (!ad || !visible) return null;

  const adType = ad.ad_campaigns?.ad_type;

  if (adType === "banner") {
    return (
      <Card className="relative overflow-hidden p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {ad.media_url && (
          <img
            src={ad.media_url}
            alt={ad.title}
            className="w-full h-auto rounded"
          />
        )}
        
        <div className="mt-2">
          <h4 className="font-semibold text-sm">{ad.title}</h4>
          {ad.description && (
            <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>
          )}
          {ad.click_url && (
            <div className="flex items-center text-xs text-primary mt-2">
              <ExternalLink className="h-3 w-3 mr-1" />
              Узнать больше
            </div>
          )}
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          Реклама
        </div>
      </Card>
    );
  }

  if (adType === "video" && ad.media_url) {
    return (
      <Card className="relative overflow-hidden p-4">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <video
          src={ad.media_url}
          controls
          className="w-full rounded"
          onClick={handleClick}
        />
        
        <div className="mt-2">
          <h4 className="font-semibold text-sm">{ad.title}</h4>
          {ad.description && (
            <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>
          )}
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          Реклама
        </div>
      </Card>
    );
  }

  if (adType === "text") {
    return (
      <Card className="relative p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h4 className="font-semibold text-sm mb-1">{ad.title}</h4>
        {ad.description && (
          <p className="text-sm text-muted-foreground">{ad.description}</p>
        )}
        {ad.click_url && (
          <div className="flex items-center text-xs text-primary mt-2">
            <ExternalLink className="h-3 w-3 mr-1" />
            Узнать больше
          </div>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          Реклама
        </div>
      </Card>
    );
  }

  return null;
};

export default AdDisplay;
