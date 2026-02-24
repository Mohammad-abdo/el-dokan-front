import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Pill, ShoppingCart, Calendar, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [doctors, products, categories, orders, bookings, prescriptions] = await Promise.all([
        api.get('/doctors').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/prescriptions').catch(() => ({ data: [] })),
      ]);

      const getArrayLength = (data) => {
        if (Array.isArray(data)) return data.length;
        if (data?.data && Array.isArray(data.data)) return data.data.length;
        if (data?.products && Array.isArray(data.products)) return data.products.length;
        return 0;
      };

      setStats({
        totalPatients: getArrayLength(doctors.data),
        totalDoctors: getArrayLength(doctors.data),
        totalMedicines: getArrayLength(products.data),
        totalOrders: getArrayLength(orders.data),
        totalAppointments: getArrayLength(bookings.data),
        totalPrescriptions: getArrayLength(prescriptions.data),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Medicines',
      value: stats?.totalMedicines || 0,
      icon: Pill,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Appointments',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Prescriptions',
      value: stats?.totalPrescriptions || 0,
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Green RX Pharmacy Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                    className="text-3xl font-bold"
                  >
                    {card.value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
