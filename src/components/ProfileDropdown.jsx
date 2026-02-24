import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Settings, LogOut, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 p-2 h-auto rounded-lg hover:bg-accent"
        >
          <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20">
            <AvatarImage src={user?.avatar_url} alt={user?.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none">
              {user?.username || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {user?.role || "Admin"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.username || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "Admin"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
          <User className="w-4 h-4 mr-2" />
          {t("common.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
          <Settings className="w-4 h-4 mr-2" />
          {t("common.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin/support")}>
          <HelpCircle className="w-4 h-4 mr-2" />
          {t("sidebar.support")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
