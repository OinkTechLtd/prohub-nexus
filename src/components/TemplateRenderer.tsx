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

  // Execute any inline JS in templates
  useEffect(() => {
    templates.forEach((template) => {
      if (!template.html_content) return;
      const scriptMatch = template.html_content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatch) {
        scriptMatch.forEach((tag) => {
          const jsContent = tag.replace(/<\/?script[^>]*>/gi, '');
          if (jsContent.trim()) {
            try {
              new Function(jsContent)();
            } catch (e) {
              console.error(`Template "${template.name}" JS error:`, e);
            }
          }
        });
      }
    });
  }, [templates]);

  const stripScripts = (html: string) => {
    return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  };

  const extractStyles = (html: string): { styles: string; cleanHtml: string } => {
    let styles = '';
    const cleanHtml = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
      styles += css;
      return '';
    });
    return { styles, cleanHtml: stripScripts(cleanHtml) };
  };

  if (templates.length === 0) return null;

  return (
    <>
      {templates.map((template) => {
        const htmlContent = template.html_content || '';
        const { styles: inlineStyles, cleanHtml } = extractStyles(htmlContent);
        const allCss = [template.css_content, inlineStyles].filter(Boolean).join('\n');

        return (
          <div key={template.id} className={className}>
            {allCss && (
              <style dangerouslySetInnerHTML={{ __html: allCss }} />
            )}
            {cleanHtml && (
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            )}
          </div>
        );
      })}
    </>
  );
};

export default TemplateRenderer;
