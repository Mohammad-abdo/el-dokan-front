import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign } from 'lucide-react';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, bookingsRes, patientsRes, prescriptionsRes, walletRes] = await Promise.all([
        api.get('/doctor/dashboard').catch(() => ({ data: {} })),
        api.get('/doctor/bookings').catch(() => ({ data: [] })),
        api.get('/doctor/patients').catch(() => ({ data: [] })),
        api.get('/doctor/prescriptions').catch(() => ({ data: [] })),
        api.get('/doctor/wallet').catch(() => ({ data: {} })),
      ]);

      const bookings = extractDataFromResponse(bookingsRes);
      const patients = extractDataFromResponse(patientsRes);
      const prescriptions = extractDataFromResponse(prescriptionsRes);

      setStats({
        totalBookings: bookings.length,
        totalPatients: patients.length,
        totalPrescriptions: prescriptions.length,
        walletBalance: walletRes.data?.data?.balance || walletRes.data?.balance || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Prescriptions',
      value: stats.totalPrescriptions,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Wallet Balance',
      value: `$${stats.walletBalance.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your practice statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


