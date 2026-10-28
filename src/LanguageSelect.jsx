import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { languages } from "./languages";

export default function LanguageSelect({ selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Filter the list based on what the user typed
  const q = query.trim().toLowerCase();
  const matches = languages.filter(([name, native, code]) =>
    `${name} ${native} ${code}`.toLowerCase().includes(q)
  );

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Focus the search box when the menu opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggleMenu = () => {
    setOpen(!open);
    setQuery("");
  };

  const choose = (name, code) => {
    onSelect({ name, code });
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && matches.length > 0) {
      const [name, , code] = matches[0];
      choose(name, code);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="dropdown" ref={wrapRef}>
      <button
        type="button"
        className="lang-toggle"
        onClick={toggleMenu}
        disabled={disabled}
      >
        <span>{selected.name}</span>
        <ChevronDown size={16} className={open ? "chevron open" : "chevron"} />
      </button>

      {open && (
        <div className="lang-menu">
          <div className="search-wrap">
            <Search size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search language..."
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <ul className="lang-list">
            {matches.length === 0 && <li className="empty">No language found</li>}

            {matches.map(([name, , code]) => (
              <li
                key={code}
                className={code === selected.code ? "active" : ""}
                onClick={() => choose(name, code)}
              >
                <span>{name}</span>
                {code === selected.code && <Check size={16} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
