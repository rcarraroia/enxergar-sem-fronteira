
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentData {
  eventId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description?: string
}

interface PaymentResponse {
  id: string
  status: string
  value: number
  pixCode?: string
  qrCode?: string
  invoiceUrl: string
}

export const useAsaasPayment = () => {
  const [loading, setLoading] = useState(false);

  const createPayment = async (paymentData: PaymentData): Promise<PaymentResponse | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-asaas-payment", {
        body: paymentData
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar pagamento");
      }

      toast.success("Pagamento criado com sucesso!");
      return data.payment;
      
    } catch (error: any) {
      console.error("Erro ao criar pagamento:", error);
      toast.error(`Erro ao criar pagamento: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    loading
  };
};
