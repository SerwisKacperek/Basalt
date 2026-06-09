import { useServices } from "~/services/ServiceContext";
import { SettingsModal } from "@basalt/ui";

export function SomePage() {
 
  const { storage } = useServices(); 

  return (
    <div className="mt-4">
      <SettingsModal storage={storage} />
    </div>
  );
}