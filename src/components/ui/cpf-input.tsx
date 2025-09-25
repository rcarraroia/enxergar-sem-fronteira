
import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cleanCPF, formatCPF } from "@/utils/cpfUtils";

interface CPFInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string
  onChange?: (value: string) => void
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  ({ value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleanValue = cleanCPF(e.target.value);
      onChange?.(cleanValue); // Sempre retorna o valor limpo para o formulário
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={formatCPF(value)} // Mostra formatado na tela
        onChange={handleChange}
        placeholder="000.000.000-00"
        maxLength={14}
      />
    );
  }
);

CPFInput.displayName = "CPFInput";
