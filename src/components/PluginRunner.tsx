import { useEffect, useState } from "react";
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
 * Plugins can inject HTML/CSS content into the page.
 * 
 * Plugin code format (JSON):
 * {
 *   "html": "<div>...</div>",
 *   "css": ".class { ... }",
 *   "position": "before" | "after"
 * }
 */
const PluginRunner = ({ hookPoint, context = {} }: PluginRunnerProps) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    const loadPlugins = async () => {
      const { data } = await supabase
        .from("forum_plugins")
        .select("*")
        .eq("is_active", true);

      if (data) {
        // Filter plugins that have this hook point
        const matching = (data as Plugin[]).filter(p => {
          if (!p.hook_points || p.hook_points.length === 0) return true; // Run everywhere if no hooks specified
          return p.hook_points.includes(hookPoint);
        });
        setPlugins(matching);
      }
    };

    loadPlugins();
  }, [hookPoint]);

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
          // If not JSON, treat as raw HTML
          return (
            <div 
              key={plugin.id} 
              data-plugin={plugin.name}
              dangerouslySetInnerHTML={{ __html: plugin.code }}
            />
          );
        }
      })}
    </>
  );
};

export default PluginRunner;
