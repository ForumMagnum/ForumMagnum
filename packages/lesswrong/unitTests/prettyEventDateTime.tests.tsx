/**
 * @jest-environment jsdom
 */
// Register components
import '../lib/index';

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Components } from '../lib/vulcan-lib';

describe('PrettyEventDateTime', () => {
  const { PrettyEventDateTime } = Components;

  it('renders correctly with no start time', () => {
    const post = {
      startTime: null,
      endTime: null,
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} timezone="UTC" />);

    expect(screen.getByText(/TBD/)).toBeInTheDocument()
  });

  it('renders correctly with start time only, no timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T08:00:00.000Z'),
      endTime: null,
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} timezone="UTC" />);
    const timeElement = screen.getByText(/Starts on Mon, Apr 29 at 8 AM UTC/).closest('time');
    expect(timeElement).toHaveAttribute('datetime', post.startTime.toISOString());
  });

  it('renders correctly with start and end time on the same day, no timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T08:00:00.000Z'),
      endTime: new Date('2024-04-29T10:00:00.000Z'),
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} timezone="UTC" />);
    const timeElement = screen.getByText(/Mon, Apr 29 at 8 – 10 AM UTC/).closest('time');
    expect(timeElement).toHaveAttribute('datetime', post.startTime.toISOString());
  });

  it('renders correctly with start and end time on different days, no timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T22:00:00.000Z'),
      endTime: new Date('2024-04-30T02:00:00.000Z'),
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} timezone="UTC" />);

    const startText = /Mon, Apr 29 at 10 PM/;
    const endText = /Tue, Apr 30 at 2 AM UTC/;

    const startElement = screen.getByText(startText).closest('time');
    expect(startElement).toHaveAttribute('datetime', post.startTime.toISOString());
    const endElement = screen.getByText(endText).closest('time');
    expect(endElement).toHaveAttribute('datetime', post.endTime.toISOString());
  });

  it('renders correctly with start time only, dense format, no timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T08:00:00.000Z'),
      endTime: null,
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} dense={true} timezone="UTC" />);
    const timeElement = screen.getByText("Apr 29 at 8 AM UTC").closest('time');
    expect(timeElement).toHaveAttribute('datetime', post.startTime.toISOString());
  });

  it('renders correctly with start and end time on different days, dense format, no timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T22:00:00.000Z'),
      endTime: new Date('2024-04-30T02:00:00.000Z'),
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} dense={true} timezone="UTC" />);

    const startText = /Apr 29 at 10 PM/;
    const endText = /Apr 30 at 2 AM UTC/;

    const startElement = screen.getByText(startText).closest('time');
    expect(startElement).toHaveAttribute('datetime', post.startTime.toISOString());
    const endElement = screen.getByText(endText).closest('time');
    expect(endElement).toHaveAttribute('datetime', post.endTime.toISOString());
  });

  it('renders correctly with start and end time on the same day, after timezone conversion', () => {
    const post = {
      startTime: new Date('2024-04-29T22:00:00.000Z'),
      endTime: new Date('2024-04-30T02:00:00.000Z'),
      localStartTime: null,
      localEndTime: null,
    };
    render(<PrettyEventDateTime post={post} timezone="America/Los_Angeles" />);

    const timeElement = screen.getByText(/Mon, Apr 29 at 3 – 7 PM PDT/).closest('time');
    // datetime="..." should still be in ISO format
    expect(timeElement).toHaveAttribute('datetime', post.startTime.toISOString());
  });

  it('renders correctly with local times, but no timezone information about the user', () => {
    const post = {
      startTime: new Date('2024-04-29T22:00:00.000Z'),
      endTime: new Date('2024-04-30T02:00:00.000Z'),
      // Local time as if the event is in "America/Los_Angeles"
      localStartTime: new Date('2024-04-29T15:00:00.000Z'),
      localEndTime: new Date('2024-04-29T19:00:00.000Z'),
    };
    render(<PrettyEventDateTime post={post} />);

    // Get exact text, there should be no "PDT" in the string
    const timeElement = screen.getByText("Mon, Apr 29 at 3 – 7 PM").closest('time');
    // datetime="..." should be using `startTime`, not `localStartTime` (which is wrong as an ISO string because it's stored as though it's in UTC)
    expect(timeElement).toHaveAttribute('datetime', post.startTime.toISOString());
  });
});
