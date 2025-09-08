import { Link, useLocation } from "wouter";
import { Star, ChartPie, Folder, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Charts", href: "/", icon: ChartPie },
  { name: "Folders", href: "/folders", icon: Folder },
  { name: "Search", href: "/search", icon: Search },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-30">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Star className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Jyotish Manager</h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground" data-testid="text-sidebar-user-name">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-sidebar-user-email">
              {user?.email}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-sidebar-logout"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
