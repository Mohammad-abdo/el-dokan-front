import { useParams } from "react-router-dom";
import AdminExport from "./AdminExport";

export default function AdminCompanyReportDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <AdminExport presetShopId={id} />
    </div>
  );
}

