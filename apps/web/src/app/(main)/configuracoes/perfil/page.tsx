import { AppHeader } from "@/components/shell/AppHeader";
import { PerfilForm } from "./PerfilForm";

export default function PerfilPage() {
  return (
    <>
      <AppHeader
        title="Perfil"
        subtitle="Seus dados e grupos vinculados no VisoHelp."
      />
      <div className="flex-1 p-6">
        <PerfilForm />
      </div>
    </>
  );
}
