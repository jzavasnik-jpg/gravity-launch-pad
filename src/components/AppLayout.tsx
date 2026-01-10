import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    PenTool,
    Image as ImageIcon,
    Film,
    User,
    Settings,
    LogOut,
    Share2,
    Home,
    FolderOpen,
    FileVideo,
    LayoutTemplate,
    Workflow,
    ChevronDown,
    TrendingUp,
    Target,
    Download,
    Rocket,
    FileText,
    FlaskConical,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { appState } = useApp();
    const [collapsed, setCollapsed] = React.useState(false);

    // Navigation items in the user-requested order:
    // Home, ICP, Avatars, Asset Library, Market Radar, Strategy, Content, Director, Thumbnails, Beta (conditional), Export, Landing Page, Mission Control
    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/icp/review', label: 'ICP', icon: FileText },
        { path: '/dashboard', label: 'Avatars', icon: User },
        { path: '/product-assets', label: 'Asset Library', icon: FolderOpen },
        { path: '/veritas/market-radar', label: 'Market Radar', icon: TrendingUp },
        { path: '/veritas/strategy', label: 'Strategy', icon: Target },
        { path: '/veritas/content-composer', label: 'Content', icon: PenTool },
        { path: '/veritas/directors-cut', label: 'Director', icon: Film },
        { path: '/veritas/thumbnail-composer', label: 'Thumbnails', icon: ImageIcon },
        { path: '/beta-content', label: 'Beta', icon: FlaskConical, conditional: true },
        { path: '/veritas/export-studio', label: 'Export', icon: Download },
        { path: '/landing-pad', label: 'Landing Page', icon: Rocket },
        { path: '/mission-control', label: 'Mission Control', icon: Activity, comingSoon: true },
    ];

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
            {/* Header */}
            <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-zinc-400 hover:text-white hover:bg-white/5 mr-2"
                    >
                        <LayoutTemplate className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-bold tracking-tight text-foreground">G</span>
                        <span className="font-display text-lg tracking-tight text-foreground">Gravity Product Launcher</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {appState.headerActions}
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex flex-1 pt-16">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "border-r border-border bg-background/95 backdrop-blur fixed left-0 top-16 bottom-0 flex flex-col py-6 z-40 transition-all duration-300 ease-in-out overflow-hidden",
                        collapsed ? "w-16" : "w-64"
                    )}
                >
                    <nav className="flex-1 flex flex-col gap-2 w-full px-3 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const itemWithFlags = item as typeof item & { conditional?: boolean; comingSoon?: boolean };

                            // Hide conditional items (Beta) if no content has been generated yet
                            // For now, we show it but could add logic to hide based on appState
                            if (itemWithFlags.conditional) {
                                // Beta is conditional - could check if first content is generated
                                // For now, always show it
                            }

                            // Coming soon items are disabled
                            if (itemWithFlags.comingSoon) {
                                return (
                                    <div
                                        key={item.path}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative cursor-not-allowed opacity-50",
                                            collapsed && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                                        {!collapsed && (
                                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                                                {item.label}
                                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Soon</span>
                                            </span>
                                        )}
                                        {collapsed && (
                                            <div className="absolute left-14 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                {item.label} (Coming Soon)
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                        collapsed && "justify-center px-0"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />

                                    {!collapsed && (
                                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-14 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        <div className="h-px w-full bg-white/10 my-2" />

                        <Link
                            to="/settings"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">Settings</span>}
                        </Link>
                    </nav>

                    <div className={cn("mt-auto px-3", collapsed && "flex justify-center")}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className={cn("flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors", collapsed && "border-none bg-transparent p-0")}>
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={user?.photoURL || appState.avatarData?.photo_url} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                                            {appState.userName?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!collapsed && (
                                        <div className="flex flex-col overflow-hidden text-left">
                                            <span className="text-xs font-medium text-white truncate">{appState.userName || "User"}</span>
                                            <span className="text-[10px] text-zinc-500 truncate">{appState.userEmail || "user@example.com"}</span>
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="right" className="w-56 bg-black border border-zinc-800 text-white shadow-xl ml-2">
                                <DropdownMenuLabel className="text-zinc-400">My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:bg-zinc-900 focus:text-white cursor-pointer text-zinc-200">
                                    <User className="mr-2 h-4 w-4" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')} className="focus:bg-zinc-900 focus:text-white cursor-pointer text-zinc-200">
                                    <Settings className="mr-2 h-4 w-4" /> Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-900/20 focus:text-red-400 text-red-400 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </aside>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 min-h-[calc(100vh-64px)] bg-background relative transition-all duration-300 ease-in-out",
                        collapsed ? "ml-16" : "ml-64"
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

