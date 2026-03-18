import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VendorProvider } from "./components/VendorProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import NoDashboard from "./pages/NoDashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryDetail from "./pages/admin/AdminCategoryDetail";
import AdminCategoryCreate from "./pages/admin/AdminCategoryCreate";
import AdminCategoryEdit from "./pages/admin/AdminCategoryEdit";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCouponDetail from "./pages/admin/AdminCouponDetail";
import AdminCouponCreate from "./pages/admin/AdminCouponCreate";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminDoctorCreate from "./pages/admin/AdminDoctorCreate";
import AdminDoctorDetail from "./pages/admin/AdminDoctorDetail";
import AdminDoctorEdit from "./pages/admin/AdminDoctorEdit";
import AdminDoctorWallet from "./pages/admin/AdminDoctorWallet";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUserCreate from "./pages/admin/AdminUserCreate";
import AdminUserEdit from "./pages/admin/AdminUserEdit";
import AdminShops from "./pages/admin/AdminShops";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminCompanyCreate from "./pages/admin/AdminCompanyCreate";
import AdminCompanyPlans from "./pages/admin/AdminCompanyPlans";
import AdminShopCreate from "./pages/admin/AdminShopCreate";
import AdminShopEdit from "./pages/admin/AdminShopEdit";
import AdminShopDetail from "./pages/admin/AdminShopDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductDetail from "./pages/admin/AdminProductDetail";
import AdminProductAnalytics from "./pages/admin/AdminProductAnalytics";
import AdminProductCreate from "./pages/admin/AdminProductCreate";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminAvailableOrders from "./pages/admin/AdminAvailableOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminRatings from "./pages/admin/AdminRatings";
import AdminSliders from "./pages/admin/AdminSliders";
import AdminSliderDetail from "./pages/admin/AdminSliderDetail";
import AdminSliderCreate from "./pages/admin/AdminSliderCreate";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSupportTicketDetail from "./pages/admin/AdminSupportTicketDetail";
import AdminRepresentatives from "./pages/admin/AdminRepresentatives";
import AdminRepresentativeCreate from "./pages/admin/AdminRepresentativeCreate";
import AdminRepresentativeEdit from "./pages/admin/AdminRepresentativeEdit";
import AdminRepresentativeDetail from "./pages/admin/AdminRepresentativeDetail";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminReports from "./pages/admin/AdminReports";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminMaps from "./pages/admin/AdminMaps";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminDriverCreate from "./pages/admin/AdminDriverCreate";
import AdminDriverEdit from "./pages/admin/AdminDriverEdit";
import AdminDriverDetail from "./pages/admin/AdminDriverDetail";
import AdminDeliveryTracking from "./pages/admin/AdminDeliveryTracking";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminFileUploads from "./pages/admin/AdminFileUploads";
import AdminVisits from "./pages/admin/AdminVisits";
import AdminVisitCreate from "./pages/admin/AdminVisitCreate";
import AdminVisitDetail from "./pages/admin/AdminVisitDetail";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminMessageConversation from "./pages/admin/AdminMessageConversation";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return "/login";
    const hasAdminRole = user.role === "admin" || (user.role_names && Array.isArray(user.role_names) && user.role_names.includes("admin"));
    if (hasAdminRole) return "/admin/dashboard";
    return "/no-dashboard";
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
      />
      <Route path="/no-dashboard" element={user ? <NoDashboard /> : <Navigate to="/login" replace />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCategories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCategoryCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCategoryDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCategoryEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCoupons />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCouponCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCouponDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDoctors />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors/create"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDoctorCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDoctorDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDoctorEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors/:id/wallet"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDoctorWallet />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminUserCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminUserEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminUserDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shops"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShops />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCompanies />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-plans"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCompanyPlans />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminCompanyCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShopEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShopDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shops/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShopCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shops/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShopEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shops/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminShopDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProductCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProductDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/analytics"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProductAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProductEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/available-orders"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminAvailableOrders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminOrderDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ratings"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRatings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sliders"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSliders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sliders/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSliderCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sliders/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSliderCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sliders/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSliderDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages/conversation/:user1/:user2"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminMessageConversation />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminMessages />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSupport />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support/tickets/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSupportTicketDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/representatives"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRepresentatives />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/representatives/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRepresentativeCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/representatives/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRepresentativeEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/representatives/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRepresentativeDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financial"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminFinancial />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRoles />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/maps"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminMaps />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDrivers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDriverCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDriverEdit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDriverDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deliveries"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDeliveries />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deliveries/:id/tracking"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDeliveryTracking />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminVendors />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/file-uploads"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminFileUploads />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visits"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminVisits />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visits/create"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminVisitCreate />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visits/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminVisitDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminNotifications />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <VendorProvider>
                <AppRoutes />
              </VendorProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
