import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TemplateRendererProps {
  slug?: string;
  templateType?: string;
  className?: string;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  html_content: string | null;
  css_content: string | null;
  is_active: boolean;
  template_type: string | null;
}

/**
 * Renders active forum templates by slug or type.
 * Templates are stored in forum_templates table and managed via admin panel.
 */
const TemplateRenderer = ({ slug, templateType, className = "" }: TemplateRendererProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      let query = supabase
        .from("forum_templates")
        .select("*")
        .eq("is_active", true);

      if (slug) {
        query = query.eq("slug", slug);
      }
      if (templateType) {
        query = query.eq("template_type", templateType);
      }

      const { data } = await query;
      setTemplates((data as Template[]) || []);
    };

    loadTemplates();
  }, [slug, templateType]);

  if (templates.length === 0) return null;

  return (
    <>
      {templates.map((template) => (
        <div key={template.id} className={className}>
          {template.css_content && (
            <style dangerouslySetInnerHTML={{ __html: template.css_content }} />
          )}
          {template.html_content && (
            <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
          )}
        </div>
      ))}
    </>
  );
};

export default TemplateRenderer;
