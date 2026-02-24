import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Determine user role - use API role/user_type/service_provider_type when available
        let userRole = parsedUser.role;
        if (!userRole && parsedUser.role_names && Array.isArray(parsedUser.role_names) && parsedUser.role_names.length > 0) {
          const priority = ['admin', 'doctor', 'shop', 'driver', 'representative', 'user'];
          userRole = priority.find((r) => parsedUser.role_names.includes(r)) || parsedUser.role_names[0];
        }
        
        const userWithRole = {
          ...parsedUser,
          role: userRole || parsedUser.role,
          user_type: parsedUser.user_type ?? (parsedUser.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(parsedUser.role) ? 'service_provider' : 'user'),
          service_provider_type: parsedUser.service_provider_type ?? (['doctor', 'shop', 'driver', 'representative'].includes(parsedUser.role) ? parsedUser.role : null),
        };
        setToken(storedToken);
        setUser(userWithRole);
        verifyToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data.user;
      
      // Use API user_type / service_provider_type when available
      let userRole = userData.role;
      if (!userRole && userData.role_names?.length > 0) {
        const priority = ['admin', 'doctor', 'shop', 'driver', 'representative', 'user'];
        userRole = priority.find((r) => userData.role_names.includes(r)) || userData.role_names[0];
      }
      
      const userWithRole = {
        ...userData,
        role: userRole || userData.role,
        user_type: userData.user_type ?? (userData.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(userData.role) ? 'service_provider' : 'user'),
        service_provider_type: userData.service_provider_type ?? (['doctor', 'shop', 'driver', 'representative'].includes(userData.role) ? userData.role : null),
      };
      
      // Update localStorage with the verified user data
      localStorage.setItem("auth_user", JSON.stringify(userWithRole));
      setUser(userWithRole);
      setToken(tokenToVerify);
    } catch (error) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log(email, password);
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: newUser } = response.data.data;
      console.log(response.data);

      let userRole = newUser.role;
      if (!userRole && newUser.role_names?.length > 0) {
        const priority = ['admin', 'doctor', 'shop', 'driver', 'representative', 'user'];
        userRole = priority.find((r) => newUser.role_names.includes(r)) || newUser.role_names[0];
      }

      const userWithRole = {
        ...newUser,
        role: userRole || newUser.role,
        user_type: newUser.user_type ?? (newUser.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(newUser.role) ? 'service_provider' : 'user'),
        service_provider_type: newUser.service_provider_type ?? (['doctor', 'shop', 'driver', 'representative'].includes(newUser.role) ? newUser.role : null),
      };

      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("auth_user", JSON.stringify(userWithRole));

      setToken(newToken);
      setUser(userWithRole);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setToken(null);
  };

  const isAdmin = user?.role === "admin" || (user?.role_names && user.role_names.includes("admin"));
  const isDoctor = user?.role === "doctor" || (user?.role_names && user.role_names.includes("doctor"));
  const isShop = user?.role === "shop" || (user?.role_names && user.role_names.includes("shop"));
  const isDriver = user?.role === "driver" || (user?.role_names && user.role_names.includes("driver"));
  const isRepresentative = user?.role === "representative" || (user?.role_names && user.role_names.includes("representative"));
  const isUser = !isAdmin && !isDoctor && !isShop && !isDriver && !isRepresentative;
  const userType = user?.user_type ?? (isAdmin ? "admin" : isDoctor || isShop || isDriver || isRepresentative ? "service_provider" : "user");
  const serviceProviderType = user?.service_provider_type ?? (isDoctor ? "doctor" : isShop ? "shop" : isDriver ? "driver" : isRepresentative ? "representative" : null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isDoctor,
        isShop,
        isDriver,
        isRepresentative,
        isUser,
        userType,
        serviceProviderType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
