import { api } from '../utils/api_helper';
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
  return api.get<SearchSuggestionsResponse>('/search/suggestions', {
    params,
    signal,
  }).then(res => res.data);
};

export const fullSearch = <T = any>(
  params: SearchQueryParams,
  signal?: AbortSignal,
): Promise<SearchResponse<T>> => {
  return api.get<SearchResponse<T>>('/search', {
    params,
    signal,
  }).then(res => res.data);
};
