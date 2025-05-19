/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 *
 * Vendored from https://github.com/ckeditor/ckeditor5-react
 * commit 93d7c69b64a5d13dcac79a17794dc278f4d06fb7
 */
/* eslint-disable no-tabs */

import React from 'react';

import { default as ContextWatchdog } from '../ckeditor5-watchdog/contextwatchdog';
export const ContextWatchdogContext = React.createContext<ContextWatchdog | 'contextWatchdog' | null>( 'contextWatchdog' );

