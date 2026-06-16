import { SettingsPanel } from "~/components/SettingsPanel";
import { useServices } from "~/services/ServiceContext";

export const SettingsPage = () => {
  const { ai } = useServices();

  return (
    <div className="container mx-auto p-4">
      <SettingsPanel
        ai={ai}
      />
    </div>
  );
};