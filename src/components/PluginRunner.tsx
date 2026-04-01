import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Plugin {
  id: string;
  name: string;
  code: string | null;
  hook_points: string[] | null;
  is_active: boolean;
  config: any;
}

interface PluginRunnerProps {
  hookPoint: string;
  context?: Record<string, any>;
}

/**
 * Executes active plugins for a specific hook point.
 * Plugins can inject HTML/CSS/JS content into the page.
 * 
 * Supported code formats:
 * 1. JSON: { "html": "...", "css": "...", "js": "..." }
 * 2. Raw HTML (with inline <style> and <script> tags)
 */
const PluginRunner = ({ hookPoint, context = {} }: PluginRunnerProps) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const loadPlugins = async () => {
      const { data } = await supabase
        .from("forum_plugins")
        .select("*")
        .eq("is_active", true);

      if (data) {
        const matching = (data as Plugin[]).filter(p => {
          if (!p.hook_points || p.hook_points.length === 0) return true;
          return p.hook_points.includes(hookPoint);
        });
        setPlugins(matching);
      }
    };

    loadPlugins();
  }, [hookPoint]);

  // Execute JS after render
  useEffect(() => {
    plugins.forEach((plugin) => {
      if (!plugin.code) return;

      try {
        const parsed = JSON.parse(plugin.code);
        if (parsed.js) {
          executePluginJs(parsed.js, plugin.name);
        }
      } catch {
        // Raw HTML - extract and execute script tags
        const scriptMatch = plugin.code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatch) {
          scriptMatch.forEach((tag) => {
            const jsContent = tag.replace(/<\/?script[^>]*>/gi, '');
            if (jsContent.trim()) {
              executePluginJs(jsContent, plugin.name);
            }
          });
        }
      }
    });
  }, [plugins]);

  const executePluginJs = (jsCode: string, pluginName: string) => {
    try {
      const fn = new Function('context', jsCode);
      fn(context);
    } catch (e) {
      console.error(`Plugin "${pluginName}" JS error:`, e);
    }
  };

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

  if (plugins.length === 0) return null;

  return (
    <>
      {plugins.map((plugin) => {
        if (!plugin.code) return null;

        try {
          const parsed = JSON.parse(plugin.code);
          return (
            <div key={plugin.id} data-plugin={plugin.name}>
              {parsed.css && (
                <style dangerouslySetInnerHTML={{ __html: parsed.css }} />
              )}
              {parsed.html && (
                <div dangerouslySetInnerHTML={{ __html: parsed.html }} />
              )}
            </div>
          );
        } catch {
          // Raw HTML with embedded styles and scripts
          const { styles, cleanHtml } = extractStyles(plugin.code);
          return (
            <div key={plugin.id} data-plugin={plugin.name}>
              {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </div>
          );
        }
      })}
    </>
  );
};

export default PluginRunner;
