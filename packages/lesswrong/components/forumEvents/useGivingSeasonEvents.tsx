import React, { Dispatch, ReactNode, createContext, useContext, useState } from "react";
import { Link } from "@/lib/reactRouterWrapper";
import moment, { Moment } from "moment";

type GivingSeasonEvent = {
  name: string,
  description: ReactNode,
  start: Moment,
  end: Moment,
  background: string,
  darkText?: boolean,
}

const events: GivingSeasonEvent[] = [
  {
    name: "Funding Diversification Week",
    description: <>This week, we are encouraging content around a range of important funding considerations. <Link to="#">Read more</Link>.</>,
    start: moment("2024-11-04").utc(),
    end: moment("2024-11-10").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143995/Rectangle_5034.jpg",
  },
  {
    name: "Marginal Funding Week",
    description: <>Here is a description of what Marginal Funding Week is and how to engage with it. Probably also a <Link to="#">link to the posts</Link>.</>,
    start: moment("2024-11-12").utc(),
    end: moment("2024-11-18").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5064.jpg",
  },
  {
    name: "Donation Election",
    description: <>A crowd-sourced pot of funds will be distributed amongst three charities based on your votes. <Link to="#">Find out more</Link>.</>,
    start: moment("2024-11-18").utc(),
    end: moment("2024-12-03").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5069.jpg",
  },
  {
    name: "Pledge Highlight",
    description: <>A week to post about your experience with pledging, and to discuss the value of pledging. <Link to="#">Read more</Link>.</>,
    start: moment("2024-12-16").utc(),
    end: moment("2024-12-22").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5072.jpg",
  },
  {
    name: "Donation Celebration",
    description: <>When the donation celebration starts, you’ll be able to add a heart to the banner showing that you’ve done your annual donations.</>,
    start: moment("2024-12-23").utc(),
    end: moment("2024-12-31").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5075.jpg",
    darkText: true,
  },
];

type GivingSeasonEventsContext = {
  events: GivingSeasonEvent[],
  selectedEvent: GivingSeasonEvent,
  setSelectedEvent: Dispatch<GivingSeasonEvent>,
  amountRaised: number,
  amountTarget: number,
}

const givingSeasonEventsContext = createContext<GivingSeasonEventsContext>({
  events,
  selectedEvent: events[0],
  setSelectedEvent: () => {},
  amountRaised: 0,
  amountTarget: 10000,
});

export const GivingSeasonEventsProvider = ({children}: {children: ReactNode}) => {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  return (
    <givingSeasonEventsContext.Provider value={{
      events,
      selectedEvent,
      setSelectedEvent,
      amountRaised: 0, // TODO: Where does this come from?
      amountTarget: 10000,
    }}>
      {children}
    </givingSeasonEventsContext.Provider>
  );
}

export const useGivingSeasonEvents = () => useContext(givingSeasonEventsContext);
