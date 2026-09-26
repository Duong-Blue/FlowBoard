import { apiGet } from '../utils/api_helper';
import type {
  SearchSuggestionsParams,
  SearchSuggestionsResponse,
  SearchQueryParams,
  SearchResponse,
} from '../store/types';

export const getSuggestions = (
  params: SearchSuggestionsParams,
  signal?: AbortSignal,
): Promise<SearchSuggestionsResponse> => {
  return apiGet<SearchSuggestionsResponse>('/search/suggestions', {
    params,
    signal,
  });
};

export const fullSearch = <T = any>(
  params: SearchQueryParams,
  signal?: AbortSignal,
): Promise<SearchResponse<T>> => {
  return apiGet<SearchResponse<T>>('/search', {
    params,
    signal,
  });
};
