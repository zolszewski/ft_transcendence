"use client";

import { useState } from "react";

export type ExploreFilters = {
  faculty: string;
  createdFrom: string;
  createdTo: string;
  friendsOnly: boolean;
};

export const emptyExploreFilters: ExploreFilters = {
  faculty: "",
  createdFrom: "",
  createdTo: "",
  friendsOnly: false,
};

function filtersActive(filters: ExploreFilters) {
  return Boolean(
    filters.faculty.trim() || filters.createdFrom || filters.createdTo || filters.friendsOnly,
  );
}

type FilterSectionProps = {
  filters: ExploreFilters;
  appliedFilters: ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
  onApply: () => void;
  onClear: () => void;
  isLoggedIn: boolean | null;
};

export default function FilterSection({
  filters,
  appliedFilters,
  onChange,
  onApply,
  onClear,
  isLoggedIn,
}: FilterSectionProps) {
  const [open, setOpen] = useState(false);

  function update<K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const showFriendsFilter = isLoggedIn === true;
  const hasAppliedFilters = filtersActive(appliedFilters);

  return (
    <section className="mt-4 rounded-none border border-border bg-card">
      <h2 className="sr-only">Filtres</h2>
      <button
        type="button"
        id="explore-filters-trigger"
        aria-expanded={open}
        aria-controls="explore-filters-panel"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      >
        <span className="min-w-0 flex-1 truncate">Filtres</span>
        {hasAppliedFilters ? (
          <span className="shrink-0 text-xs font-medium normal-case tracking-normal text-primary">Actif</span>
        ) : null}
      </button>

      {open ? (
        <div
          id="explore-filters-panel"
          aria-labelledby="explore-filters-trigger"
          className="space-y-3 border-t border-border p-4"
        >
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${showFriendsFilter ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
          >
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Faculté</span>
              <input
                type="text"
                value={filters.faculty}
                onChange={(event) => update("faculty", event.target.value)}
                placeholder="Faculté de l'auteur"
                className="field-input w-full"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Publié à partir du</span>
              <input
                type="date"
                value={filters.createdFrom}
                onChange={(event) => update("createdFrom", event.target.value)}
                className="field-input w-full"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Publié jusqu'au</span>
              <input
                type="date"
                value={filters.createdTo}
                onChange={(event) => update("createdTo", event.target.value)}
                className="field-input w-full"
              />
            </label>
            {showFriendsFilter ? (
              <div className="flex flex-col justify-end text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.friendsOnly}
                    onChange={(event) => update("friendsOnly", event.target.checked)}
                    className="size-4"
                  />
                  <span>Articles d&apos;amis uniquement</span>
                </label>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-nav" onClick={onApply}>
              Appliquer les filtres
            </button>
            {filtersActive(filters) || hasAppliedFilters ? (
              <button type="button" className="btn-nav-sm" onClick={onClear}>
                Effacer les filtres
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
