"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";

interface ExportMenuProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
  label?: string;
  className?: string;
  menuClassName?: string;
}

export function ExportMenu({
  onExportCsv,
  onExportPdf,
  label = "Export",
  className = "",
  menuClassName = ""
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-border bg-background text-sm"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 min-w-36 rounded-md border border-border bg-card shadow-lg z-50 ${menuClassName}`}>
          <button
            type="button"
            onClick={() => {
              onExportCsv();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              onExportPdf();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
