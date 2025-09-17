"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavigationProps {
  currentView: "events" | "nft";
  onViewChange: (view: "events" | "nft") => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer ${
                currentView === "events"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => onViewChange("events")}
            >
              Recent Events
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer ${
                currentView === "nft"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => onViewChange("nft")}
            >
              NFT Grid
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </div>
  );
}
