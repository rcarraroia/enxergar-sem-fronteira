
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DonationData {
  campaign_id: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number
  donation_type: "one_time" | "subscription"
}

export interface Donation {
  id: string
  campaign_id: string
  donor_name: string | null
  donor_email: string | null
  donor_phone: string | null
  amount: number
  donation_type: string
  payment_id: string | null
  payment_status: string
  asaas_subscription_id: string | null
  split_data: any
  created_at: string
  updated_at: string
  campaigns?: {
    title: string
  }
}

export const useDonations = () => {
  const queryClient = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          campaigns:campaign_id (
            title
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {throw error;}
      return data as Donation[];
    }
  });

  const createDonation = useMutation({
    mutationFn: async (donationData: DonationData) => {
      try {
        // Chamar a edge function para criar a cobrança no Asaas
        const { data: paymentData, error: paymentError } = await supabase.functions
          .invoke("create-donation-payment", {
            body: donationData
          });

        if (paymentError) {throw paymentError;}

        return paymentData;
      } catch (error) {
        console.error("Erro ao processar doação:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Doação processada com sucesso!");
      
      // Redirecionar para o link de pagamento se disponível
      if (data?.donation?.invoiceUrl) {
        window.open(data.donation.invoiceUrl, "_blank");
      }
    },
    onError: (error: any) => {
      console.error("Erro ao processar doação:", error);
      toast.error(error.message || "Erro ao processar doação");
    }
  });

  const getDonationsByCampaign = (campaignId: string) => {
    return useQuery({
      queryKey: ["donations", campaignId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("donations")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: false });
        
        if (error) {throw error;}
        return data as Donation[];
      },
      enabled: !!campaignId
    });
  };

  return {
    donations,
    isLoading,
    createDonation,
    getDonationsByCampaign
  };
};

export const useSubscriptions = () => {
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_subscriptions")
        .select(`
          *,
          campaigns:campaign_id (
            title
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {throw error;}
      return data;
    }
  });

  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from("donation_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscriptionId);

      if (error) {throw error;}
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error("Erro ao cancelar assinatura");
    }
  });

  return {
    subscriptions,
    isLoading,
    cancelSubscription
  };
};
