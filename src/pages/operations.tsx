import { AppLayout } from "@/components/layout/AppLayout";
import { OperationsList } from "@/components/ui/OperationsList";

const Operations = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Database</h1>
          <p className="text-muted-foreground">
            Browse all available medical procedures and their valuation details
          </p>
        </div>

        <OperationsList />
      </div>
    </AppLayout>
  );
};

export default Operations;