import { SettingsPanel } from '@basalt/ui';
import { useServices } from '~/services/ServiceContext';


export function WebSettings() {
  const { ollama } = useServices();

  return <SettingsPanel ollama={ollama} />;
}