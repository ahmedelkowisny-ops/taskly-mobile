import { apiRequest } from './client';
import {
  CatalogCategoriesResponse,
  CitiesCatalogResponse,
  PostingRulesResponse,
} from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';

export function getCities(authToken?: string | null): Promise<ApiResult<CitiesCatalogResponse>> {
  return apiRequest<CitiesCatalogResponse>(endpoints.catalog.cities, { authToken: authToken ?? undefined });
}

export function getCoreCategories(authToken?: string | null): Promise<ApiResult<CatalogCategoriesResponse>> {
  return apiRequest<CatalogCategoriesResponse>(endpoints.catalog.coreCategories, {
    authToken: authToken ?? undefined,
  });
}

export function getProCategories(authToken?: string | null): Promise<ApiResult<CatalogCategoriesResponse>> {
  return apiRequest<CatalogCategoriesResponse>(endpoints.catalog.proCategories, {
    authToken: authToken ?? undefined,
  });
}

export function getPostingRules(authToken?: string | null): Promise<ApiResult<PostingRulesResponse>> {
  return apiRequest<PostingRulesResponse>(endpoints.catalog.postingRules, { authToken: authToken ?? undefined });
}
