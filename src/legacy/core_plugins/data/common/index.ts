/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/** @public static code */
export { dateHistogramInterval } from './date_histogram_interval';
/** @public static code */
export {
  isValidEsInterval,
  InvalidEsCalendarIntervalError,
  InvalidEsIntervalFormatError,
  parseEsInterval,
  ParsedInterval,
} from './parse_es_interval';

export interface SearchOptions {
  onProgress?: (shards: ShardProgress) => void;
  signal?: AbortSignal;
  strategy?: string;
  sessionId?: string;
}

export interface ShardProgress {
  failed: number;
  skipped: number;
  successful: number;
  total: number;
}
