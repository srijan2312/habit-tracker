import * as React from "react";

export const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  placeholder?: string;
}> = ({ onSearch, placeholder = "Search habits or stats..." }) => {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        className="rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        aria-label="Search"
      >
        Search
      </button>
    </form>
  );
};
