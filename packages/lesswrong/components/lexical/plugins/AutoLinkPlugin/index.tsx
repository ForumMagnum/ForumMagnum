/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { normalizeUrl } from '../../utils/url';


// One hostname label: 1-63 chars, unicode letters/numbers, no leading/trailing - or _
const HOST_LABEL = '[\\p{L}\\p{N}](?:[\\p{L}\\p{N}_-]{0,61}[\\p{L}\\p{N}])?';

// One or more labels + alphabetic TLD (2-63 chars)
const DOMAIN_NAME = `${HOST_LABEL}(?:\\.${HOST_LABEL})*\\.\\p{L}{2,63}`;

// IPv4 octet 0-255
const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';

// IPv4 address, excluding 0.0.0.0
const IPV4_ADDRESS = `(?!0\\.0\\.0\\.0)(?:${IPV4_OCTET}\\.){3}${IPV4_OCTET}`;

// Host can be localhost, domain, or IPv4
const HOSTNAME = `(?:localhost|${DOMAIN_NAME}|${IPV4_ADDRESS})`;

const URL_REGEX = new RegExp(
  // Require start or whitespace before URL
  '(?<!\\S)(?:' +
    // Scheme URLs (http/https), optional userinfo, full hostname, optional port
    `https?:\\/\\/(?:[^\\s/@]+@)?${HOSTNAME}(?::\\d{1,5})?` +
    '|' +
    // Short-form domains only if www. or user@ prefix is present
    `(?:www\\.|[^\\s/@]+@)${DOMAIN_NAME}(?::\\d{1,5})?` +
    '|' +
    // Allow localhost without scheme
    'localhost(?::\\d{1,5})?' +
    '|' +
    // Allow bare IPv4 addresses
    `${IPV4_ADDRESS}(?::\\d{1,5})?` +
  ')' +
  // Optional path/query/hash
  // Note: We intentionally do not exclude trailing punctuation here because
  // Lexical's boundary checks only treat ".,;" and whitespace as separators.
  // Excluding punctuation in the regex would cause many valid URLs to fail
  // (e.g. "https://example.com)").
  '(?:[/?#][^\\s]*)?' +
  // Anchor to end
  '$',
  'iu'
);

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return normalizeUrl(text);
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return normalizeUrl(text);
  }),
];

export default function LexicalAutoLinkPlugin(): JSX.Element {
  return <AutoLinkPlugin matchers={MATCHERS} />;
}
