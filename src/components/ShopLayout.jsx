import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import LanguageToggle from "@/components/LanguageToggle";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  LogOut,
  User,
  X,
  BarChart3,
  Users,
  Wallet,
  MapPin,
  Store,
} from "lucide-react";

const shopMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/shop/dashboard" },
  { icon: Package, label: "Products", path: "/shop/products" },
  { icon: ShoppingCart, label: "Orders", path: "/shop/orders" },
  { icon: Users, label: "Customers", path: "/shop/customers" },
  { icon: BarChart3, label: "Reports", path: "/shop/reports" },
  { icon: Wallet, label: "Wallet", path: "/shop/wallet" },
  { icon: MapPin, label: "Locations", path: "/shop/locations" },
  { icon: Settings, label: "Settings", path: "/shop/settings" },
];

export default function ShopLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { sidebarStyle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0.95, 1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
      return () => mainElement.removeEventListener("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isRTL = language === "ar";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: isRTL ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 300 : -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed ${isRTL ? "right-0" : "left-0"} top-0 h-full w-64 bg-card border-r border z-50 lg:hidden`}
            >
              <SidebarContent
                location={location}
                user={user}
                onLogout={handleLogout}
                onClose={() => setSidebarOpen(false)}
                isRTL={isRTL}
                sidebarStyle={sidebarStyle}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Fixed Sidebar */}
        <aside
          className={`hidden lg:flex lg:flex-shrink-0 fixed ${
            isRTL ? "right-0" : "left-0"
          } top-0 h-screen z-20`}
        >
          <div
            className={`w-64 h-full overflow-hidden flex flex-col transition-all ${
              sidebarStyle === "gradient"
                ? "bg-gradient-to-b from-primary/10 via-card to-card border-r border"
                : sidebarStyle === "minimal"
                ? "bg-card/50 backdrop-blur-sm border-r border/50"
                : sidebarStyle === "compact"
                ? "bg-card border-r border"
                : "bg-card border-r border"
            }`}
          >
            <SidebarContent
              location={location}
              user={user}
              onLogout={handleLogout}
              isRTL={isRTL}
              sidebarStyle={sidebarStyle}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            isRTL ? "mr-64" : "ml-64"
          }`}
        >
          {/* Animated Header */}
          <motion.header
            style={{
              opacity: headerOpacity,
            }}
            className={`sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border transition-shadow duration-300 ${
              isScrolled ? "shadow-lg" : "shadow-sm"
            } ${isRTL ? "text-right" : "text-left"}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              className={`flex items-center justify-between h-16 px-4 lg:px-6 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="w-6 h-6" />
              </motion.button>

              <motion.div
                className={`flex items-center gap-2 ${
                  isRTL ? "mr-auto" : "ml-auto"
                }`}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <LanguageToggle />
                <ProfileDropdown />
              </motion.div>
            </div>
          </motion.header>

          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ location, user, onLogout, onClose, isRTL, sidebarStyle = "default" }) {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-center border-b border flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <span
            className="font-bold text-lg"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.6))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {isRTL ? "بوابة المتجر" : "Shop Portal"}
          </span>
        </motion.div>
        {onClose && (
          <motion.button
            onClick={onClose}
            className={`absolute ${
              isRTL ? "left-4" : "right-4"
            } p-2 rounded-lg hover:bg-accent transition-colors lg:hidden`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.username || "Shop Owner"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {shopMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-primary rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border">
        <motion.button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{isRTL ? "تسجيل الخروج" : "Logout"}</span>
        </motion.button>
      </div>
    </div>
  );
}

