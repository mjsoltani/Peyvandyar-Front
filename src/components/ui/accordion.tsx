"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  type?: "single";
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
  defaultValue?: string;
}

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

const AccordionContext = React.createContext<{
  openItem: string | null;
  setOpenItem: (value: string | null) => void;
}>({
  openItem: null,
  setOpenItem: () => {},
});

const AccordionItemContext = React.createContext<{
  value: string;
  isOpen: boolean;
}>({
  value: "",
  isOpen: false,
});

export function Accordion({ 
  className, 
  children, 
  defaultValue,
  ...props 
}: AccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(defaultValue || null);

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ 
  value, 
  className, 
  children,
  ...props 
}: AccordionItemProps) {
  const { openItem } = React.useContext(AccordionContext);
  const isOpen = openItem === value;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ 
  className, 
  children,
  ...props 
}: AccordionTriggerProps) {
  const { openItem, setOpenItem } = React.useContext(AccordionContext);
  const { value, isOpen } = React.useContext(AccordionItemContext);

  const handleClick = () => {
    setOpenItem(isOpen ? null : value);
  };

  return (
    <button
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className={cn(
        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
        isOpen && "rotate-180"
      )} />
    </button>
  );
}

export function AccordionContent({ 
  className, 
  children,
  ...props 
}: AccordionContentProps) {
  const { isOpen } = React.useContext(AccordionItemContext);

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all duration-200",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>
        {children}
      </div>
    </div>
  );
}