import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";

const ActasRecepcao = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Actas de Recepção"
        description="Lista de todas as actas de recepção emitidas pela Secretaria"
      />
      <ActasRecepcaoList allowEdit />
    </AppLayout>
  );
};

export default ActasRecepcao;
