/**
 * Utilitários para formatação consistente de datas e horas
 */

/**
 * Formata uma data no formato brasileiro (DD/MM/AAAA)
 * @param dateString - String da data no formato ISO (YYYY-MM-DD)
 * @returns Data formatada no padrão brasileiro
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) {return "";}
  
  // Usar split para evitar problemas de fuso horário
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Formata uma hora no formato HH:MM (remove os segundos)
 * @param timeString - String da hora no formato HH:MM:SS
 * @returns Hora formatada no padrão HH:MM
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) {return "";}
  
  // Remove os segundos se existirem
  return timeString.slice(0, 5);
};

/**
 * Formata um intervalo de tempo
 * @param startTime - Hora de início
 * @param endTime - Hora de fim
 * @returns Intervalo formatado (HH:MM - HH:MM)
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) {return "";}
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Formata data e hora completa
 * @param dateString - Data no formato ISO
 * @param startTime - Hora de início
 * @param endTime - Hora de fim
 * @returns Data e hora formatadas
 */
export const formatDateTimeRange = (dateString: string, startTime: string, endTime: string): string => {
  const date = formatDate(dateString);
  const timeRange = formatTimeRange(startTime, endTime);
  
  return `${date} • ${timeRange}`;
};

/**
 * Formata data para exibição com dia da semana
 * @param dateString - String da data no formato ISO
 * @returns Data formatada com dia da semana
 */
export const formatDateWithWeekday = (dateString: string): string => {
  if (!dateString) {return "";}
  
  const [year, month, day] = dateString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const weekday = weekdays[date.getDay()];
  
  return `${weekday}, ${formatDate(dateString)}`;
};

/**
 * Converte data brasileira (DD/MM/AAAA) para formato ISO (YYYY-MM-DD)
 * @param brazilianDate - Data no formato DD/MM/AAAA
 * @returns Data no formato ISO
 */
export const brazilianToISODate = (brazilianDate: string): string => {
  if (!brazilianDate) {return "";}
  
  const [day, month, year] = brazilianDate.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Verifica se uma data é hoje
 * @param dateString - Data no formato ISO
 * @returns true se a data é hoje
 */
export const isToday = (dateString: string): boolean => {
  if (!dateString) {return false;}
  
  const today = new Date();
  const [year, month, day] = dateString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toDateString() === today.toDateString();
};

/**
 * Verifica se uma data já passou
 * @param dateString - Data no formato ISO
 * @returns true se a data já passou
 */
export const isPastDate = (dateString: string): boolean => {
  if (!dateString) {return false;}
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dateString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date < today;
};
