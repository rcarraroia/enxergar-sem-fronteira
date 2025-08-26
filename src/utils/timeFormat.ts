
/**
 * Formatar horário removendo segundos se existirem
 * @param timeString - String no formato HH:MM ou HH:MM:SS
 * @returns String no formato HH:MM
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) {return "";}

  // Remove segundos se existirem (08:00:00 → 08:00)
  return timeString.substring(0, 5);
};

/**
 * Formatar data para exibição brasileira
 * @param dateString - String da data
 * @returns String formatada
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) {return "";}

  const date = new Date(`${dateString  }T00:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

/**
 * Exportar dados para CSV
 * @param data - Dados para exportar
 * @param filename - Nome do arquivo
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) {return;}

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(header => `"${row[header] || ""}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
