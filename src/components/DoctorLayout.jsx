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
  Calendar,
  MessageSquare,
  Users,
  FileText,
  MapPin,
  Wallet,
  BarChart3,
  Menu,
  LogOut,
  User,
  X,
} from "lucide-react";

const doctorMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/doctor/dashboard" },
  { icon: Calendar, label: "Bookings", path: "/doctor/bookings" },
  { icon: Users, label: "Patients", path: "/doctor/patients" },
  { icon: FileText, label: "Prescriptions", path: "/doctor/prescriptions" },
  { icon: MessageSquare, label: "Chat", path: "/doctor/chat" },
  { icon: MapPin, label: "Medical Centers", path: "/doctor/medical-centers" },
  { icon: Wallet, label: "Wallet", path: "/doctor/wallet" },
  { icon: BarChart3, label: "Reports", path: "/doctor/reports" },
];

export default function DoctorLayout({ children }) {
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary-foreground"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
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
            {isRTL ? "بوابة الطبيب" : "Doctor Portal"}
          </span>
        </motion.div>
        {onClose && (
          <motion.button
            onClick={onClose}
            className={`absolute ${
              isRTL ? "left-4" : "right-4"
            } p-2 rounded-lg hover:bg-accent transition-colors lg:hidden`}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {doctorMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/doctor/dashboard" &&
              location.pathname.startsWith(item.path + "/"));

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ x: isRTL ? -4 : 4 }}
            >
              <Link
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg transition-all relative group ${
                  sidebarStyle === "compact" ? "px-3 py-2" : "px-4 py-3"
                } ${
                  isActive
                    ? sidebarStyle === "gradient"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : sidebarStyle === "minimal"
                      ? "bg-primary/20 text-primary border-l-2 border-primary"
                      : "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    sidebarStyle === "compact" ? "w-4 h-4" : "w-5 h-5"
                  }`}
                />
                <span
                  className={`font-medium ${
                    sidebarStyle === "compact" ? "text-xs" : ""
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-primary rounded-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <motion.div
                    className={`absolute ${isRTL ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300`}
                    initial={false}
                    whileHover={{ height: "60%" }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.username || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {isRTL ? "طبيب" : "Doctor"}
            </p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{isRTL ? "تسجيل الخروج" : "Logout"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
