'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { signOut } from '@/lib/auth-service';
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

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { appState } = useApp();
    const [collapsed, setCollapsed] = React.useState(false);

    // Navigation items
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
        { path: '/veritas/export-studio', label: 'Export', icon: Download },
        { path: '/landing-pad', label: 'Landing Page', icon: Rocket },
    ];

    const handleLogout = async () => {
        await signOut();
        router.push('/');
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
                        className="text-muted-foreground hover:text-foreground hover:bg-muted mr-2"
                    >
                        <LayoutTemplate className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight text-primary" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>G</span>
                        <span className="text-lg tracking-tight text-foreground" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>Launch Pad</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {appState.headerActions}
                    <ThemeToggle />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {user?.email || 'User'}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                            const isActive = pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                        collapsed && "justify-center px-0",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 flex-shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )} />
                                    {!collapsed && (
                                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                            {item.label}
                                        </span>
                                    )}
                                    {collapsed && (
                                        <div className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border shadow-lg">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sessions Link at Bottom */}
                    <div className="px-3 mt-auto">
                        <Link
                            href="/sessions"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                collapsed && "justify-center px-0",
                                pathname === '/sessions'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <FolderOpen className={cn(
                                "w-5 h-5 flex-shrink-0",
                                pathname === '/sessions' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            {!collapsed && (
                                <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                    Sessions
                                </span>
                            )}
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 transition-all duration-300 ease-in-out",
                        collapsed ? "ml-16" : "ml-64"
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

// Named export for compatibility
export { AppLayout };
