/**
 * DATA TABLE V2 - Tabela reutilizável com filtros e paginação
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  MoreHorizontal,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface Action<T> {
  label: string
  onClick: (item: T) => void
  variant?: "default" | "destructive"
  icon?: React.ComponentType<{ className?: string }>
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (search: string) => void
  title?: string
  emptyMessage?: string
  itemsPerPage?: number
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Buscar...",
  onSearch,
  title,
  emptyMessage = "Nenhum item encontrado",
  itemsPerPage = 10
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar dados baseado na busca
  const filteredData = searchTerm
    ? data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página
    onSearch?.(value);
  };

  const getValue = (item: T, key: string) => {
    if (key.includes(".")) {
      const keys = key.split(".");
      let value: any = item;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return (item as any)[key];
  };

  return (
    <Card>
      {(title || searchable) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {searchable && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className="text-left py-3 px-4 font-medium text-muted-foreground"
                        style={{ width: column.width }}
                      >
                        {column.label}
                      </th>
                    ))}
                    {actions.length > 0 && (
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, _rowIndex) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      {columns.map((column, colIndex) => {
                        const value = getValue(item, column.key as string);
                        return (
                          <td key={colIndex} className="py-3 px-4">
                            {column.render ? column.render(value, item) : String(value || "")}
                          </td>
                        );
                      })}
                      {actions.length > 0 && (
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={actionIndex}
                                  onClick={() => action.onClick(item)}
                                  className={action.variant === "destructive" ? "text-red-600" : ""}
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} itens
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}