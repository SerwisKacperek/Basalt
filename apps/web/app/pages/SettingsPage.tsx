import { SettingsPanel } from "@basalt/ui";
import { useServices } from "~/services/ServiceContext";

export const SettingsPage = () => {
  const { ollama } = useServices();

  return (
    <div className="container mx-auto p-4">
      <SettingsPanel 
        ollama={ollama}
      />
    </div>
  );
};