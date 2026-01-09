import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter } from "lucide-react";

interface ResourceFiltersProps {
  typeFilter: string;
  sortBy: string;
  onTypeChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const ResourceFilters = ({
  typeFilter,
  sortBy,
  onTypeChange,
  onSortChange,
}: ResourceFiltersProps) => {
  const types = [
    { value: "all", label: "Все типы" },
    { value: "code", label: "Код" },
    { value: "tutorial", label: "Туториал" },
    { value: "tool", label: "Инструмент" },
    { value: "library", label: "Библиотека" },
    { value: "template", label: "Шаблон" },
  ];

  const sortOptions = [
    { value: "newest", label: "Сначала новые" },
    { value: "oldest", label: "Сначала старые" },
    { value: "rating", label: "По рейтингу" },
    { value: "downloads", label: "По скачиваниям" },
  ];

  return (
    <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(typeFilter !== "all" || sortBy !== "newest") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onTypeChange("all");
            onSortChange("newest");
          }}
        >
          Сбросить
        </Button>
      )}
    </div>
  );
};
