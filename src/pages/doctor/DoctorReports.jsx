import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { FileText } from 'lucide-react';

export default function DoctorReports() {
  const [loading, setLoading] = useState(false);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const response = await api.get(`/doctor/reports/${type}`);
      console.log(`${type} report:`, response.data);
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { key: 'patients', label: 'Patients Report' },
    { key: 'prescriptions', label: 'Prescriptions Report' },
    { key: 'products', label: 'Products Report' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and view reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reportTypes.map((report) => (
          <div key={report.key} className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">{report.label}</h3>
            </div>
            <Button
              onClick={() => fetchReport(report.key)}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}


