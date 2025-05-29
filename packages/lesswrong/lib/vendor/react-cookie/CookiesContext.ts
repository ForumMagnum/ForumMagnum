import * as React from 'react';
import Cookies from "universal-cookie";

const CookiesContext = React.createContext<Cookies | null>(null);

export const { Provider, Consumer } = CookiesContext;
export default CookiesContext;
