"use client";

import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavigationProps {
  currentView: "events" | "nft";
  onViewChange: (view: "events" | "nft") => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <NavigationMenu className="mx-auto">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "events"
                ? "bg-neutral-800 text-white"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800"
            }`}
            onClick={() => onViewChange("events")}
          >
            Recent Events
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "nft"
                ? "bg-neutral-800 text-white"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800"
            }`}
            onClick={() => onViewChange("nft")}
          >
            NFT Grid
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
