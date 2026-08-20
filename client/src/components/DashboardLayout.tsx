import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Code2, LayoutDashboard, LogOut, PanelLeft, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const defaultMenuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  title = "CodeCraft төв",
  menuItems = defaultMenuItems,
}: {
  children: React.ReactNode;
  title?: string;
  menuItems?: typeof defaultMenuItems;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111126] p-5 text-white cc-lab-grid">
        <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-950/40"><Code2 size={23} /></div>
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="cc-mono-label text-[10px] text-violet-300">CodeCraft • Secure workspace</p>
            <h1 className="cc-display text-2xl font-bold tracking-tight">Үргэлжлүүлэхийн тулд нэвтэрнэ үү</h1>
            <p className="max-w-sm text-sm leading-6 text-white/60">
              Энэ ажлын хэсэг нь таны баталгаажсан эрх, сургалтын өгөгдлийг ашиглана.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="mt-7 w-full bg-violet-500 text-white shadow-lg shadow-violet-950/30 hover:bg-violet-400"
          >
            Нэвтрэх
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} title={title} menuItems={menuItems}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  title: string;
  menuItems: typeof defaultMenuItems;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  title,
  menuItems,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative hidden md:block" data-testid="dashboard-sidebar-host" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-white/10 bg-[#111126] text-slate-100"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-[78px] justify-center border-b border-white/10">
            <div className="flex w-full items-center gap-3 px-3 transition-all">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                aria-label="Цэс нээх эсвэл хаах"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-md shadow-violet-950/40"><Code2 size={16} /></div>
                  <div className="min-w-0"><p className="cc-display truncate text-sm font-bold">CodeCraft</p><p className="cc-mono-label mt-0.5 truncate text-[8px] text-violet-300">{title}</p></div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-3 py-4">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 rounded-xl px-3 font-medium transition-all ${isActive ? "bg-violet-500/20 text-white hover:bg-violet-500/25" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-violet-300" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.07] group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                  <Avatar className="h-9 w-9 shrink-0 border border-violet-300/25">
                    <AvatarFallback className="bg-violet-400/15 text-xs font-bold text-violet-200">
                      {(user?.displayName ?? user?.name)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold leading-none text-white">
                      {user?.displayName ?? user?.name ?? "-"}
                    </p>
                    <p className="mt-1.5 truncate text-xs text-slate-400">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Гарах</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          data-testid="dashboard-sidebar-resize-handle"
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset data-testid="dashboard-content-canvas" className="w-full min-w-0">
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#111126]/95 px-3 text-white backdrop-blur supports-[backdrop-filter]:backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Удирдлагын цэс нээх" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                  <PanelLeft className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="w-56 border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.path} onSelect={() => setLocation(item.path)} className="cursor-pointer gap-2 rounded-lg px-3 py-2.5 font-medium focus:bg-violet-50 focus:text-violet-800">
                    <item.icon className="h-4 w-4 text-violet-600" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="cc-display tracking-tight text-white">
                  {activeMenuItem?.label ?? "Цэс"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <main className="flex w-full min-w-0 flex-1 flex-col bg-transparent p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
