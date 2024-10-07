import { Resource, ResourceFilter, ResourceFilters } from '~/framework/modules/mediacentre/model';

const getUniqueValues = (values: string[]): ResourceFilter[] =>
  [...new Set(values)].map(value => ({ name: value, isActive: false })).sort((a, b) => a.name.localeCompare(b.name));

export const getFilters = (resources: Resource[]): ResourceFilters => {
  return {
    disciplines: getUniqueValues(resources.flatMap(r => r.disciplines)),
    levels: getUniqueValues(resources.flatMap(r => r.levels)),
    sources: getUniqueValues(resources.map(r => r.source.toString())),
    types: getUniqueValues(resources.flatMap(r => r.types)),
  };
};

export const getActiveFilterCount = (filters: ResourceFilters): number =>
  filters.disciplines.filter(f => f.isActive).length ||
  filters.levels.filter(f => f.isActive).length ||
  filters.sources.filter(f => f.isActive).length ||
  filters.types.filter(f => f.isActive).length;

const checkValueMatchesFilters = (value: string[], filters: ResourceFilter[]): boolean => {
  const activeFilterNames = filters.filter(f => f.isActive).map(f => f.name);

  if (!activeFilterNames.length) return true;
  return value.some(v => activeFilterNames.includes(v));
};

export const checkResourceMatchesFilters = (resource: Resource, filters: ResourceFilters): boolean =>
  checkValueMatchesFilters(resource.disciplines, filters.disciplines) &&
  checkValueMatchesFilters(resource.levels, filters.levels) &&
  checkValueMatchesFilters([resource.source], filters.sources) &&
  checkValueMatchesFilters(resource.types, filters.types);
