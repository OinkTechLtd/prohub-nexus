import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  Code,
  List,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Quote,
  EyeOff,
  Youtube,
  Heading1,
  Heading2,
  Indent,
  MessageSquareOff,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface BBCodeToolbarProps {
  onInsert: (before: string, after: string) => void;
}

const COLORS = [
  { name: "Красный", value: "red" },
  { name: "Синий", value: "blue" },
  { name: "Зелёный", value: "green" },
  { name: "Оранжевый", value: "orange" },
  { name: "Фиолетовый", value: "purple" },
  { name: "Жёлтый", value: "yellow" },
  { name: "Белый", value: "white" },
  { name: "Серый", value: "gray" },
];

const SIZES = [
  { name: "Мелкий", value: "1" },
  { name: "Маленький", value: "2" },
  { name: "Средний", value: "3" },
  { name: "Большой", value: "5" },
  { name: "Огромный", value: "7" },
];

const BBCodeToolbar = ({ onInsert }: BBCodeToolbarProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [imgInput, setImgInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");

  const buttons = [
    { icon: Bold, label: "Жирный", before: "[B]", after: "[/B]" },
    { icon: Italic, label: "Курсив", before: "[I]", after: "[/I]" },
    { icon: Underline, label: "Подчёркнутый", before: "[U]", after: "[/U]" },
    { icon: Strikethrough, label: "Зачёркнутый", before: "[S]", after: "[/S]" },
    { icon: Code, label: "Код", before: "[CODE]", after: "[/CODE]" },
    { icon: Quote, label: "Цитата", before: '[QUOTE]', after: "[/QUOTE]" },
    { icon: EyeOff, label: "Спойлер", before: '[SPOILER="Спойлер"]', after: "[/SPOILER]" },
    { icon: MessageSquareOff, label: "Оффтоп", before: "[OFFTOPIC]", after: "[/OFFTOPIC]" },
    { icon: List, label: "Список", before: "[LIST]\n[*]", after: "\n[/LIST]" },
    { icon: AlignCenter, label: "По центру", before: "[CENTER]", after: "[/CENTER]" },
    { icon: AlignRight, label: "Справа", before: "[RIGHT]", after: "[/RIGHT]" },
    { icon: Indent, label: "Отступ", before: "[INDENT]", after: "[/INDENT]" },
    { icon: Heading1, label: "Заголовок 1", before: "[H1]", after: "[/H1]" },
    { icon: Heading2, label: "Заголовок 2", before: "[H2]", after: "[/H2]" },
  ];

  return (
    <div className="flex flex-wrap gap-0.5 p-2 border rounded-t-lg bg-muted/50 border-b-0">
      {buttons.map(({ icon: Icon, label, before, after }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onInsert(before, after)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Color picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="grid grid-cols-4 gap-1">
            {COLORS.map((color) => (
              <Button
                key={color.value}
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => onInsert(`[COLOR=${color.value}]`, "[/COLOR]")}
              >
                <span style={{ color: color.value }}>●</span>
                <span className="ml-1">{color.name}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Size picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="flex flex-col gap-1">
            {SIZES.map((size) => (
              <Button
                key={size.value}
                type="button"
                size="sm"
                variant="ghost"
                className="justify-start text-xs"
                onClick={() => onInsert(`[SIZE=${size.value}]`, "[/SIZE]")}
              >
                {size.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* URL */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Link className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="top">
          <div className="space-y-2">
            <Input
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                onInsert(`[URL=${urlInput || "https://"}]`, "[/URL]");
                setUrlInput("");
              }}
            >
              Вставить ссылку
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Image className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="top">
          <div className="space-y-2">
            <Input
              placeholder="URL изображения..."
              value={imgInput}
              onChange={(e) => setImgInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                onInsert(`[IMG]${imgInput}`, "[/IMG]");
                setImgInput("");
              }}
            >
              Вставить изображение
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* YouTube */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Youtube className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="top">
          <div className="space-y-2">
            <Input
              placeholder="ID видео YouTube..."
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                onInsert(`[MEDIA=youtube]${youtubeInput}`, "[/MEDIA]");
                setYoutubeInput("");
              }}
            >
              Вставить YouTube
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BBCodeToolbar;
