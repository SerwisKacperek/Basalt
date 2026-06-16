import { SettingsPanel } from '~/components/SettingsPanel';
import { useServices } from '~/services/ServiceContext';


export function WebSettings() {
  const { ai } = useServices();

  return <SettingsPanel ai={ai} />;
}
